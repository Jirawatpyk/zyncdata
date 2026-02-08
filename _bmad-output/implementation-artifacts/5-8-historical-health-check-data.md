# Story 5.8: Historical Health Check Data

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to view historical health check data for trend analysis,
so that I can identify patterns in system reliability and performance.

## Acceptance Criteria

1. **Given** I am on the dashboard for a specific system
   **When** I view historical data
   **Then** I see recent health check records showing status, response time, and timestamp

2. **Given** health check records exist
   **When** I review the data
   **Then** records are sorted by most recent first

3. **Given** I want to analyze trends
   **When** I view response time data over time
   **Then** I can identify performance patterns (response time increases, intermittent failures)

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

<!-- Analysis: 9 tasks, 2 architectural layers (API + UI + tests). Within threshold — proceed as single story. No new migration needed. -->

- [x] Task 1 (AC: 1, 2) — Create health history API route with pagination + filtering
  - [x] 1.1 Create Zod schema `healthHistoryQuerySchema` in `src/lib/validations/health.ts` for query params (systemId, limit, offset, status filter)
  - [x] 1.2 Create `GET /api/admin/health/[systemId]/history` route with admin auth guard
  - [x] 1.3 Return `{ data: { checks: HealthCheck[], total: number, hasMore: boolean }, error: null }` shape
  - [x] 1.4 Write API route tests (auth, validation, pagination, filtering, edge cases)

- [x] Task 2 (AC: 1, 2) — Extend health query layer with parameterized history query
  - [x] 2.1 Add `getHealthCheckHistory(systemId, options)` to `src/lib/health/queries.ts` with offset/limit/status params
  - [x] 2.2 Add `healthHistoryQueryOptions(systemId, filters)` to `src/lib/admin/queries/health.ts`
  - [x] 2.3 Write unit tests for the new query function

- [x] Task 3 (AC: 1, 2) — Create HealthHistoryPanel component (main container)
  - [x] 3.1 Create `src/app/admin/analytics/_components/HealthHistoryPanel.tsx` — dialog/panel showing history for a specific system
  - [x] 3.2 Trigger from system row in `SystemsHealthTable.tsx` (e.g., system name click or history icon button)
  - [x] 3.3 Display system name + status in panel header
  - [x] 3.4 Write component tests

- [x] Task 4 (AC: 1, 2) — Create HealthCheckHistoryTable component with pagination
  - [x] 4.1 Create `src/app/admin/analytics/_components/HealthCheckHistoryTable.tsx` — paginated table of health_checks records
  - [x] 4.2 Columns: Status (badge), Response Time (ms), Error Message (truncated), Timestamp (relative + absolute)
  - [x] 4.3 Implement "Load More" pagination (offset-based, 20 records per page)
  - [x] 4.4 Add status filter (All / Success / Failure) using badge-style filter buttons
  - [x] 4.5 Write component tests (render, pagination, filtering, empty state, loading state)

- [x] Task 5 (AC: 3) — Create HealthTrendChart component for response time visualization
  - [x] 5.1 Create `src/app/admin/analytics/_components/HealthTrendChart.tsx` — wrapper with `dynamic(() => import(...), { ssr: false })`
  - [x] 5.2 Create `src/app/admin/analytics/_components/HealthTrendChartInner.tsx` — Recharts `AreaChart` showing response time over time
  - [x] 5.3 X-axis: timestamps (formatted with `date-fns`), Y-axis: response time (ms)
  - [x] 5.4 Color-code data points: green for success, red for failure
  - [x] 5.5 Show threshold line if system has custom `timeoutThreshold`
  - [x] 5.6 Write component tests (render, no data state, data rendering)

- [x] Task 6 (AC: 1, 2, 3) — Integrate HealthHistoryPanel into SystemsHealthTable
  - [x] 6.1 Add history icon button in `SystemsHealthTable.tsx`
  - [x] 6.2 Wire up `Dialog` open state per system (via HealthHistoryPanel internal state)
  - [x] 6.3 Pass `systemId`, `systemName`, `systemStatus`, `timeoutThreshold` to `HealthHistoryPanel`
  - [x] 6.4 Update existing SystemsHealthTable tests for new trigger

- [x] Task 7 (AC: 1, 2, 3) — Add validation schemas and types
  - [x] 7.1 Add `healthHistoryQuerySchema` and `HealthHistoryFilters` type to `src/lib/validations/health.ts`
  - [x] 7.2 Add `HealthHistoryResponse` type (paginated response shape)
  - [x] 7.3 Write schema boundary tests (13 tests for healthHistoryQuerySchema)

