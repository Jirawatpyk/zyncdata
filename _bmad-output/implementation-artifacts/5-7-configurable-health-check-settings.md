# Story 5.7: Configurable Health Check Settings

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to configure health check intervals, timeout thresholds, and failure counts per system,
so that monitoring can be tuned to each system's specific needs.

## Acceptance Criteria

1. **Given** I am on the system configuration page, **When** I view health check settings for a system, **Then** I see configurable fields: check interval (default: 60s), timeout threshold (default: 10s), failure count before offline (default: 3).
2. **Given** I change the check interval for a system, **When** I save the setting, **Then** the health check service uses the new interval for that specific system.
3. **Given** I change the timeout threshold, **When** I save the setting, **Then** health checks for that system use the new timeout value.
4. **Given** I change the failure count threshold, **When** I save the setting, **Then** the system requires the new number of consecutive failures before being marked offline.
5. **Given** I enter an invalid value (e.g., interval < 30s or timeout < 1s), **When** I attempt to save, **Then** I see a validation error with acceptable range guidance.

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

<!-- THRESHOLD CHECK: 10 tasks, 3 layers (migration + service logic + UI + tests) — WITHIN threshold -->

- [x] Task 1: Create migration to add health config columns to systems table (AC: #1)
  - [x] 1.1 Create migration `supabase/migrations/20260215000001_add_health_config_to_systems.sql`
  - [x] 1.2 Add columns: `check_interval INTEGER NULL`, `timeout_threshold INTEGER NULL`, `failure_threshold INTEGER NULL`
  - [x] 1.3 Add CHECK constraints: `check_interval >= 30 AND check_interval <= 86400`, `timeout_threshold >= 1000 AND timeout_threshold <= 60000`, `failure_threshold >= 1 AND failure_threshold <= 10`
  - [x] 1.4 Add COMMENT on each column documenting units and defaults (seconds, milliseconds, count)
- [x] Task 2: Update TypeScript types (AC: #1)
  - [x] 2.1 Add `check_interval`, `timeout_threshold`, `failure_threshold` to systems table types in `src/types/database.ts`
  - [x] 2.2 Add fields to `systemSchema` in `src/lib/validations/system.ts`: `checkInterval: z.number().int().nullable()`, `timeoutThreshold: z.number().int().nullable()`, `failureThreshold: z.number().int().nullable()`
  - [x] 2.3 Add fields to `SystemHealthSummary` interface in `src/lib/validations/health.ts`
- [x] Task 3: Create validation schema for health config update (AC: #5)
  - [x] 3.1 Add `updateHealthConfigSchema` to `src/lib/validations/health.ts` with proper min/max ranges
  - [x] 3.2 Export `UpdateHealthConfig` type
- [x] Task 4: Update health check service to use per-system config (AC: #2, #3, #4)
  - [x] 4.1 Update `runAllHealthChecks()` in `src/lib/health/mutations.ts` — fetch `check_interval, timeout_threshold, failure_threshold` in the systems SELECT
  - [x] 4.2 Pass `system.timeout_threshold ?? DEFAULT_TIMEOUT_MS` as `timeoutMs` to `checkSystemHealthWithRetry()`
  - [x] 4.3 Replace `DEFAULT_FAILURE_THRESHOLD` comparison with `system.failure_threshold ?? DEFAULT_FAILURE_THRESHOLD`
  - [x] 4.4 Note: `check_interval` is NOT used in `runAllHealthChecks()` directly — it will be consumed by Story 5-8 or future per-system scheduling. For now, store the value only.
- [x] Task 5: Create API route for health config (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Create `src/app/api/admin/systems/[systemId]/health-config/route.ts` (GET + PATCH)
  - [x] 5.2 GET returns current config (null values mean "use global default")
  - [x] 5.3 PATCH validates body with `updateHealthConfigSchema`, updates systems table
  - [x] 5.4 Both endpoints require admin auth via `requireApiAuth('admin')` from `@/lib/auth/guard`
- [x] Task 6: Create React Query hooks (AC: all)
  - [x] 6.1 Add `systemHealthConfigQueryOptions(systemId)` to `src/lib/admin/queries/health.ts`
  - [x] 6.2 Create `useUpdateHealthConfig` mutation hook in `src/lib/admin/mutations/health.ts`
  - [x] 6.3 Invalidate `['admin', 'health', 'config', systemId]` + `['admin', 'health', 'dashboard']` on success
- [x] Task 7: Create Health Config UI dialog (AC: #1, #5)
  - [x] 7.1 Create `src/app/admin/analytics/_components/HealthConfigDialog.tsx`
  - [x] 7.2 Form with 3 number inputs: check interval (sec), timeout threshold (ms), failure threshold (count)
  - [x] 7.3 Show placeholder/helper text with global defaults when value is null
  - [x] 7.4 "Reset to default" button that sets all values to null
  - [x] 7.5 Use `useForm` + `zodResolver` + `mutateAsync` + try/catch pattern (Controller pattern for nullable numbers)
- [x] Task 8: Integrate config dialog into Health Dashboard (AC: #1)
  - [x] 8.1 Add "Settings" gear icon/button per system row in `SystemsHealthTable.tsx` (new 5th column "Config")
  - [x] 8.2 Update `DASHBOARD_SELECT` in `src/app/api/admin/health/route.ts` to include `check_interval, timeout_threshold, failure_threshold`
  - [x] 8.3 Update `SYSTEM_SELECT_COLUMNS` in `src/lib/systems/queries.ts` to include the 3 new columns
  - [x] 8.4 Show current config values in dashboard system rows (with "(default)" label for null)
- [x] Task 9: Write unit + integration tests (AC: all)
  - [x] 9.1 Test `runAllHealthChecks()` with per-system config — verify custom timeout passed to `checkSystemHealthWithRetry()`
  - [x] 9.2 Test `runAllHealthChecks()` with null config — verify defaults used
  - [x] 9.3 Test per-system failure threshold — system A (threshold 5) vs system B (default 3)
  - [x] 9.4 Test API route GET/PATCH — validation, auth, success, error cases
  - [x] 9.5 Test HealthConfigDialog component — form render, validation errors, save, reset to default
  - [x] 9.6 Test Zod schema — valid ranges, boundary values, nullable handling
- [x] Task 10: Verify all tests pass + bundle budget (AC: all)
  - [x] 10.1 `npm run test` — 1474 tests passed, 0 failures (131 test files)
  - [x] 10.2 `npm run type-check` — zero errors
  - [x] 10.3 `npm run lint` — zero errors
  - [x] 10.4 `npm run size` — `/admin/analytics` 206.3 KB / 350 KB budget

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — This story spans migration files + application validation (check constraints + Zod schemas + API route validation). Add explicit verification:
- [x] Verify integration contracts: confirm migration CHECK constraints match Zod schema ranges (check_interval 30-86400, timeout_threshold 1000-60000, failure_threshold 1-10), nullable handling consistent, snake_case→camelCase in queries.ts
  - DB CHECK: check_interval 30..86400, Zod: min(30).max(86400) ✅
  - DB CHECK: timeout_threshold 1000..60000, Zod: min(1000).max(60000) ✅
  - DB CHECK: failure_threshold 1..10, Zod: min(1).max(10) ✅
  - All columns nullable in DB + Zod .nullable() ✅
  - snake_case→camelCase transform in API route + queries.ts ✅
-->

## Dev Notes

### Architecture & Integration Points

**Where per-system config lives — `systems` table columns (NOT a separate table):**

The simplest, most correct approach is adding 3 nullable INTEGER columns to the existing `systems` table. Null means "use global default." This avoids:
- A new table + JOIN overhead (premature for 3 fields on an existing entity)
- Complex config resolution logic
- Extra API endpoints for a separate settings entity

**Current hardcoded constants that become per-system:**

| Constant | File | Current Value | New Behavior |
|----------|------|---------------|--------------|
| `DEFAULT_TIMEOUT_MS` | `src/lib/health/check.ts:3` | 10,000 ms | `system.timeout_threshold ?? 10_000` |
| `DEFAULT_FAILURE_THRESHOLD` | `src/lib/health/mutations.ts:17` | 3 | `system.failure_threshold ?? 3` |
| N/A (Vercel cron schedule) | `vercel.json` | Daily cron | `check_interval` stored but NOT consumed yet — Vercel Cron is global |

**CRITICAL: `check_interval` implementation scope for THIS story:**

The `check_interval` column is stored and configurable via UI, but the actual Vercel Cron schedule remains global (runs once based on `vercel.json` config). Per-system intervals would require a different scheduling mechanism (e.g., checking timestamps in `runAllHealthChecks()` to skip systems whose last check was too recent). This is a valid enhancement but is **OUT OF SCOPE** for Story 5-7. For now:
1. Store `check_interval` in the database
2. Display it in the UI with a tooltip: "Per-system intervals will be enforced in a future update. Currently all systems use the global cron schedule."
3. Future: `runAllHealthChecks()` can compare `system.last_checked_at + system.check_interval` against `now()` to decide whether to skip

**However**, `timeout_threshold` and `failure_threshold` ARE fully functional in this story:
- `timeout_threshold` → passed to `checkSystemHealthWithRetry({ ... }, { timeoutMs: system.timeout_threshold ?? DEFAULT_TIMEOUT_MS })`
- `failure_threshold` → used in `if (failureCount >= (system.failure_threshold ?? DEFAULT_FAILURE_THRESHOLD))`

### Critical SELECT Constants to Update

**`src/app/api/admin/health/route.ts:7` — `DASHBOARD_SELECT`:**
```typescript
// Current:
const DASHBOARD_SELECT = 'id, name, url, status, response_time, last_checked_at, consecutive_failures, category, enabled'

// Change to:
const DASHBOARD_SELECT = 'id, name, url, status, response_time, last_checked_at, consecutive_failures, category, enabled, check_interval, timeout_threshold, failure_threshold'
```

**`src/lib/systems/queries.ts:6` — `SYSTEM_SELECT_COLUMNS`:**
```typescript
// Current:
export const SYSTEM_SELECT_COLUMNS = 'id, name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at, deleted_at, last_checked_at, category, consecutive_failures'

// Change to (add 3 fields at end):
export const SYSTEM_SELECT_COLUMNS = 'id, name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at, deleted_at, last_checked_at, category, consecutive_failures, check_interval, timeout_threshold, failure_threshold'
```

### Critical Code Changes

**1. `src/lib/health/mutations.ts` — `runAllHealthChecks()` (line 154-170):**

Current:
```typescript
const { data: systems } = await supabase
  .from('systems')
  .select('id, name, url, status')
  .eq('enabled', true)
  .is('deleted_at', null)
```

Change to:
```typescript
const { data: systems } = await supabase
  .from('systems')
  .select('id, name, url, status, timeout_threshold, failure_threshold')
  .eq('enabled', true)
  .is('deleted_at', null)
```

**2. Pass custom timeout (line ~170):**

Current:
```typescript
return checkSystemHealthWithRetry({ id: system.id, url: system.url })
```

Change to:
```typescript
return checkSystemHealthWithRetry(
  { id: system.id, url: system.url },
  system.timeout_threshold != null ? { timeoutMs: system.timeout_threshold } : undefined,
)
```

**3. Use per-system failure threshold (line ~212):**

Current:
```typescript
if (failureCount >= DEFAULT_FAILURE_THRESHOLD) {
```

Change to:
```typescript
const threshold = system.failure_threshold ?? DEFAULT_FAILURE_THRESHOLD
if (failureCount >= threshold) {
```

### Critical Constraints

1. **Service client only** — cron context has no user session; use `createServiceClient()` from `@/lib/supabase/service`
2. **Admin auth for API** — GET/PATCH routes must use `requireApiAuth('admin')` from `@/lib/auth/guard` (NOT manual `createServerClient()` + role check)
3. **`ApiResponse<T>` wrapper** — all API routes return `{ data, error }` format (Rule #459)
4. **snake_case → camelCase** — transform in query layer only; `systems` SELECT returns snake_case columns which are used directly in `mutations.ts` (service layer)
5. **Static imports in tests** — NEVER use `await import()` in test cases (D1 lesson)
6. **`mutateAsync` + try/catch** — all React Query mutations (Rule P2)
7. **`cn()` for Tailwind** — never string concatenation
8. **`min-h-11`** — all interactive elements 44px min
9. **No `dark:` classes** — ESLint rule `local/no-dark-classes`
10. **Null = default** — null config values mean "use global default"; the UI should make this clear

### Validation Ranges

| Field | Type | Min | Max | Default | Unit |
|-------|------|-----|-----|---------|------|
| `check_interval` | INTEGER | 30 | 86400 | 60 | seconds |
| `timeout_threshold` | INTEGER | 1000 | 60000 | 10000 | milliseconds |
| `failure_threshold` | INTEGER | 1 | 10 | 3 | count |

**Zod schema:**
```typescript
export const updateHealthConfigSchema = z.object({
  checkInterval: z.number().int().min(30).max(86400).nullable(),
  timeoutThreshold: z.number().int().min(1000).max(60000).nullable(),
  failureThreshold: z.number().int().min(1).max(10).nullable(),
})
```

The `.nullable()` allows sending `null` to reset to default. The Zod schema applies BEFORE null check, so `.min()/.max()` only validate non-null values. Use `.nullable()` AFTER `.min().max()` to achieve this.

### UI Design

**Location:** Health Dashboard page (`/admin/analytics`) — per-system settings gear icon in each system row.

**HealthConfigDialog component:**
- Trigger: Settings gear icon (`<Settings className="h-4 w-4" />`) on each system row
- Dialog with 3 form fields:
  - Check Interval: number input (seconds), placeholder "60 (default)"
  - Timeout Threshold: number input (milliseconds), placeholder "10000 (default)"
  - Failure Threshold: number input (count), placeholder "3 (default)"
- "Reset to defaults" link/button → sets all to null
- Save button → `mutateAsync` with try/catch → toast success/error
- Each field shows a helper text: e.g., "30s - 24h" / "1s - 60s" / "1 - 10 failures"

**Dashboard enhancement:**
- Show config values in system rows (e.g., small text under system name or in a details expansion)
- "(default)" suffix when null for clarity

### API Design

**`GET /api/admin/systems/[systemId]/health-config`**
```json
{
  "data": {
    "checkInterval": 120,
    "timeoutThreshold": null,
    "failureThreshold": 5
  },
  "error": null
}
```

**`PATCH /api/admin/systems/[systemId]/health-config`**
```json
// Request body
{
  "checkInterval": 120,
  "timeoutThreshold": null,
  "failureThreshold": 5
}

// Response
{
  "data": {
    "checkInterval": 120,
    "timeoutThreshold": null,
    "failureThreshold": 5
  },
  "error": null
}
```

### Project Structure Notes

**New files to create:**
```
supabase/migrations/20260215000001_add_health_config_to_systems.sql
src/app/api/admin/systems/[systemId]/health-config/route.ts
src/app/api/admin/systems/[systemId]/health-config/route.test.ts
src/app/admin/analytics/_components/HealthConfigDialog.tsx
src/app/admin/analytics/_components/HealthConfigDialog.test.tsx
src/lib/admin/mutations/health.ts
src/lib/admin/mutations/health.test.ts
```

**Files to modify:**
```
src/types/database.ts                    # Add 3 nullable columns to systems Row/Insert/Update
src/lib/validations/system.ts            # Add 3 fields to systemSchema (checkInterval, timeoutThreshold, failureThreshold)
src/lib/validations/health.ts            # Add updateHealthConfigSchema + SystemHealthSummary fields
src/lib/health/mutations.ts              # Use per-system config in runAllHealthChecks
src/lib/health/mutations.test.ts         # Add per-system config test scenarios
src/lib/admin/queries/health.ts          # Add systemHealthConfigQueryOptions
src/lib/systems/queries.ts               # Add 3 fields to SYSTEM_SELECT_COLUMNS
src/app/api/admin/health/route.ts        # Add 3 fields to DASHBOARD_SELECT constant
src/app/admin/analytics/_components/SystemsHealthTable.tsx  # Add Settings gear icon column per system row
src/app/admin/analytics/_components/HealthDashboard.tsx     # Pass config dialog integration
```

**DO NOT modify (read-only reference):**
```
src/lib/health/check.ts                  # Already accepts options.timeoutMs — no changes needed
src/lib/supabase/service.ts              # Service client factory — no changes needed
src/lib/health/notifications.ts          # Notification service — no changes needed
src/app/api/cron/health-check/route.ts   # Cron route calls runAllHealthChecks — no changes needed
```

### Existing Patterns to Follow

**Dialog pattern** (from `EditSystemDialog.tsx`):
- `Dialog` + `DialogTrigger` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription`
- `useForm` with `zodResolver(updateHealthConfigSchema)`
- Submit disabled: `!form.formState.isDirty || form.formState.isSubmitting`
- On open: fetch config via query → populate form with `form.reset(data)`
- On close: `form.reset()`

**Query key pattern:**
```typescript
['admin', 'health', 'config', systemId]
```

**Mutation pattern** (from `src/lib/admin/mutations/notifications.ts`):
```typescript
export function useUpdateHealthConfig(systemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateHealthConfig) => {
      const res = await fetch(`/api/admin/systems/${systemId}/health-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return unwrapResponse<HealthConfig>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'health', 'config', systemId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'health', 'dashboard'] })
    },
    onError: () => { toast.error('Failed to update health check settings') },
  })
}
```

**API route auth guard pattern** (from `src/app/api/admin/notifications/settings/route.ts`):
```typescript
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth
  // ... business logic
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth
  // ... validation + update logic
}
```

**Migration naming:** `{YYYYMMDD}{6-digit-sequence}_description.sql`

### Testing Strategy

**Mock setup for mutations.test.ts:**
The existing `mutations.test.ts` already mocks `@/lib/supabase/service`. Add per-system config fields to the mock system data:
```typescript
const mockSystems = [
  { id: 'sys-1', name: 'System A', url: 'https://a.com', status: 'online', timeout_threshold: 5000, failure_threshold: 5 },
  { id: 'sys-2', name: 'System B', url: 'https://b.com', status: 'online', timeout_threshold: null, failure_threshold: null },
]
```

**Key test scenarios:**
1. System with custom timeout → `checkSystemHealthWithRetry` called with `{ timeoutMs: 5000 }`
2. System with null timeout → `checkSystemHealthWithRetry` called with no options (defaults used)
3. System A (failure_threshold: 5) → 3 failures → still online; 5 failures → offline
4. System B (failure_threshold: null) → 3 failures → offline (default threshold)
5. API route GET → returns config from DB (camelCase transformed)
6. API route PATCH → validates schema, updates DB, returns updated config
7. API route PATCH with out-of-range values → 400 with validation errors
8. HealthConfigDialog → renders with current values, validates on submit, calls mutateAsync
9. HealthConfigDialog → "Reset to defaults" sets all fields to null
10. HealthConfigDialog → shows validation errors for invalid ranges

**Mock boundary chain:**
- Component tests mock `@/lib/admin/queries/health` and `@/lib/admin/mutations/health`
- API route tests mock `@/lib/auth/guard` (`requireApiAuth` returns mock user) and `@/lib/supabase/server`
- Mutation logic tests mock `@/lib/supabase/service` and `@/lib/health/check`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5-Story-5.7] — AC, user story
- [Source: _bmad-output/planning-artifacts/architecture.md] — Code structure, API patterns
- [Source: _bmad-output/project-context.md#Rule-459] — ApiResponse wrapper mandate
- [Source: _bmad-output/project-context.md#Rules-95-99] — snake_case → camelCase transform
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md#Rule-7] — mutateAsync + try/catch
- [Source: FR65] — Admins can configure health check intervals per system
- [Source: FR66] — Admins can set health check timeout thresholds per system
- [Source: FR67] — Admins can set failure count threshold before marking system offline
- [Source: NFR-P4] — Health check response time per system < 5 seconds
- [Source: NFR-P10] — System must handle rate limits gracefully at scale

### Previous Story Intelligence (5-6)

**Key learnings from Story 5-6:**
- Resend email notifications integrated into `runAllHealthChecks()` at exact transition points
- `sendFailureNotification` / `sendRecoveryNotification` are already imported in mutations.ts — no changes needed to notification flow
- Notification calls are non-blocking (try/catch wrapped) — this pattern is maintained
- `runAllHealthChecks()` selects `id, name, url, status` — we need to ADD `timeout_threshold, failure_threshold` to this SELECT
- Code review found XSS in email templates (M1) — all interpolated values are escaped via `escapeHtml()` — this is already fixed
- Dashboard UI uses collapsible NotificationSettings panel — the new HealthConfigDialog should use a per-system Dialog trigger instead (different pattern)
- Test baseline: 1426 tests across 127 files
- Bundle budget: `/admin/analytics` 206.3 KB / 350 KB — ~144 KB headroom

**Code review patterns from 5-6:**
- H1: All interactive elements must be `min-h-11 min-w-11` (44px)
- M3: Avoid `initialized` flag anti-pattern → use render-time comparison for form sync
- M4: Contract tests must assert ALL expected payload fields

### Git Intelligence

**Last 5 commits:**
```
5e7dbb9 fix(health): add User-Agent header to health checks for WAF/Cloudflare compatibility
90b4ac4 feat(health): add health check failure notifications with code review fixes (Story 5-6)
93bf972 chore: add docs images and update .gitignore
bb9e71a feat(health): add real-time dashboard updates via Supabase Realtime (Story 5-5)
0b9703c feat(health): add health monitoring dashboard with code review fixes (Story 5-4)
```

**Insights:**
- Recent `5e7dbb9` added `User-Agent: ZyncData-HealthCheck/1.0` header to `check.ts` — this file should NOT be modified in this story (timeout is already configurable via options param)
- `check.ts` already has `HEALTH_CHECK_HEADERS` with User-Agent — good, no WAF issues
- Health check flow: cron route → `runAllHealthChecks()` → `checkSystemHealthWithRetry()` → `checkSystemHealth()` — the config change is in `runAllHealthChecks()` only

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Nullable number inputs with `register` + controlled `value` causes "0" on reset → refactored to `Controller` from react-hook-form
- Adding 3 fields to `systemSchema` cascaded to ~38 test failures (mock data missing new fields) → systematically fixed all mock factories and inline test data

### Completion Notes List

1. **Controller pattern for nullable number inputs** — `register` + `setValueAs` conflicts with controlled `value` prop on number inputs. When `setValue(null)`, DOM renders as 0. Solution: use `Controller` from react-hook-form for full value control via `value={field.value ?? ''}` and `onChange` with null coercion.
2. **check_interval stored but NOT consumed** — Per story spec, `check_interval` is stored in DB and configurable via UI but not consumed by `runAllHealthChecks()`. Vercel Cron is global. Helper text in UI notes: "Per-system intervals will be enforced in a future update."
3. **Integration Contract Verification** — DB CHECK constraints, Zod schema min/max ranges, and nullable handling all verified to match exactly.
4. **Security Checklist Passed** — All applicable checks verified (see below).
5. **Test count: 1475 tests (131 files)** — up from 1426 tests (127 files), +49 new tests, +4 new test files.

### Security Pre-Review Checklist

#### 1. Input Validation & Injection
- [x] All user input validated with Zod `.safeParse()` in PATCH handler
- [x] No raw user input in SQL — uses Supabase parameterized `.update()` / `.select()`
- [N/A] No `dangerouslySetInnerHTML` usage
- [N/A] No Form actions (API route pattern)
- [x] API route validates request body with `updateHealthConfigSchema.safeParse(body)`

#### 2. Authentication & Authorization
- [x] Both GET and PATCH use `requireApiAuth('admin')` guard
- [x] RBAC role = `'admin'` matches story requirements
- [N/A] MFA AAL2 — inherited from `requireApiAuth`
- [x] No auth bypass — both code paths check auth before any DB operation
- [x] No session tokens in URLs or logs

#### 3. Open Redirects
- [N/A] No redirects in this story

#### 4. Error Handling
- [x] All `.update()` and `.select()` check `error` return
- [x] Error messages are generic ("Failed to fetch/update health config")
- [x] No stack traces or table names leaked
- [x] `try/catch` blocks return proper error responses

#### 5. Race Conditions
- [N/A] Config updates are idempotent (last write wins) — no race condition risk

#### 6. Data Exposure
- [x] API returns only 3 config fields (checkInterval, timeoutThreshold, failureThreshold)
- [x] No sensitive data logged
- [x] SELECT uses explicit columns, not `*`

#### 7. CSP & Headers
- [N/A] No new external resources added
- [N/A] No eval() or new Function()

#### 8. Rate Limiting
- [N/A] Admin-only endpoint behind auth — rate limiting not required for config updates

### File List

**New files (7):**
- `supabase/migrations/20260215000001_add_health_config_to_systems.sql`
- `src/app/api/admin/systems/[systemId]/health-config/route.ts`
- `src/app/api/admin/systems/[systemId]/health-config/route.test.ts`
- `src/app/admin/analytics/_components/HealthConfigDialog.tsx`
- `src/app/admin/analytics/_components/HealthConfigDialog.test.tsx`
- `src/lib/admin/mutations/health.ts`
- `src/lib/admin/mutations/health.test.ts`

**Modified files (16):**
- `src/types/database.ts` — Added 3 nullable columns to systems Row/Insert/Update
- `src/lib/validations/system.ts` — Added 3 fields to systemSchema
- `src/lib/validations/health.ts` — Added updateHealthConfigSchema, UpdateHealthConfig, HealthConfig, SystemHealthSummary fields
- `src/lib/validations/health.test.ts` — Added 12 Zod schema boundary tests
- `src/lib/health/mutations.ts` — Per-system timeout + failure threshold in runAllHealthChecks
- `src/lib/health/mutations.test.ts` — Updated mocks, added 6 per-system config tests
- `src/lib/admin/queries/health.ts` — Added systemHealthConfigQueryOptions
- `src/lib/systems/queries.ts` — Added 3 fields to SYSTEM_SELECT_COLUMNS
- `src/app/api/admin/health/route.ts` — Added 3 fields to DASHBOARD_SELECT
- `src/app/admin/analytics/_components/SystemsHealthTable.tsx` — Config column + HealthConfigDialog
- `src/app/admin/analytics/_components/SystemsHealthTable.test.tsx` — Rewrote with QueryClientProvider + 3 config tests
- `src/lib/test-utils/mock-factories.ts` — Added 3 null fields to SYSTEM_DEFAULTS + SYSTEM_HEALTH_DEFAULTS
- `src/lib/admin/mutations/systems.ts` — Added 3 null fields to optimistic System
- `src/lib/systems/queries.test.ts` — Added 3 fields to all mock objects
- `src/lib/systems/queries.guardrails.test.ts` — Added 3 fields to mock object
- `src/lib/systems/mutations.test.ts` — Added 3 fields to mock objects
- `src/app/api/systems/route.guardrails.test.ts` — Added 3 fields to inline mock
- `src/app/api/systems/[id]/logo/route.guardrails.test.ts` — Added 3 fields
- `src/app/api/systems/[id]/toggle/route.guardrails.test.ts` — Added 3 fields
- `src/lib/validations/system.test.ts` — Added 3 fields to validSystem

### Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) — Code Review Mode
**Date:** 2026-02-08
**Outcome:** ✅ Approved (all issues auto-fixed)

**Issues Found: 1 HIGH (downgraded to M), 4 MEDIUM, 3 LOW — 5 fixed, 3 accepted**

| ID | Severity | Description | Resolution |
|----|----------|-------------|------------|
| M1 | MEDIUM | `bg-red-50` hardcoded in SystemsHealthTable (pre-existing from 5-4) — not theme-aware | ✅ Fixed → `bg-destructive/10` + updated 2 tests |
| M2 | MEDIUM | Duplicate `useState` import in HealthConfigDialog (lines 3 + 22) | ✅ Fixed → consolidated to single `import { useEffect, useState } from 'react'` |
| M4 | MEDIUM | PATCH route returns 500 for malformed JSON body (should be 400) | ✅ Fixed → added inner try/catch for `request.json()` returning 400 PARSE_ERROR + 1 new test |
| M5 | MEDIUM | `systemHealthConfigQueryOptions` has misleading `enabled` always overridden by consumer | ✅ Fixed → removed `enabled` from factory (consumer controls it) |
| L1 | LOW | `form` in useEffect dependency array (HealthConfigDialog:57) | ✅ Accepted — react-hook-form useForm returns stable reference, no re-render risk |
| L2 | LOW | Migration has no `IF NOT EXISTS` guard | ✅ Accepted — Supabase migration runner tracks state, IF NOT EXISTS would mask errors |
| L3 | LOW | No loading indicator on gear icon trigger button | ✅ Accepted — dialog skeleton loader covers UX, no meaningful loading state for trigger |

**Verification:**
- `npm run test` → 1475 tests passed (131 files) ✅
- `npm run type-check` → zero errors ✅
- `npm run lint` → zero errors ✅

### Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-08 | Dev Agent (Opus 4.6) | Initial implementation — all 10 tasks complete |
| 2026-02-08 | Code Review (Opus 4.6) | Review: 5 fixes applied (M1 bg-red-50→bg-destructive/10, M2 duplicate import, M4 malformed JSON 400, M5 misleading enabled), +1 test |

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->
