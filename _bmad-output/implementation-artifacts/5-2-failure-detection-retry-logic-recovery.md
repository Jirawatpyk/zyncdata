# Story 5.2: Failure Detection, Retry Logic & Recovery

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system administrator,
I want the system to intelligently detect failures with retry logic and recover from transient issues,
So that status indicators are accurate and false positives are minimized.

## Acceptance Criteria

1. **Given** a system fails consecutive checks equal to the failure threshold (default: 3) **When** the threshold is reached **Then** the system status is updated to "offline" in the `systems` table

2. **Given** a previously offline system responds successfully **When** the health check succeeds **Then** the system status is updated back to "online" and the failure counter resets (consecutive_failures = 0)

3. **Given** a transient network failure occurs **When** the health check service retries with exponential backoff **Then** the system recovers within 5 minutes (NFR-R3: auto-recover from transient network failures within 5 minutes)

4. **Given** the health monitoring system detects failures **When** I check detection accuracy **Then** the system achieves >= 95% accuracy in detecting actual failures (NFR-R2: health monitoring ≥ 95% accuracy)

## Tasks / Subtasks

- [x] Task 1: Add `consecutive_failures` column to `systems` table (AC: #1, #2)
  - [x] 1.1 Create migration `supabase/migrations/20260210000001_add_consecutive_failures_to_systems.sql`
  - [x] 1.2 Manually update `src/types/database.ts` (local Supabase not running)

- [x] Task 2: Add retry with exponential backoff to health check execution (AC: #3)
  - [x] 2.1–2.7 All subtasks completed in `src/lib/health/check.ts`

- [x] Task 3: Implement failure counter tracking in mutations (AC: #1, #2)
  - [x] 3.1–3.3 All subtasks completed in `src/lib/health/mutations.ts`

- [x] Task 4: Update `runAllHealthChecks()` with failure detection logic (AC: #1, #2, #3, #4)
  - [x] 4.1–4.5 All subtasks completed

- [x] Task 5: Update validation schemas (AC: #1, #2)
  - [x] 5.1–5.3 All subtasks completed

- [x] Task 6: Write unit tests for retry logic (AC: #3)
  - [x] 6.1 All 13 new tests for `checkSystemHealthWithRetry()`, `isRetryable()`, `sleep()`

- [x] Task 7: Write unit tests for failure counter logic (AC: #1, #2)
  - [x] 7.1 All 15 new tests for counter functions + `runAllHealthChecks()` scenarios

- [x] Task 8: Update existing tests for breaking changes (AC: #1, #2)
  - [x] 8.1–8.5 Updated 8 test files with `consecutiveFailures: 0` / `consecutive_failures: 0`

- [x] Task 9: Verify pre-commit checks pass
  - [x] 9.1 `npm run type-check` — 0 errors
  - [x] 9.2 `npm run lint` — 0 errors from story 5-2 (2 errors from concurrent story 4-2 work)
  - [x] 9.3 `npm run test` — 1233/1233 passed (107 test files)
  - [x] 9.4 `npm run size` — all routes within budget
  - [x] 9.5 `npm run story-metrics` — 1233 tests, 376 suites

## Dev Notes

### Story 5.1 Built the Pipeline — This Story Adds Intelligence

Story 5.1 established:
- **Health check execution** (`src/lib/health/check.ts`) — HTTP HEAD with timeout, fallback to GET
- **Data recording** (`src/lib/health/mutations.ts`) — `recordHealthCheck()`, `updateSystemHealthStatus()`, `runAllHealthChecks()`
- **Cron trigger** (`src/app/api/cron/health-check/route.ts`) — Vercel Cron every 5 min with `CRON_SECRET`
- **Service client** (`src/lib/supabase/service.ts`) — synchronous, bypasses RLS for cron mutations

**What Story 5.1 explicitly deferred to this story:**
- System status is NOT changed to "offline" on failure (only records `health_checks` entry)
- No consecutive failure tracking — single failure = no status change
- No retry logic — one attempt per system per cron run

### Architecture Decision: Consecutive Failures Counter

**Why `consecutive_failures` column on `systems` table (not derived from `health_checks`)?**
- **Performance:** Incrementing a counter is O(1) vs. querying last N health_checks is O(N)
- **Atomicity:** `SET consecutive_failures = consecutive_failures + 1` is atomic in PostgreSQL
- **Simplicity:** Reset to 0 on success is trivial
- **Cron constraint:** With 5-min intervals, checking 3 consecutive failures from `health_checks` would require querying 15+ minutes of data and handling edge cases around timing

**Threshold = 3 consecutive failures → offline:**
- At 5-minute intervals: 15 minutes to detect a real outage (3 × 5 min)
- This prevents false positives from single transient network blips
- Story 5.7 will make this configurable per-system

### Architecture Decision: Retry Strategy

**Retry with exponential backoff WITHIN a single cron run:**
- First attempt fails → wait 1s → retry → wait 2s → retry (3 attempts total)
- Total max time per system: 3 × 10s timeout + 1s + 2s = 33s
- With `Promise.allSettled()`, all systems retry in parallel — worst case ~33s total
- Well within Vercel's 60-second function timeout

**Retry classification via `errorMessage` inspection:**
- `checkSystemHealth()` returns `HealthCheckResult` (never throws). Classify by `errorMessage`:
- `"Request timed out"` → RETRY (transient)
- `"Network error: ..."` → RETRY (transient)
- `"Unknown error: ..."` → RETRY (safety)
- `"HTTP ..."` → NO RETRY — server responded definitively; retrying won't help. The consecutive failure counter handles persistent issues across cron runs (3 × 5 min = 15 min recovery window).
- **Helper:** `const isRetryable = (r: HealthCheckResult) => r.status === 'failure' && r.errorMessage != null && !r.errorMessage.startsWith('HTTP')`

### Recovery Path (AC #2)

When a system goes offline (consecutive_failures >= 3), recovery happens naturally:
1. Next cron run tries `checkSystemHealthWithRetry()` (with retries)
2. If ANY attempt succeeds → `resetConsecutiveFailures()` + `status = 'online'`
3. The system is immediately back online — no gradual recovery needed
4. This is within 5 minutes (single cron interval) satisfying NFR-R3

### How 95% Detection Accuracy is Achieved (NFR-R2)

- **False positive prevention:** 3 consecutive failures required (filters out transient blips)
- **Retry logic:** 2 retries with backoff catches transient network issues before recording failure
- **Immediate recovery:** Single success resets counter — no lag in detecting recovery
- **Clear failure classification:** HTTP 4xx/5xx = definitive failure (no retry), timeout/network = retry first
- **Combined:** Retries handle transient noise, threshold handles persistent issues

### Supabase `RETURNING` Clause for Atomic Increment

For `incrementConsecutiveFailures()`, use Supabase `.rpc()` or raw update with `.select()`:
```typescript
const { data, error } = await supabase
  .from('systems')
  .update({ consecutive_failures: ??? }) // Can't do consecutive_failures + 1 directly
  .eq('id', systemId)
  .select('consecutive_failures')
  .single()
```

**IMPORTANT:** Supabase PostgREST doesn't support `column = column + 1` in updates. Two approaches:

**Option A (Recommended): Read-then-write with service client:**
```typescript
// Service client bypasses RLS — single user (cron), no race condition risk
const { data: system } = await supabase.from('systems').select('consecutive_failures').eq('id', systemId).single()
const newCount = (system?.consecutive_failures ?? 0) + 1
await supabase.from('systems').update({ consecutive_failures: newCount }).eq('id', systemId)
return newCount
```

**Option B: PostgreSQL function (if atomicity is critical at scale):**
- Create a PL/pgSQL function for atomic increment
- Overkill for MVP with single cron runner — no concurrent writers

Use **Option A** — the cron is the only writer, and service client has full access. No race conditions possible.

### Files to Modify vs. Create

**MODIFY (existing files):**
- `src/lib/health/check.ts` — add `checkSystemHealthWithRetry()`
- `src/lib/health/check.test.ts` — add retry tests
- `src/lib/health/mutations.ts` — add counter functions, update `runAllHealthChecks()`
- `src/lib/health/mutations.test.ts` — add counter + failure detection tests
- `src/lib/validations/system.ts` — add `consecutiveFailures` to schema
- `src/lib/systems/queries.ts` — add `consecutive_failures` to `SYSTEM_SELECT_COLUMNS`
- `src/lib/test-utils/mock-factories.ts` — add `consecutiveFailures: 0` to `SYSTEM_DEFAULTS`
- `src/types/database.ts` — regenerated via `npm run db:types`

**TEST BLAST RADIUS (manual `toEqual()` fixes needed in 2 files):**
- `src/app/api/systems/[id]/route.test.ts` — 3 assertions
- `src/lib/admin/mutations/systems.test.tsx` — 8+ assertions + cache snapshots
- Other 8 test files using `createMockSystem` are auto-fixed by the factory update

**CREATE (new files):**
- `supabase/migrations/<timestamp>_add_consecutive_failures_to_systems.sql` — new column

**NO NEW DOMAIN FILES** — this story enhances existing health module code, not creating new modules.

### Project Structure Notes

- Alignment with unified project structure: all changes are within existing `src/lib/health/` module
- No new directories needed — `supabase/migrations/` already exists
- Schema changes cascade via `npm run db:types` to `src/types/database.ts`
- `SYSTEM_SELECT_COLUMNS` update ensures all query paths pick up the new column

### Vercel Cron Timing Constraint

Cron runs every 5 minutes. With retry logic:
- Per system: up to 33s (3 attempts × 10s timeout + 2 delays of 1s + 2s)
- All systems run in parallel via `Promise.allSettled()`
- Total execution: ~33s worst case (bounded by slowest system)
- Well within 60s Vercel Hobby function timeout
- No risk of overlapping cron runs (5 min interval >> 33s execution)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2 — Acceptance criteria]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-R2, NFR-R3 — Performance requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Health Check Configuration — Default thresholds]
- [Source: _bmad-output/project-context.md#Health Check Testing Patterns — Test strategies]
- [Source: src/lib/health/check.ts — Existing health check execution (Story 5.1)]
- [Source: src/lib/health/mutations.ts — Existing mutation functions (Story 5.1)]
- [Source: src/lib/supabase/service.ts — Service role client (synchronous, bypasses RLS)]
- [Source: src/lib/systems/queries.ts — SYSTEM_SELECT_COLUMNS]
- [Source: src/lib/validations/system.ts — systemSchema]
- [Source: src/lib/test-utils/mock-factories.ts — createMockSystem, createMockHealthCheck]

### Previous Story Intelligence

**From Story 5.1 (Basic Health Check Service & Status Updates):**
- `checkSystemHealth()` returns `HealthCheckResult` — never throws, errors are data
- `updateSystemHealthStatus()` accepts `status: string | null` — null means "don't change status"
- `runAllHealthChecks()` uses `Promise.allSettled()` for concurrent execution
- Service client is synchronous: `const supabase = createServiceClient()` (no `await`)
- `recordHealthCheck()` uses typed `HealthCheckInsert` for Supabase insert
- `revalidatePath('/')` called after all checks complete
- 39 tests across 4 files — must not break any

**Scope Additions from Story 5.1:**
- Used typed `HealthCheckInsert` instead of `toSnakeCase()` for insert
- `updateSystemHealthStatus` accepts `status: string | null` — null = don't update status field

**Patterns to reuse:**
- Same mock Supabase chain pattern: `from().select().eq().single()` etc.
- Same `vi.mock('@/lib/supabase/service')` pattern for service client mocking
- Same `console.info/error/warn` logging pattern for cron operations
- Same `vi.stubGlobal('fetch', ...)` for mocking HTTP requests in retry tests

### Git Intelligence

Recent commits show consistent patterns:
- `feat(health): add basic health check service and status updates (story 5-1)` — most recent health commit
- `fix(cms): code review fixes for story 4-1` — latest commit
- Expected commit: `feat(health): add failure detection with retry logic and recovery (story 5-2)`
- Convention: `feat(scope): description (story X-Y)`

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| Manually updated `database.ts` instead of `npm run db:types` | Local Supabase not running | Same result, verified by type-check |
| Fixed `BrandingManager.test.tsx` missing `async` on `beforeEach` | Concurrent story 4-2 had TS error blocking type-check | 1-line fix, not 5-2 scope |
| Added `consecutiveFailures` to `src/lib/admin/mutations/systems.ts` optimistic object | Source file had inline System literal missing new field | Required for type-check |
| Updated 4 additional guardrails test files | Inline System objects missing `consecutiveFailures` | Test blast radius wider than estimated |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Exponential backoff test: `vi.spyOn` on module-level `sleep` didn't intercept — switched to timestamp-based assertion
- Test blast radius: 8 test files needed manual `consecutiveFailures` addition (story estimated 2)

### Completion Notes List

- All 4 ACs satisfied: threshold detection, recovery, retry with backoff, 95% accuracy design
- 1233 total tests passing (61 new from story 5-2 + concurrent 4-2 work)
- Bundle budget: no change (server-only code, no client bundle impact)
- Lint: 0 errors from 5-2 scope (2 errors from concurrent 4-2 branding components)

### File List

**Created (1):**
- `supabase/migrations/20260210000001_add_consecutive_failures_to_systems.sql`

**Modified (14):**
- `src/lib/health/check.ts` — added `isRetryable()`, `sleep()`, `checkSystemHealthWithRetry()`
- `src/lib/health/check.test.ts` — 13→26 tests (+13 new)
- `src/lib/health/mutations.ts` — added counter functions, updated `runAllHealthChecks()`
- `src/lib/health/mutations.test.ts` — 10→25 tests (+15 new, rewritten)
- `src/lib/validations/system.ts` — added `consecutiveFailures` to schema
- `src/lib/systems/queries.ts` — added `consecutive_failures` to SELECT
- `src/lib/test-utils/mock-factories.ts` — added `consecutiveFailures: 0`
- `src/types/database.ts` — added `consecutive_failures` to systems types
- `src/lib/admin/mutations/systems.ts` — added `consecutiveFailures: 0` to optimistic object
- `src/lib/systems/mutations.test.ts` — added `consecutive_failures` to mock objects
- `src/lib/systems/queries.test.ts` — added `consecutive_failures` to mocks + EXPECTED_SELECT
- `src/lib/systems/queries.guardrails.test.ts` — added `consecutive_failures` to mock
- `src/lib/validations/system.test.ts` — added `consecutiveFailures` to mock
- `src/app/api/systems/[id]/logo/route.guardrails.test.ts` — added `consecutiveFailures`
- `src/app/api/systems/[id]/toggle/route.guardrails.test.ts` — added `consecutiveFailures` (2 places)
- `src/app/api/systems/route.guardrails.test.ts` — added `consecutiveFailures`

### Test Metrics

- **Test files:** 107 (was ~90 pre-story)
- **Test suites:** 376 passed
- **Tests:** 1233 passed
