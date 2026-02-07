# Story 5.3: Health Check Data Pruning & Scalability

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system administrator,
I want health check data automatically pruned and rate limits handled gracefully,
So that the database stays performant as monitoring scales.

## Acceptance Criteria

1. **Given** health check data accumulates **When** the record count exceeds 1000 per system **Then** older records are pruned automatically (database trigger or scheduled job)

2. **Given** health checks are running at scale (10+ systems) **When** checks execute concurrently **Then** rate limits are handled gracefully without overwhelming target systems (NFR-P10)

3. **Given** the database has accumulated health check records **When** I check storage and query performance **Then** the `health_checks` table handles up to 100,000 records efficiently with proper indexing (NFR-SC3)

## Tasks / Subtasks

- [ ] Task 1: Create PostgreSQL trigger for automatic data pruning (AC: #1)
  - [ ] 1.1 Create migration `supabase/migrations/<timestamp>_add_health_check_pruning_trigger.sql`
  - [ ] 1.2 Create PL/pgSQL function `prune_old_health_checks()` that:
    - Fires AFTER INSERT on `health_checks`
    - Counts rows for the inserted `system_id`
    - If count > 1000, deletes the oldest rows (keeping newest 1000)
    - Uses `DELETE ... WHERE id IN (SELECT id ... ORDER BY checked_at ASC LIMIT excess_count)` for efficiency
  - [ ] 1.3 Create trigger `trigger_prune_health_checks` on `health_checks` AFTER INSERT FOR EACH ROW

- [ ] Task 2: Add concurrency limiter to `runAllHealthChecks()` (AC: #2)
  - [ ] 2.1 Implement `pLimit`-style concurrency control (inline, no external dependency)
  - [ ] 2.2 Limit concurrent outbound requests to 5 systems at a time (configurable)
  - [ ] 2.3 Add staggered start delay (jitter: 0-500ms per batch) to prevent thundering herd
  - [ ] 2.4 Update `runAllHealthChecks()` in `src/lib/health/mutations.ts` to use limiter

- [ ] Task 3: Add performance indexes for query optimization (AC: #3)
  - [ ] 3.1 In same migration: Add composite index `idx_health_checks_system_status` on `health_checks(system_id, status, checked_at DESC)` for filtered queries
  - [ ] 3.2 Add partial index `idx_health_checks_failures` on `health_checks(system_id, checked_at DESC) WHERE status = 'failure'` for failure-only queries
  - [ ] 3.3 Verify existing `idx_health_checks_system_id` on `(system_id, checked_at DESC)` is still optimal

- [ ] Task 4: Add pruning verification query helper (AC: #1, #3)
  - [ ] 4.1 Create `getHealthCheckCount(systemId)` in `src/lib/health/queries.ts` — returns row count per system
  - [ ] 4.2 This is a utility for admin/dashboard use — not called by cron

- [ ] Task 5: Write unit tests for concurrency limiter (AC: #2)
  - [ ] 5.1 Test `runAllHealthChecks()` limits concurrent requests to 5
  - [ ] 5.2 Test all systems still get checked (no dropped checks)
  - [ ] 5.3 Test with 1, 5, 10, 15 systems — verify batching behavior
  - [ ] 5.4 Test error in one batch doesn't block subsequent batches

- [ ] Task 6: Write integration-style tests for pruning logic (AC: #1)
  - [ ] 6.1 Test pruning trigger function logic (mock the SQL behavior in unit tests)
  - [ ] 6.2 Test `getHealthCheckCount()` returns correct count
  - [ ] 6.3 Verify pruning preserves the 1000 newest records per system

- [ ] Task 7: Write tests for performance under load (AC: #3)
  - [ ] 7.1 Test `getRecentHealthChecks()` query with large result sets
  - [ ] 7.2 Test `getLatestHealthCheck()` uses index efficiently (single row)
  - [ ] 7.3 Verify queries include proper `.limit()` calls to prevent unbounded results

- [ ] Task 8: Verify pre-commit checks pass
  - [ ] 8.1 `npm run type-check` — 0 errors
  - [ ] 8.2 `npm run lint` — 0 errors
  - [ ] 8.3 `npm run test` — all tests pass
  - [ ] 8.4 `npm run size` — all routes within budget
  - [ ] 8.5 `npm run story-metrics` — verify File List matches actual changes

## Dev Notes

### Story 5.1 & 5.2 Built the Pipeline — This Story Adds Sustainability

**Story 5.1 established:**
- Health check execution (`src/lib/health/check.ts`) — HTTP HEAD with timeout, fallback to GET
- Data recording (`src/lib/health/mutations.ts`) — `recordHealthCheck()`, `updateSystemHealthStatus()`, `runAllHealthChecks()`
- Cron trigger (`src/app/api/cron/health-check/route.ts`) — Vercel Cron + GitHub Actions every 5 min
- Service client (`src/lib/supabase/service.ts`) — synchronous, bypasses RLS

**Story 5.2 added intelligence:**
- Retry with exponential backoff (`checkSystemHealthWithRetry()`)
- Failure counter tracking (`incrementConsecutiveFailures()`, `resetConsecutiveFailures()`)
- Threshold-based offline detection (`DEFAULT_FAILURE_THRESHOLD = 3`)
- Recovery path: single success → online

**What Story 5.1/5.2 explicitly deferred to this story:**
- No data pruning — health_checks table grows unbounded
- No concurrency limiting — all systems checked simultaneously
- No optimization for 100K+ records

### Architecture Decision: PostgreSQL Trigger for Pruning (AC #1)

**Why a trigger (not a separate cron job or inline cleanup):**
- **Atomic:** Pruning happens in the same transaction as INSERT — no race conditions
- **Zero latency impact on cron:** The trigger runs asynchronously after the INSERT commits
- **Self-contained:** No additional cron job to maintain, no cleanup endpoint to secure
- **Reliable:** Can't forget to call it — fires automatically on every INSERT

**Why 1000 records per system (architecture spec):**
- At 5-minute intervals: 1000 records = ~3.5 days of history per system
- Sufficient for Story 5.8 (Historical Health Check Data) trend analysis
- With 10 systems × 1000 records = 10,000 rows max — well under NFR-SC3's 100,000 target
- Story 5.7 allows configurable intervals (more frequent = fewer days of history)

**Pruning Strategy — DELETE excess rows:**
```sql
CREATE OR REPLACE FUNCTION prune_old_health_checks()
RETURNS TRIGGER AS $$
DECLARE
  row_count INTEGER;
  excess INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count
  FROM health_checks
  WHERE system_id = NEW.system_id;

  IF row_count > 1000 THEN
    excess := row_count - 1000;
    DELETE FROM health_checks
    WHERE id IN (
      SELECT id FROM health_checks
      WHERE system_id = NEW.system_id
      ORDER BY checked_at ASC
      LIMIT excess
    );
  END IF;

  RETURN NULL; -- AFTER trigger, return value is ignored
END;
$$ LANGUAGE plpgsql;
```

**Performance consideration:** The COUNT + DELETE runs per-INSERT, but:
- Only deletes when count > 1000 (rare — typically deletes 1 row at a time)
- The `idx_health_checks_system_id` index on `(system_id, checked_at DESC)` makes both the COUNT and the DELETE subquery efficient
- At 5-minute intervals with 10 systems, that's ~2 INSERTs/minute — negligible trigger overhead

### Architecture Decision: Inline Concurrency Limiter (AC #2)

**Why an inline `pLimit`-style limiter (not the `p-limit` npm package):**
- `p-limit` is 23 lines of code — no need for an external dependency
- Avoids bundle bloat for a single utility function
- Server-only code, no client bundle impact

**Why limit to 5 concurrent requests:**
- 10 systems / 5 concurrent = 2 batches — total time ~20s worst case (10s timeout × 2)
- Well within Vercel's 60-second function timeout
- Prevents overwhelming DNS or network infrastructure
- With retry logic: worst case per system is 33s, but with 5 concurrent limit, total is 33s × 2 batches = ~66s — tight but within 60s if most succeed quickly
- **Safety margin:** At 5-min intervals, no risk of overlapping cron runs

**Implementation — simple semaphore pattern:**
```typescript
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = []
  const executing = new Set<Promise<void>>()

  for (const task of tasks) {
    const p = task()
      .then((value) => results.push({ status: 'fulfilled', value }))
      .catch((reason) => results.push({ status: 'rejected', reason }))
      .then(() => executing.delete(p as unknown as Promise<void>))
    executing.add(p as unknown as Promise<void>)

    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}
```

**Note:** The actual implementation should preserve the order of results to match the `systems` array index, since `runAllHealthChecks()` correlates results by index (`results[i]` ↔ `systems[i]`). Use an index-based approach instead.

### Architecture Decision: Additional Indexes (AC #3)

**Current index:** `idx_health_checks_system_id ON health_checks(system_id, checked_at DESC)` — covers most queries.

**New indexes for scalability:**
1. **`idx_health_checks_system_status`** on `(system_id, status, checked_at DESC)` — for filtered queries like "show me all failures for system X" (Story 5.8 dashboard)
2. **`idx_health_checks_failures`** partial index on `(system_id, checked_at DESC) WHERE status = 'failure'` — optimizes failure-only lookups for alerting (Story 5.6)

**Why partial index for failures:**
- Failures are rare (hopefully <5% of records)
- A partial index is much smaller than a full index
- Dramatically speeds up "find recent failures" queries

**Index sizing at 100K records:**
- Full composite index: ~3-4 MB (acceptable)
- Partial failure index: ~200-400 KB (minimal overhead)

### Concurrency & Rate Limiting Considerations (NFR-P10)

**Current state (Story 5.2):** All systems checked simultaneously with `Promise.allSettled()`.

**Problem at scale:**
- 10 simultaneous HTTP requests = fine for MVP
- 50+ systems = potential DNS flooding, network saturation, firewall rate limiting
- Target systems may have their own rate limits

**Solution layers:**
1. **Concurrency limiter (this story):** Cap at 5 concurrent requests
2. **Jitter (from Story 5.2):** Full jitter in retry backoff prevents thundering herd within retries
3. **Staggered start (this story):** Small random delay (0-500ms) before each batch to spread DNS lookups
4. **Story 5.7 (future):** Per-system configurable intervals — not all systems need to be checked simultaneously

### Existing Health Check File Map

**MODIFY (existing files):**
- `src/lib/health/mutations.ts` — replace `Promise.allSettled()` with concurrency-limited version
- `src/lib/health/mutations.test.ts` — add concurrency limiter tests
- `src/lib/health/queries.ts` — add `getHealthCheckCount()` helper
- `src/lib/health/queries.test.ts` — add count query tests

**CREATE (new files):**
- `supabase/migrations/<timestamp>_add_health_check_pruning_trigger.sql` — trigger + function + new indexes

**NO CLIENT-SIDE CHANGES** — this is entirely server-side / database infrastructure. Zero bundle impact.

### Project Structure Notes

- All changes within existing `src/lib/health/` module — no new directories
- Migration file follows existing naming: `supabase/migrations/<timestamp>_description.sql`
- New indexes co-located with trigger in same migration (single deployment unit)
- `getHealthCheckCount()` follows existing pattern in `queries.ts` (server client, snake→camelCase transform)

### Vercel Cron Timing with Concurrency Limit

**Before (Story 5.2):** All 10 systems in parallel → ~33s worst case (slowest retry chain)

**After (this story):** 5 concurrent × 2 batches → ~66s worst case (if ALL systems timeout + max retries)

**Risk:** 66s > 60s Vercel Hobby limit. Mitigation:
- Most systems respond in <5s — realistic total is 10-15s
- The 66s worst case assumes ALL 10 systems timeout on ALL 3 attempts — extremely unlikely
- `maxDuration = 60` in route.ts — Vercel will abort if exceeded (graceful failure)
- If this becomes a real issue, Story 5.7's per-system intervals will stagger checks naturally

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3 — Acceptance criteria]
- [Source: _bmad-output/planning-artifacts/epics.md#line 178 — "Data retention: Health checks last 1000/system"]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P10 — Graceful rate limit handling]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-SC3 — Handle 100,000 health check records]
- [Source: src/lib/health/mutations.ts — Current `runAllHealthChecks()` with `Promise.allSettled()`]
- [Source: src/lib/health/check.ts — `checkSystemHealthWithRetry()` with exponential backoff]
- [Source: src/lib/health/queries.ts — `getRecentHealthChecks()`, `getLatestHealthCheck()`]
- [Source: src/lib/validations/health.ts — `HEALTH_CHECK_SELECT`, `healthCheckSchema`]
- [Source: src/lib/supabase/service.ts — Service role client (synchronous, bypasses RLS)]
- [Source: src/lib/test-utils/mock-factories.ts — `createMockHealthCheck`, `createMockHealthCheckList`]
- [Source: supabase/migrations/20260209000001_create_health_checks_table.sql — Existing table + index]
- [Source: supabase/migrations/20260210000001_add_consecutive_failures_to_systems.sql — Story 5.2 migration]

### Previous Story Intelligence

**From Story 5.2 (Failure Detection, Retry Logic & Recovery):**
- `runAllHealthChecks()` creates 1 ServiceClient and passes to all helpers (refactored in code review)
- `Promise.allSettled()` used for concurrent execution — must be replaced with concurrency-limited version while preserving same result structure
- Results are correlated by index: `results[i]` ↔ `systems[i]` — concurrency limiter MUST preserve ordering
- Helper functions accept optional `ServiceClient` param — reuse same client instance
- Test pattern: mock Supabase chain + `vi.mock('@/lib/supabase/service')`
- Code review lesson: `sleep()` is module-private (not exported) — don't re-export it
- Code review lesson: `fetchWithTimeout()` gives each request a fresh AbortController

**From Story 5.1 (Basic Health Check Service & Status Updates):**
- `revalidatePath('/')` called ONCE at end of `runAllHealthChecks()` — must remain after all batches complete
- `maxDuration = 60` exported from cron route — Vercel Hobby plan max
- Service client is synchronous: `const supabase = createServiceClient()` (no `await`)
- GitHub Actions cron at `.github/workflows/health-check-cron.yml` — fires every 5 min

**Patterns to reuse:**
- Same mock Supabase chain pattern: `from().select().eq().single()`
- Same `vi.mock('@/lib/supabase/service')` pattern
- Same `console.info/error/warn` logging pattern for cron operations
- `createMockHealthCheck()` and `createMockHealthCheckList()` factories

### Git Intelligence

Recent commits show consistent patterns:
- `feat(health): add failure detection with retry logic and recovery (story 5-2)` — most recent health commit
- `fix(health): code review fixes for story 5-2` — code review follow-up
- Expected commit: `feat(health): add data pruning trigger and concurrency limiter (story 5-3)`
- Convention: `feat(scope): description (story X-Y)`

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->
