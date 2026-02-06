# Story 5.1: Basic Health Check Service & Status Updates

Status: dev-complete

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system administrator,
I want automated health checks running against all portfolio systems at regular intervals,
So that system status is continuously monitored without manual effort.

## Acceptance Criteria

1. **Given** systems exist in the portfolio **When** the health check cron job executes (default: every 5 minutes via Vercel Cron) **Then** an HTTP HEAD request is sent to each enabled system's URL with a configurable timeout (default: 10 seconds) **And** responses are recorded as "success" with `response_time` in milliseconds (NFR-P4: responses within 5 seconds are considered healthy; slower responses still succeed but are recorded with their actual response time)
2. **Given** a system responds successfully (HTTP 2xx/3xx) **When** the health check completes **Then** the system status is updated to "online" in the `systems` table **And** the response time in milliseconds is recorded **And** a `health_checks` record is created with status "success", `response_time`, and `checked_at` timestamp
3. **Given** a system fails to respond (timeout, HTTP 5xx, connection error) **When** the health check completes **Then** a `health_checks` record is created with status "failure" and `error_message` **And** the system's `status` column is NOT changed to "offline" yet (failure detection with threshold is Story 5.2)
4. **Given** the `health_checks` table needs to be created **When** migrations run **Then** the `health_checks` table exists with columns: `id` (UUID), `system_id` (FK → systems), `status` (TEXT), `response_time` (INTEGER nullable), `error_message` (TEXT nullable), `checked_at` (TIMESTAMPTZ) **And** `idx_health_checks_system_id` index exists on `health_checks(system_id, checked_at DESC)`
5. **Given** a health check completes (success or failure) **When** the result is recorded **Then** the `systems` table `last_checked_at` is always updated to the current timestamp **And** on success, `status` is set to "online" and `response_time` is updated **And** on failure, `response_time` is set to NULL and `status` is NOT changed (deferred to Story 5.2)
6. **Given** the health check cron endpoint is called **When** the request does NOT contain the `Authorization: Bearer <CRON_SECRET>` header **Then** a 401 response is returned (prevents unauthorized triggering)
7. **Given** the health check service runs **When** checking multiple systems concurrently **Then** checks run with `Promise.allSettled()` so one system's failure doesn't block others **And** total execution stays under Vercel's serverless function timeout (60 seconds for Hobby plan)

## Tasks / Subtasks