- [x] Task 8 — Update mock factories and existing test data
  - [x] 8.1 `createMockHealthCheckList(count, overrides)` already exists in `src/lib/test-utils/mock-factories.ts` (pre-existing)
  - [x] 8.2 Existing tests not broken by new exports — 1532 tests pass

- [x] Task 9 — Verify all tests pass + bundle budget
  - [x] 9.1 `npm run test` — 1532 tests pass across 135 files
  - [x] 9.2 `npm run type-check` — zero TypeScript errors
  - [x] 9.3 `npm run lint` — zero ESLint errors
  - [x] 9.4 `npm run size` — admin/analytics 206.3 KB / 350 KB (within budget)

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — This story does NOT add new migrations but does add a new API route. Verify that the API response shape matches the Zod schema and the HealthCheck type. -->
- [x] Task 10 (Integration Contract) — Verify API response matches Zod schema + HealthCheck type end-to-end

## Dev Notes

### Architecture & Integration Points

**No new database migration required.** Story 5-8 reads from the existing `health_checks` table (created in 5-1, pruned to 1000 records/system in 5-3). All data is already being collected — this story adds the UI to browse and visualize it.

**Existing query to extend — `src/lib/health/queries.ts`:**
- `getRecentHealthChecks(systemId, limit=10)` — currently used internally, hardcoded limit
- Extend with a new `getHealthCheckHistory()` that supports offset, limit, and status filter
- Keep existing `getRecentHealthChecks` untouched (used by other consumers)
- `HEALTH_CHECK_SELECT` constant already defined: `'id, system_id, status, response_time, error_message, checked_at'`

**Dashboard component tree (current):**
```
AnalyticsContent (server component — prefetches data)
  └─ HealthDashboard (client component — React Query hydration + realtime)
       ├─ ConnectionStatus
       ├─ HealthSummaryCards
       ├─ SystemsHealthTable ← ADD history trigger here
       │   └─ HealthConfigDialog (per-system config)
       │   └─ HealthHistoryPanel (NEW — dialog for history view)
       │       ├─ HealthCheckHistoryTable (NEW — paginated records)
       │       └─ HealthTrendChart (NEW — response time line chart)
       ├─ ResponseTimeChart (existing — current snapshot bar chart)
       └─ NotificationSettings
```

**Data flow for historical view:**
1. User clicks system name/history icon in `SystemsHealthTable`
2. `Dialog` opens with `HealthHistoryPanel` for that system
3. Panel fetches via React Query: `GET /api/admin/health/[systemId]/history?limit=20&offset=0`
4. Displays `HealthCheckHistoryTable` (paginated) + `HealthTrendChart` (line chart)
5. User can filter by status (All/Success/Failure)
6. "Load More" button fetches next page (offset += 20)

**Key design decisions:**
- **Dialog-based** (not separate page) — consistent with `HealthConfigDialog` pattern from Story 5-7
- **Offset-based pagination** (not cursor) — health_checks has composite index `(system_id, checked_at DESC)`, offset/limit is efficient within 1000-record window per system
- **No date range picker** — data is already pruned to 1000 records per system (Story 5-3). A time filter is unnecessary since the dataset is bounded. Status filter is more useful.
- **Recharts LineChart/AreaChart** — reuse existing Recharts dependency (already installed), follow lazy-loading pattern from `ResponseTimeChart.tsx`

### Critical Constraints (from project-context.md + previous stories)

1. **React Query scoped to `/admin/` routes ONLY** — provider in admin layout, NOT root
2. **All API responses use `{ data, error }` wrapper** via `ApiResponse<T>`
3. **snake_case → camelCase ONLY in data access layer** (`src/lib/health/queries.ts`)
4. **Admin auth required** — `requireApiAuth('admin')` on all API routes
5. **No `dark:` Tailwind classes** — ESLint rule `local/no-dark-classes` enforces
6. **All interactive elements min 44px** (`min-h-11`)
7. **`cn()` for conditional Tailwind** — never string concatenation
8. **Static imports in tests** — NEVER `await import()` (D1 lesson)
9. **`mutateAsync` + try/catch** for React Query mutations (Rule #7 in patterns)
10. **Lazy-load Recharts** — `dynamic(() => import(...), { ssr: false })` in `'use client'` wrapper
11. **ISO string timestamps** — no Date objects stored, transform at UI boundary with `date-fns`
12. **Bundle budget** — admin ≤ 350 KB First Load JS (`npm run size`)

### Existing Dependencies to Reuse (DO NOT add new packages)

| Package | Already Installed | Usage in 5-8 |
|---------|:-:|---|
| `recharts` ^3.7.0 | ✅ | LineChart/AreaChart for trend visualization |
| `date-fns` | ✅ | Timestamp formatting (`format`, `formatDistanceToNow`) |
| `@tanstack/react-query` ^5.x | ✅ | `queryOptions` + `useQuery` for paginated history |
| `react-hook-form` ^7.x | ✅ | Not needed (no form submission — read-only history view) |
| `zod` ^4.x | ✅ | Query param validation in API route |
| `resend` | ✅ | Not needed for this story |

### API Route Design

```typescript
// GET /api/admin/health/[systemId]/history
// Query params:
//   limit: number (default 20, max 100)
//   offset: number (default 0)
//   status: 'success' | 'failure' | undefined (all)
//
// Response:
// {
//   data: {
//     checks: HealthCheck[],    // array of health check records
//     total: number,            // total matching records
//     hasMore: boolean,         // offset + limit < total
//     systemName: string,       // for display in UI header
//   },
//   error: null
// }
```

### Zod Schema Design

```typescript
// Add to src/lib/validations/health.ts

export const healthHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['success', 'failure']).optional(),
})

export type HealthHistoryFilters = z.infer<typeof healthHistoryQuerySchema>

export interface HealthHistoryResponse {
  checks: HealthCheck[]
  total: number
  hasMore: boolean
  systemName: string
}
```

### Query Layer Design

```typescript
// Add to src/lib/health/queries.ts

export async function getHealthCheckHistory(
  systemId: string,
  options: { limit?: number; offset?: number; status?: string }
): Promise<{ checks: HealthCheck[]; total: number }> {
  const supabase = createServiceClient()
  const { limit = 20, offset = 0, status } = options

  let query = supabase
    .from('health_checks')
    .select(HEALTH_CHECK_SELECT, { count: 'exact' })
    .eq('system_id', systemId)
    .order('checked_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    checks: (data ?? []).map(toCamelCase<HealthCheck>),
    total: count ?? 0,
  }
}
```

### React Query Options Design

```typescript
// Add to src/lib/admin/queries/health.ts

export function healthHistoryQueryOptions(
  systemId: string,
  filters: HealthHistoryFilters
) {
  return queryOptions({
    queryKey: ['admin', 'health', 'history', systemId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(filters.limit ?? 20),
        offset: String(filters.offset ?? 0),
      })
      if (filters.status) params.set('status', filters.status)

      const res = await fetch(`/api/admin/health/${systemId}/history?${params}`)
      return unwrapResponse<HealthHistoryResponse>(res)
    },
    staleTime: 30_000, // 30 seconds — data doesn't change rapidly
  })
}
```

### Component Design

**HealthHistoryPanel.tsx** (Dialog container):
- Opens as `Dialog` triggered from `SystemsHealthTable`
- Header: system name + current status badge
- Body: tab-like layout with `HealthCheckHistoryTable` + `HealthTrendChart`
- Loading: skeleton matching layout
- Empty: "No health check records found" message

**HealthCheckHistoryTable.tsx** (Paginated table):
- Columns: Status (badge), Response Time (ms with color coding), Error (truncated), Timestamp (relative)
- Filter buttons: All | Success | Failure (badge-style toggle)
- "Load More" button at bottom (increments offset by 20)
- Shows "X of Y records" count
- Loading state: skeleton rows
- Empty state: "No records match your filter"

**HealthTrendChart.tsx** (Lazy-loaded wrapper):
- `dynamic(() => import('./HealthTrendChartInner'), { ssr: false })`
- Passes health checks array to inner component
- Skeleton while loading

**HealthTrendChartInner.tsx** (Recharts implementation):
- `AreaChart` with response time on Y-axis, timestamp on X-axis
- Data reversed (oldest → newest for left-to-right reading)
- Green fill for success, red dots for failures
- Tooltip with exact values
- Responsive container
- Custom dot renderer: green circle for success, red circle for failure
- Optional threshold line (`ReferenceLine`) if system has custom `timeoutThreshold`

### UI/UX Design

```
┌─────────────────────────────────────────────────────┐
│ Health History: System Name              [X Close]  │
│ Status: ● Online                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─── Response Time Trend ──────────────────────────┐│
│ │  AreaChart (response time over time)             ││
│ │  Green area = success, Red dots = failure        ││
│ │  ---- threshold line (if custom timeout set)     ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Filter: [All] [Success] [Failure]    Showing 20/847 │
│                                                     │
│ ┌─────────┬───────────┬──────────┬────────────────┐ │
│ │ Status  │ Resp Time │ Error    │ Timestamp      │ │
│ ├─────────┼───────────┼──────────┼────────────────┤ │
│ │ ✓ Pass  │ 234 ms    │ —        │ 2 minutes ago  │ │
│ │ ✓ Pass  │ 312 ms    │ —        │ 3 minutes ago  │ │
│ │ ✗ Fail  │ —         │ Timeout  │ 5 minutes ago  │ │
│ │ ✓ Pass  │ 198 ms    │ —        │ 6 minutes ago  │ │
│ │  ...    │           │          │                │ │
│ └─────────┴───────────┴──────────┴────────────────┘ │
│                                                     │
│            [ Load More (20 more) ]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Previous Story Intelligence (from Story 5-7)

**Patterns to follow:**
- Dialog pattern from `HealthConfigDialog.tsx` — `Dialog` + `DialogTrigger` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription`
- API route auth pattern: `requireApiAuth('admin')` + `isAuthError(auth)` check
- Query key convention: `['admin', 'health', 'history', systemId, filters]`
- Toast for errors: `toast.error('Failed to load health history')`
- `unwrapResponse<T>(res)` for API response parsing
- `bg-destructive/10` for failure highlighting (NOT `bg-red-50`)
- `cn()` for all conditional classes

**Files that will be modified (from 5-7 learnings):**
1. `src/lib/validations/health.ts` — add history schemas/types (EXTEND, don't break existing)
2. `src/lib/health/queries.ts` — add `getHealthCheckHistory` (EXTEND, keep existing functions)
3. `src/lib/admin/queries/health.ts` — add `healthHistoryQueryOptions` (EXTEND)
4. `src/app/admin/analytics/_components/SystemsHealthTable.tsx` — add history trigger
5. `src/lib/test-utils/mock-factories.ts` — add health check list factory

**New files:**
6. `src/app/api/admin/health/[systemId]/history/route.ts` — history API
7. `src/app/api/admin/health/[systemId]/history/route.test.ts` — API tests
8. `src/app/admin/analytics/_components/HealthHistoryPanel.tsx` — dialog container
9. `src/app/admin/analytics/_components/HealthHistoryPanel.test.tsx` — container tests
10. `src/app/admin/analytics/_components/HealthCheckHistoryTable.tsx` — paginated table
11. `src/app/admin/analytics/_components/HealthCheckHistoryTable.test.tsx` — table tests
12. `src/app/admin/analytics/_components/HealthTrendChart.tsx` — lazy wrapper
13. `src/app/admin/analytics/_components/HealthTrendChart.test.tsx` — wrapper tests
14. `src/app/admin/analytics/_components/HealthTrendChartInner.tsx` — Recharts implementation
15. `src/lib/health/queries.test.ts` — EXTEND with new query tests

### Testing Requirements

**Unit Tests:**
- `healthHistoryQuerySchema` — boundary values (min/max limit, offset, status enum)
- `getHealthCheckHistory` — Supabase query mock, snake_case → camelCase transform, pagination, filtering
- API route — auth guard, query param validation, response shape, error handling, malformed params

**Component Tests:**
- `HealthHistoryPanel` — renders system name, loading state, empty state, error state
- `HealthCheckHistoryTable` — renders records, pagination ("Load More"), filter toggle, empty filtered state
- `HealthTrendChart` — renders chart, no-data state
- `SystemsHealthTable` — updated tests for history trigger button

**Integration Contract:**
- API response shape matches `HealthHistoryResponse` type
- Query params validated by `healthHistoryQuerySchema`
- HealthCheck records match `healthCheckSchema` from existing validation

**Test baseline:** 1475 tests across 131 files. Target: ~1520+ tests after Story 5-8.

### Project Structure Notes

- Alignment with unified project structure: all new files follow existing `_components/` co-location pattern
- API route follows `[systemId]` dynamic segment pattern (consistent with `health-config` route from 5-7)
- No new packages — all dependencies already installed
- No barrel files — import directly from source
- No new migrations — reads existing `health_checks` table

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.8 section]
- [Source: _bmad-output/project-context.md — Rules 1-147]
- [Source: _bmad-output/planning-artifacts/architecture.md — Section 3.3 Data Fetching, Section 3.4 Real-time]
- [Source: _bmad-output/implementation-artifacts/5-7-configurable-health-check-settings.md — Dev Notes, Patterns]
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md — Rule #7 mutateAsync + try/catch]
- [Source: src/lib/health/queries.ts — HEALTH_CHECK_SELECT, getRecentHealthChecks]
- [Source: src/lib/validations/health.ts — HealthCheck type, healthCheckSchema]
- [Source: src/app/admin/analytics/_components/ResponseTimeChart.tsx — Recharts lazy-load pattern]
- [Source: src/app/admin/analytics/_components/HealthConfigDialog.tsx — Dialog trigger pattern]
- [Source: src/app/api/admin/systems/[systemId]/health-config/route.ts — Dynamic route + auth pattern]

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

(none)

### Completion Notes List

- All 10 tasks completed. 57 new tests added (1475 → 1532 tests, 131 → 135 files).
- No new migrations — reads existing `health_checks` table from Story 5-1.
- No new packages installed — reuses recharts, date-fns, React Query, Zod.
- Pagination approach changed from offset-accumulation to increasing-limit pattern to avoid ESLint `set-state-in-effect` violation. Functionally equivalent since dataset is bounded (1000 records/system from Story 5-3 pruning).
- TypeScript Recharts Tooltip formatter types required removing explicit annotations (inferred types work correctly).
- Bundle budget: admin/analytics 206.3 KB / 350 KB (well within limit).
- Integration contract verified: API response shape matches `HealthHistoryResponse` type via TypeScript compile + test coverage.

### File List

**New files (9):**
- `src/app/api/admin/health/[systemId]/history/route.ts` — Health history API route
- `src/app/api/admin/health/[systemId]/history/route.test.ts` — API route tests (13 tests)
- `src/app/admin/analytics/_components/HealthHistoryPanel.tsx` — Dialog container
- `src/app/admin/analytics/_components/HealthHistoryPanel.test.tsx` — Panel tests (4 tests)
- `src/app/admin/analytics/_components/HealthCheckHistoryTable.tsx` — Paginated table
- `src/app/admin/analytics/_components/HealthCheckHistoryTable.test.tsx` — Table tests (13 tests)
- `src/app/admin/analytics/_components/HealthTrendChart.tsx` — Lazy-loaded chart wrapper
- `src/app/admin/analytics/_components/HealthTrendChartInner.tsx` — Recharts AreaChart
- `src/app/admin/analytics/_components/HealthTrendChart.test.tsx` — Chart tests (6 tests)

**Modified files (7):**
- `src/lib/validations/health.ts` — Added `healthHistoryQuerySchema`, `HealthHistoryFilters`, `HealthHistoryResponse`
- `src/lib/validations/health.test.ts` — Added 13 boundary tests for `healthHistoryQuerySchema`
- `src/lib/health/queries.ts` — Added `getHealthCheckHistory()` function
- `src/lib/health/queries.test.ts` — Added 7 tests for `getHealthCheckHistory`
- `src/lib/admin/queries/health.ts` — Added `healthHistoryQueryOptions()` React Query options
- `src/app/admin/analytics/_components/SystemsHealthTable.tsx` — Added History column + HealthHistoryPanel
- `src/app/admin/analytics/_components/SystemsHealthTable.test.tsx` — Updated mocks + added history trigger test

### Change Log

| Change | Details |
|--------|---------|
| Pagination approach | Changed from offset-accumulation (useEffect + setState) to increasing-limit pattern to satisfy ESLint rules. No functional impact. |
| Code review fix H1 | `hsl(var(--destructive))` → `var(--destructive)` in HealthTrendChartInner.tsx (2 occurrences). CSS vars use oklch(), wrapping in hsl() produced invalid CSS. |
| Code review fix M1 | CustomDot `!cx` falsy check → `cx == null` null check. Prevented dots rendering at SVG coordinate 0. |
| Code review fix M2 | Added `z.array(healthCheckSchema).parse()` to `getHealthCheckHistory` return — consistent with `getRecentHealthChecks` pattern. |
| Code review fix L1 | Added loading skeleton test for HealthHistoryPanel with never-resolving queryFn mock. |
| Code review fix L2 | Fixed File List counts: "New files (10)" → (9), "Modified files (5)" → (7). |

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->