- [x] Task 1: Create `health_checks` database table (AC: #4)
  - [x] 1.1 Create migration `supabase/migrations/<timestamp>_create_health_checks_table.sql`:
    ```sql
    CREATE TABLE health_checks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
      response_time INTEGER,
      error_message TEXT,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_health_checks_system_id ON health_checks(system_id, checked_at DESC);
    ```
  - [x] 1.2 Add RLS policies in the same migration file:
    ```sql
    ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

    -- Public can read health checks for enabled, non-deleted systems
    CREATE POLICY "Public can read health checks for enabled systems"
      ON health_checks FOR SELECT TO anon
      USING (system_id IN (
        SELECT id FROM systems WHERE enabled = true AND deleted_at IS NULL
      ));

    -- Authenticated admins can read all health checks
    CREATE POLICY "Admins can read all health checks"
      ON health_checks FOR SELECT TO authenticated
      USING (true);

    -- Service role has full access (bypasses RLS automatically)
    ```
  - [x] 1.3 Run `npm run db:types` to regenerate TypeScript types (safe wrapper)

- [x] Task 2: Create health check validation schemas (AC: #2, #3)
  - [x] 2.1 Create `src/lib/validations/health.ts`:
    ```typescript
    export const healthCheckSchema = z.object({
      id: z.string().uuid(),
      systemId: z.string().uuid(),
      status: z.enum(['success', 'failure']),
      responseTime: z.number().int().nonnegative().nullable(),
      errorMessage: z.string().nullable(),
      checkedAt: z.string(),
    })
    export type HealthCheck = z.infer<typeof healthCheckSchema>
    ```
  - [x] 2.2 Add `healthCheckResultSchema` for internal use (input to record function)

- [x] Task 3: Create health check execution utility (AC: #1, #7)
  - [x] 3.1 Create `src/lib/health/check.ts`:
    ```typescript
    export interface HealthCheckResult {
      systemId: string
      status: 'success' | 'failure'
      responseTime: number | null
      errorMessage: string | null
      checkedAt: string
    }
    export async function checkSystemHealth(
      system: { id: string; url: string },
      timeoutMs?: number
    ): Promise<HealthCheckResult>
    ```
  - [x] 3.2 Use `fetch()` with `AbortController` for timeout (default 10s)
  - [x] 3.3 Send HTTP HEAD request (lightweight, no body download)
  - [x] 3.4 Measure response time with `performance.now()` or `Date.now()` delta
  - [x] 3.5 Handle all error types: timeout (AbortError), network (TypeError), HTTP 4xx/5xx
  - [x] 3.6 HTTP 2xx/3xx = success, everything else = failure
  - [x] 3.7 Return structured `HealthCheckResult` object (never throw — errors are data)
  - [x] 3.8 Fallback to GET if HEAD returns 405 Method Not Allowed (some servers don't support HEAD)

- [x] Task 4: Create health domain module — mutations (AC: #2, #3, #5)
  - [x]4.1 Create `src/lib/health/mutations.ts`:
    ```typescript
    export async function recordHealthCheck(result: HealthCheckResult): Promise<HealthCheck>
    export async function updateSystemHealthStatus(
      systemId: string,
      status: string,
      responseTime: number | null
    ): Promise<void>
    export async function runAllHealthChecks(): Promise<HealthCheckResult[]>
    ```
  - [x]4.2 `recordHealthCheck()`: Insert into `health_checks` table using `toSnakeCase()` from `@/lib/utils/transform`, parse response with `healthCheckSchema`
  - [x]4.3 `updateSystemHealthStatus()`: Update `systems` table — set `status`, `response_time`, `last_checked_at = now()` — use `toSnakeCase()` from `@/lib/utils/transform` for column mapping
  - [x]4.4 `runAllHealthChecks()`: Fetch all enabled systems (where `enabled = true` AND `deleted_at IS NULL`), run `checkSystemHealth()` concurrently with `Promise.allSettled()`, record each result, update system status
  - [x]4.5 Use Supabase **service role client** for cron mutations (bypasses RLS) — create helper: `createServiceClient()` in `src/lib/supabase/service.ts` or use existing `SUPABASE_SERVICE_ROLE_KEY` pattern
  - [x]4.6 Call `revalidatePath('/')` (import from `next/cache`) after all checks complete to update landing page status indicators

- [x] Task 5: Create health domain module — queries (AC: #2, #3)
  - [x]5.1 Create `src/lib/health/queries.ts`:
    ```typescript
    export async function getRecentHealthChecks(
      systemId: string,
      limit?: number
    ): Promise<HealthCheck[]>
    export async function getLatestHealthCheck(
      systemId: string
    ): Promise<HealthCheck | null>
    ```
  - [x]5.2 Use `createClient()` from `@/lib/supabase/server` (standard server client, respects RLS)
  - [x]5.3 Transform snake_case → camelCase at boundary using `toCamelCase()` from `@/lib/utils/transform` + Zod parse

- [x] Task 6: Create Vercel Cron API route (AC: #1, #6, #7)
  - [x]6.1 Create `src/app/api/cron/health-check/route.ts`:
    ```typescript
    export const dynamic = 'force-dynamic' // Prevent static optimization
    export const maxDuration = 60 // Vercel Hobby plan max (default is 10s)

    export async function GET(request: Request) {
      // Verify cron secret (Vercel sends Authorization header)
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
      }

      const results = await runAllHealthChecks()
      return Response.json({
        data: { checked: results.length, timestamp: new Date().toISOString() },
        error: null
      })
    }
    ```
  - [x]6.2 **CRITICAL:** This route must NOT use `requireApiAuth()` — it's called by Vercel Cron, not a user session. Use `CRON_SECRET` env var instead.
  - [x]6.3 Add error handling: try/catch wrapper, return partial results if some checks fail
  - [x]6.4 Log execution summary (number of checks, failures) — use `console.info()` for Vercel logs (appropriate for production cron summaries)

- [x] Task 7: Create `vercel.json` for cron schedule (AC: #1)
  - [x]7.1 Create `vercel.json` at project root:
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/health-check",
          "schedule": "*/5 * * * *"
        }
      ]
    }
    ```
  - [x]7.2 Note: Vercel Hobby plan supports 2 cron jobs max, Pro plan supports more. 5-minute interval is the minimum for Hobby plan.
  - [x]7.3 Add `CRON_SECRET` to `.env.local.example`:
    ```
    # Vercel Cron (auto-set by Vercel, manual for local dev)
    CRON_SECRET=your-cron-secret-here
    ```

- [x] Task 8: Create Supabase service role client utility (AC: #2, #5)
  - [x]8.1 Create `src/lib/supabase/service.ts`:
    ```typescript
    import { createClient } from '@supabase/supabase-js'
    import type { Database } from '@/types/database'

    export function createServiceClient() {
      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
    ```
  - [x]8.2 **CRITICAL:** This client bypasses RLS — server-only, never import in client components. Note: `createServiceClient()` is **synchronous** (no cookies needed) unlike `createClient()` from server.ts which is async. Usage: `const supabase = createServiceClient()` (no `await`)
  - [x]8.3 This is the 4th Supabase client factory (existing 3: server.ts, client.ts, proxy.ts + now service.ts). This is intentional — service role is distinct from cookie-based server client.

- [x] Task 9: Add health check mock factory (per D3 retro pattern)
  - [x]9.1 Update `src/lib/test-utils/mock-factories.ts`:
    ```typescript
    export function createMockHealthCheck(overrides?: Partial<HealthCheck>): HealthCheck
    export function createMockHealthCheckList(count: number, overrides?: Partial<HealthCheck>): HealthCheck[]
    ```
  - [x]9.2 Default values: `status: 'success'`, `responseTime: 150`, `checkedAt: new Date().toISOString()`

- [x] Task 10: Write unit tests for health check execution (AC: #1, #7)
  - [x]10.1 Create `src/lib/health/check.test.ts`:
    - Test successful health check (HTTP 200) records correct response time
    - Test HTTP 3xx redirect is treated as success
    - Test HTTP 5xx returns failure with error message
    - Test timeout returns failure with "Request timed out" message
    - Test network error (DNS failure) returns failure with error description
    - Test AbortController cancels request after timeout
    - Use `vi.stubGlobal('fetch', ...)` to mock fetch

- [x] Task 11: Write unit tests for health mutations (AC: #2, #3, #5)
  - [x]11.1 Create `src/lib/health/mutations.test.ts`:
    - Test `recordHealthCheck()` inserts into health_checks table with correct snake_case mapping
    - Test `updateSystemHealthStatus()` updates systems table with status + response_time + last_checked_at
    - Test `runAllHealthChecks()` runs checks for all enabled systems concurrently
    - Test `runAllHealthChecks()` skips disabled and soft-deleted systems
    - Test partial failures — one system timeout doesn't block others
    - Test `revalidatePath('/')` is called after completion

- [x] Task 12: Write unit tests for health queries (AC: #2)
  - [x]12.1 Create `src/lib/health/queries.test.ts`:
    - Test `getRecentHealthChecks()` returns records ordered by checked_at DESC
    - Test `getRecentHealthChecks()` respects limit parameter
    - Test `getLatestHealthCheck()` returns most recent check or null
    - Test snake_case → camelCase transformation

- [x] Task 13: Write API route tests (AC: #6)
  - [x]13.1 Create `src/app/api/cron/health-check/route.test.ts`:
    - **Note:** Unlike systems route tests (which mock `requireApiAuth()`), this route needs real `Request` objects with headers:
      ```typescript
      const request = new Request('http://localhost/api/cron/health-check', {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      const response = await GET(request)
      ```
    - Test returns 401 without CRON_SECRET header
    - Test returns 401 with wrong CRON_SECRET
    - Test returns 200 with correct CRON_SECRET and runs checks
    - Test returns partial success when some checks fail
    - Test response includes check count and timestamp
    - Mock `runAllHealthChecks` via `vi.mock('@/lib/health/mutations')`

- [x] Task 14: Verify pre-commit checks pass
  - [x]14.1 Run `npm run type-check` — 0 errors
  - [x]14.2 Run `npm run lint` — 0 errors
  - [x]14.3 Run `npm run test` — all tests pass (existing 1020+ and new)
  - [x]14.4 Run `npm run size` — all routes within budget (public ≤ 250 KB, admin ≤ 350 KB)
  - [x]14.5 Run `npm run story-metrics` — verify File List matches actual changes

## Dev Notes

### Database Schema — One New Table, No Changes to Existing

The `systems` table ALREADY has the columns needed for health check results:
- `status` (TEXT, nullable) — set to 'online' on successful check
- `response_time` (INTEGER, nullable) — milliseconds
- `last_checked_at` (TIMESTAMPTZ, nullable) — added in migration `20260207000002`

**New table: `health_checks`** stores historical check records. The `systems` table holds the latest snapshot; `health_checks` holds the audit trail.

### Story 3.8 Built the Display Layer — This Story Builds the Data Layer

Story 3.8 already implemented:
- **StatusBadge** component (`src/components/patterns/StatusBadge.tsx`) — renders online/offline/unknown indicators
- **RelativeTime** component (`src/components/patterns/RelativeTime.tsx`) — shows "Last checked: X minutes ago" with auto-refresh every 60s
- **SystemCard** integration — status badges appear on landing page cards

Currently, all systems show "Status unknown" (gray indicator) because `status` is null and no health checks are running. **This story makes those indicators come alive with real data.**

### Vercel Cron — Architecture Decision

**Why Vercel Cron (not Supabase Edge Functions or external scheduler):**
- Zero infrastructure to manage — config in `vercel.json`
- Runs as a standard Next.js API route — same codebase, same deployment
- Automatic deployment with the app
- Vercel provides `CRON_SECRET` env var automatically on deployment
- Hobby plan: 2 cron jobs, minimum 5-minute interval (sufficient for MVP)

**Why 5-minute interval (not 60 seconds as in epics file):**
- Vercel Hobby plan minimum is 5 minutes for cron
- 60-second interval would require Pro plan ($20/month) or external scheduler
- For MVP, 5-minute checks are sufficient — Story 5.7 allows per-system configuration later
- If real-time is needed sooner, upgrade to Pro plan or use Supabase Edge Functions

**Local development testing:**
- Call `GET /api/cron/health-check` manually with the correct Authorization header
- Or create a `scripts/run-health-check.ts` script for `npx tsx` execution

### Supabase Service Role Client — Why a 4th Factory

The health check cron runs WITHOUT a user session (Vercel calls it via HTTP). The existing `createClient()` from `server.ts` is async (uses cookies) and would fail without a session. The service role client:
- **Synchronous** — no cookies needed: `const supabase = createServiceClient()` (no `await`)
- Bypasses RLS entirely (needed for inserting into `health_checks`)
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already configured)
- MUST be server-only — never import in client code

Architecture note: The existing 3 Supabase factories are server.ts, client.ts, proxy.ts. The service client is a special-purpose 4th factory for background jobs, not a replacement for any existing factory.

### HTTP HEAD vs GET for Health Checks

Using `HEAD` request for health checks:
- Smaller response (no body) — faster and cheaper
- Most web servers respond to HEAD the same as GET (just headers)
- Some servers don't support HEAD — fallback to GET if HEAD returns 405 Method Not Allowed
- Timeout at 10 seconds covers slow responses without blocking

### Failure Status — Deferred to Story 5.2

**CRITICAL: This story does NOT mark systems as "offline".**

Per AC #3, a single failure only records a `health_checks` entry with `status: 'failure'`. The system's `status` column is only updated to "online" on success. Marking a system as "offline" requires consecutive failure detection (threshold logic), which is Story 5.2.

This means after this story:
- Successful checks → system shows "online" (green indicator)
- Failed checks → system keeps its previous status (could still show "online" from last success, or "unknown" if never checked)
- Only Story 5.2 will implement: "3 consecutive failures → mark offline"

### WebSocket Events — Already Defined, Use in Story 5.5

`src/lib/websocket/events.ts` already defines `HEALTH_UPDATE` event type with Zod schema. This story does NOT implement real-time broadcasting — that's Story 5.5 (Real-Time Dashboard Updates). This story focuses on the backend data pipeline only.

### Concurrent Checks with Promise.allSettled()

`Promise.allSettled()` ensures:
- All systems are checked even if one fails catastrophically
- Each check has its own timeout (via AbortController)
- Total execution must stay under 60 seconds (Vercel Hobby function timeout)
- **CRITICAL:** Vercel Hobby defaults to 10s function timeout — must export `maxDuration = 60` in route.ts to get 60 seconds
- With 10 systems × 10s timeout = 100s worst case serially, so concurrency is essential
- `Promise.allSettled()` runs all checks in parallel — worst case is ~10s (the slowest system)

### Rate Limiting Considerations (NFR-P10)

For MVP with 5-10 systems, concurrent checks are fine. At scale (50+ systems):
- Add concurrency limiter (e.g., batch 10 at a time with `p-limit`)
- Add jitter to prevent thundering herd
- This is Story 5.3 scope — not needed for Story 5.1

### Project Structure Notes

Files to create/modify:
```
supabase/migrations/
└── <timestamp>_create_health_checks_table.sql    NEW — health_checks table + RLS + index

src/lib/supabase/
└── service.ts                                     NEW — service role client (bypasses RLS)

src/lib/validations/
└── health.ts                                      NEW — HealthCheck schema + types

src/lib/health/                                      EXISTS — directory has .gitkeep, add files directly
├── check.ts                                       NEW — HTTP health check execution
├── check.test.ts                                  NEW — check utility tests
├── mutations.ts                                   NEW — recordHealthCheck, updateSystemHealthStatus, runAllHealthChecks
├── mutations.test.ts                              NEW — mutation tests
├── queries.ts                                     NEW — getRecentHealthChecks, getLatestHealthCheck
└── queries.test.ts                                NEW — query tests

src/app/api/cron/
└── health-check/
    ├── route.ts                                   NEW — Vercel Cron handler (GET)
    └── route.test.ts                              NEW — cron route tests

vercel.json                                        NEW — cron schedule config
.env.local.example                                 EDIT — add CRON_SECRET
src/lib/test-utils/mock-factories.ts               EDIT — add createMockHealthCheck
src/types/database.ts                              REGEN — after migration (npm run db:types)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Architecture, Real-time Communication]
- [Source: _bmad-output/project-context.md#Technology Stack, Critical Implementation Rules]
- [Source: src/components/patterns/StatusBadge.tsx — Story 3.8 status display]
- [Source: src/components/patterns/RelativeTime.tsx — Story 3.8 timestamp display]
- [Source: src/lib/systems/queries.ts — existing SYSTEM_SELECT_COLUMNS with status, response_time, last_checked_at]
- [Source: src/lib/systems/mutations.ts — mutation pattern with toSnakeCase + revalidatePath]
- [Source: src/lib/websocket/events.ts — HEALTH_UPDATE event type pre-defined]
- [Source: src/app/api/systems/route.ts — API route pattern with ApiResponse wrapper]
- [Source: src/lib/validations/system.ts — systemSchema includes status, responseTime, lastCheckedAt fields]
- [Source: src/lib/test-utils/mock-factories.ts — createMockSystem factory]

### Previous Story Intelligence

**From Story 4-1 (Content Section Editor with WYSIWYG):**
- Dialog-based editing pattern established (reusable for health config UI in Story 5.7)
- React Query optimistic mutations with snapshot/rollback (admin patterns)
- `requireApiAuth('admin')` + `isAuthError()` guard in API routes
- TipTap WYSIWYG loaded via `next/dynamic` with `{ ssr: false }` — same lazy-loading pattern applies to any heavy dashboard components
- Footer content has snake_case → camelCase `.transform()` in Zod schema — be aware of similar transform patterns when creating health check schemas

**From Story 4-B (System Category Layers):**
- Database migration pattern: add column + seed data update in same migration
- `SYSTEM_CATEGORIES` constants + enum validation pattern
- CategoryTabs uses children pattern (server/client boundary) — applicable for dashboard layout

**From Story 4-A (Pillars Section):**
- Server Components for zero client JS rendering — StatusBadge follows same pattern
- `deepRender` test helper for resolving async Server Components in tests
- Deploy-safe fallback constants for missing DB data

**Patterns to reuse from Epic 3:**
- Supabase query chain: `.from('table').select().eq().order()` with error handling
- `toCamelCase()` / `toSnakeCase()` at data boundary in domain modules
- Mock Supabase client with `vi.mock()` + method chain mocks
- `createMockSystem()` factory for consistent test data
- `revalidatePath('/')` after every mutation (MANDATORY)

### Git Intelligence

Recent commits show consistent patterns:
- `feat(scope): description` for new features
- `fix(scope): description` for code review fixes
- Expected commit: `feat(health): add basic health check service and status updates`
- Story 4-B: `feat(landing): add system category tabs with grouped display`

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| Used typed `HealthCheckInsert` instead of `toSnakeCase()` for insert | Supabase typed client rejects `Record<string, unknown>` | No functional impact, better type safety |
| `updateSystemHealthStatus` accepts `status: string \| null` | On failure, status must NOT be changed (AC #3) | Null means "don't update status field" |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed UUID validation in test data — `hc-1`/`sys-1` not valid UUIDs, replaced with proper UUIDs
- Fixed `no-explicit-any` lint errors — added `eslint-disable-next-line` comments matching existing test patterns

### Completion Notes List

- All 14 tasks complete
- 39 new tests across 4 test files (check: 11, mutations: 12, queries: 10, route: 6)
- Full suite: 1144 tests across 99 files — all passing
- type-check: 0 errors
- lint: 0 errors
- Bundle budget: all routes within limits
- 4th Supabase client factory added: `service.ts` (synchronous, bypasses RLS)
- `updateSystemHealthStatus` uses `status: string | null` — null means don't update (failure path per AC #3)

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

| File | Action |
|------|--------|
| `supabase/migrations/20260209000001_create_health_checks_table.sql` | NEW |
| `src/lib/supabase/service.ts` | NEW |
| `src/lib/validations/health.ts` | NEW |
| `src/lib/health/check.ts` | NEW |
| `src/lib/health/check.test.ts` | NEW |
| `src/lib/health/mutations.ts` | NEW |
| `src/lib/health/mutations.test.ts` | NEW |
| `src/lib/health/queries.ts` | NEW |
| `src/lib/health/queries.test.ts` | NEW |
| `src/app/api/cron/health-check/route.ts` | NEW |
| `src/app/api/cron/health-check/route.test.ts` | NEW |
| `vercel.json` | NEW |
| `.env.local.example` | EDIT |
| `src/lib/test-utils/mock-factories.ts` | EDIT |
| `src/types/database.ts` | REGEN |
