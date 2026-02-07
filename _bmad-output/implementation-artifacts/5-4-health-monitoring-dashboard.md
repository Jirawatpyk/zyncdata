# Story 5.4: Health Monitoring Dashboard

Status: done

## Story

As an Admin,
I want a real-time dashboard showing all system health statuses, response times, and timestamps,
So that I can monitor system health at a glance.

## Acceptance Criteria

1. **Given** I navigate to `/admin/analytics`
   **When** the page loads
   **Then** I see all portfolio systems with their current status (online/offline), response time (ms), and last checked timestamp
   **And** the page loads within 3 seconds (NFR-P2)

2. **Given** the dashboard is displayed
   **When** I view the summary section
   **Then** I see overall statistics: total systems count, online count, offline count, and average response time
   **And** the summary is visually prominent at the top of the page

3. **Given** a system is offline
   **When** I view the dashboard
   **Then** offline systems are visually prominent with red indicators and sorted/highlighted above online systems

4. **Given** I view a specific system's card/row
   **When** I check the details
   **Then** I see: system name, current status badge (reuse `StatusBadge`), response time (ms), last checked timestamp (relative via `date-fns`)

5. **Given** the dashboard has loaded
   **When** I view the connection status indicator
   **Then** I see whether real-time updates are active or using polling fallback (placeholder for Story 5-5 WebSocket integration)

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD -- 10 tasks, 2 architectural layers (UI + queries). Within threshold. -->

- [x] Task 1: Install recharts + create health query options (AC: #1, #4)
  - [x] 1.1 `npm install recharts react-is`
  - [x] 1.2 Create `src/lib/admin/queries/health.ts` — `healthDashboardQueryOptions` using `queryOptions()` factory pattern
  - [x] 1.3 Create API route `src/app/api/admin/health/route.ts` — GET endpoint returning all systems with latest health data
  - [x] 1.4 Add `createMockHealthDashboard()` to `src/lib/test-utils/mock-factories.ts`
- [x] Task 2: Create dashboard summary cards (AC: #2)
  - [x] 2.1 Create `src/app/admin/analytics/_components/HealthSummaryCards.tsx` — 4 cards: Total Systems, Online, Offline, Avg Response Time
  - [x] 2.2 Use shadcn Card component, lucide-react icons (Activity, CheckCircle, XCircle, Clock)
- [x] Task 3: Create systems health table (AC: #1, #3, #4)
  - [x] 3.1 Create `src/app/admin/analytics/_components/SystemsHealthTable.tsx` — sortable table showing all systems with status, response time, last checked
  - [x] 3.2 Reuse `StatusBadge` from `src/components/patterns/StatusBadge.tsx`
  - [x] 3.3 Use `formatDistanceToNow()` from `date-fns` for relative timestamps
  - [x] 3.4 Offline systems sorted to top with red row highlight
- [x] Task 4: Create response time chart (AC: #4)
  - [x] 4.1 Create `src/app/admin/analytics/_components/ResponseTimeChart.tsx` — recharts BarChart showing response times per system
  - [x] 4.2 Wrap with `next/dynamic({ ssr: false })` in a `'use client'` wrapper component
  - [x] 4.3 Use `ResponsiveContainer` for fluid layout
- [x] Task 5: Create connection status indicator (AC: #5)
  - [x] 5.1 Create `src/app/admin/analytics/_components/ConnectionStatus.tsx` — shows "Polling" badge (placeholder for WebSocket in Story 5-5)
  - [x] 5.2 Display last refresh timestamp and auto-refresh interval
- [x] Task 6: Create dashboard page + loading skeleton (AC: #1)
  - [x] 6.1 Create `src/app/admin/analytics/page.tsx` — Server Component with Suspense pattern (same as Systems page)
  - [x] 6.2 Create `src/app/admin/analytics/loading.tsx` — skeleton matching page layout
  - [x] 6.3 Create `src/app/admin/analytics/_components/AnalyticsSkeleton.tsx`
- [x] Task 7: Add auto-refresh with React Query (AC: #1, #5)
  - [x] 7.1 Set `refetchInterval: 60_000` on health dashboard query (60s polling, matches cron interval)
  - [x] 7.2 Update `ConnectionStatus` to show countdown to next refresh
- [x] Task 8: Write unit tests (all ACs)
  - [x] 8.1 Test `HealthSummaryCards` — renders correct counts, handles zero/all-offline states
  - [x] 8.2 Test `SystemsHealthTable` — renders systems, sorts offline to top, shows status badges
  - [x] 8.3 Test `ResponseTimeChart` — renders chart container (mock recharts), handles empty data
  - [x] 8.4 Test `ConnectionStatus` — shows polling status, displays refresh time
  - [x] 8.5 Test health query options — correct query key, correct fetch URL
  - [x] 8.6 Test API route — returns health data, handles auth, handles errors
- [x] Task 9: Write integration test for dashboard page
  - [x] 9.1 Test full page render with mock data — summary cards + table + chart all present
  - [x] 9.2 Test empty state — no systems scenario
  - [x] 9.3 Test error state — API failure handling
- [x] Task 10: Verify bundle budget
  - [x] 10.1 Run `npm run size` — `/admin/analytics` must be ≤ 350 KB First Load JS
  - [x] 10.2 If over budget, verify recharts is lazy-loaded via `next/dynamic`

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION -- This story only adds UI + read queries (no migrations). No integration contract verification needed. -->

## Dev Notes

### Architecture & Patterns

**Page Structure** — Follow exact pattern from `/admin/systems/page.tsx`:
```
page.tsx (Server Component)
  └── Suspense fallback={<AnalyticsSkeleton />}
        └── AnalyticsContent (async Server Component — prefetch data)
              └── HealthDashboard (Client Component — React Query)
```

**React Query** — ADMIN ONLY, use `queryOptions()` factory:
```typescript
// src/lib/admin/queries/health.ts
export const healthDashboardQueryOptions = queryOptions({
  queryKey: ['admin', 'health', 'dashboard'],
  queryFn: async () => {
    const res = await fetch('/api/admin/health')
    return unwrapResponse<HealthDashboardData>(res)
  },
  staleTime: 30_000,         // 30s stale (health data changes more frequently)
  refetchInterval: 60_000,   // Auto-refresh every 60s (matches cron interval)
})
```

**Data Shape** — Define in validation schema:
```typescript
// src/lib/validations/health.ts (extend existing)
export interface HealthDashboardData {
  systems: SystemHealthSummary[]
  summary: {
    total: number
    online: number
    offline: number
    unknown: number
    avgResponseTime: number | null
  }
  lastUpdated: string  // ISO timestamp
}

export interface SystemHealthSummary {
  id: string
  name: string
  url: string
  status: string | null
  responseTime: number | null
  lastCheckedAt: string | null
  consecutiveFailures: number
  category: string | null
  enabled: boolean
}
```

**API Route** — `src/app/api/admin/health/route.ts`:
- Use `createSupabaseServer()` (NOT service client — this is an authenticated admin request)
- Call `requireApiAuth()` for admin role check
- Query `systems` table directly (health data is on the systems table: `status`, `response_time`, `last_checked_at`)
- Return `ApiResponse<HealthDashboardData>` wrapper
- Calculate summary stats server-side

### Recharts Integration (CRITICAL — Bundle Budget)

**recharts** adds ~45 KB gzipped. MUST lazy-load to avoid impacting other admin routes:

```typescript
// src/app/admin/analytics/_components/ResponseTimeChart.tsx
'use client'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('./ResponseTimeChartInner'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded bg-muted" />
})

export default function ResponseTimeChart(props: ResponseTimeChartProps) {
  return <Chart {...props} />
}
```

```typescript
// src/app/admin/analytics/_components/ResponseTimeChartInner.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
// ... chart implementation
```

This matches the TipTap lazy-loading pattern from Story 4-1 (111 KB chunk).

### Reuse Existing Components

| Component | Location | Usage |
|-----------|----------|-------|
| `StatusBadge` | `src/components/patterns/StatusBadge.tsx` | System status display (online/offline/unknown) |
| `Card` | `src/components/ui/card.tsx` | Summary cards wrapper |
| `Badge` | `src/components/ui/badge.tsx` | Connection status indicator |
| `LoadingSpinner` | `src/components/patterns/LoadingSpinner.tsx` | Query loading state |
| `cn()` | `src/lib/utils.ts` | Conditional Tailwind classes |
| `formatDistanceToNow` | `date-fns` (already installed v4.1.0) | Relative timestamps |

### Existing Health Module (DO NOT Modify)

These files already exist from Stories 5-1/5-2/5-3. **Read-only reference — do NOT modify:**

| File | Purpose |
|------|---------|
| `src/lib/health/queries.ts` | `getRecentHealthChecks()`, `getLatestHealthCheck()`, `getHealthCheckCount()` — server-side, uses service client |
| `src/lib/health/mutations.ts` | `runAllHealthChecks()`, `withConcurrencyLimit()` — cron only |
| `src/lib/health/check.ts` | `checkSystemHealthWithRetry()` — cron only |
| `src/lib/supabase/service.ts` | Service role client (bypasses RLS) — cron only, NOT for admin UI |
| `src/lib/validations/health.ts` | `healthCheckSchema`, `HEALTH_CHECK_SELECT` constant |
| `src/app/api/cron/health-check/route.ts` | Vercel Cron endpoint — uses `CRON_SECRET`, not admin auth |

**Important:** The dashboard API route should query the `systems` table directly (which already has `status`, `response_time`, `last_checked_at` fields updated by the cron job). Do NOT call the health check functions — those are for the cron service.

### Sidebar Navigation

The sidebar (`src/app/admin/_components/AdminSidebar.tsx`) already has the Analytics nav item:
```typescript
{ label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
```
No sidebar changes needed.

### Database Queries

The dashboard only needs to read from the `systems` table. No new migrations required.

```sql
-- Dashboard query (via Supabase client)
SELECT id, name, url, status, response_time, last_checked_at,
       consecutive_failures, category, enabled
FROM systems
WHERE deleted_at IS NULL
ORDER BY
  CASE WHEN status = 'offline' THEN 0 ELSE 1 END,
  display_order ASC
```

### Styling Guidelines

- No `dark:` classes (ESLint enforces)
- All interactive elements: `min-h-11` (44px minimum)
- Use `cn()` for conditional classes
- Card colors for summary: use `text-emerald-600` (online), `text-red-600` (offline), `text-muted-foreground` (neutral)
- Match existing admin page padding: `p-6` container, `mb-6` header spacing
- Skeleton: `animate-pulse rounded bg-muted`

### Testing Strategy

- **Unit tests:** Vitest + React Testing Library (NOT Jest)
- **Mock React Query:** Use `QueryClientProvider` wrapper in tests with fresh `QueryClient`
- **Mock fetch:** `vi.stubGlobal('fetch', vi.fn())` pattern
- **Mock recharts:** Mock the chart components (don't render actual SVG in unit tests)
- **Static imports ONLY** — NEVER use `await import()` in test cases (causes 5s+ timeout under load)
- **3 states per component:** happy path, loading, error
- **Mock factories:** Extend `src/lib/test-utils/mock-factories.ts` with `createMockHealthDashboard()`
- **data-testid:** Add to all containers and interactive elements

### Performance Requirements

- Page load: ≤ 3 seconds (NFR-P2)
- Bundle: ≤ 350 KB First Load JS for `/admin/analytics`
- Recharts: lazy-loaded via `next/dynamic({ ssr: false })` — ~45 KB separate chunk
- Auto-refresh: 60s interval via React Query `refetchInterval`
- No unnecessary re-renders: use `useMemo` for computed summary stats if needed

### Project Structure Notes

- Alignment with unified project structure: admin pages follow `src/app/admin/{feature}/page.tsx` + `_components/` pattern
- Query files: `src/lib/admin/queries/health.ts` (new)
- No mutations needed (read-only dashboard)
- No new mutations file needed — this story is read-only
- API route: `src/app/api/admin/health/route.ts` (new)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5, Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-3.3-Real-time-Communication]
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md]
- [Source: _bmad-output/implementation-artifacts/5-1-basic-health-check-service-status-updates.md]
- [Source: _bmad-output/implementation-artifacts/5-2-failure-detection-retry-logic-recovery.md]
- [Source: _bmad-output/implementation-artifacts/5-3-health-check-data-pruning-scalability.md]
- [Source: _bmad-output/project-context.md — 147 rules]
- [Source: recharts docs — ResponsiveContainer, BarChart, dynamic import pattern]

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| Installed shadcn `Card` component | Required by story (2.2) but not pre-installed | Adds `src/components/ui/card.tsx` — no bundle impact (tree-shaken) |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Integration test timeout: `vi.useFakeTimers()` blocks React Query's internal `setTimeout`. Fix: call `vi.useRealTimers()` at start of async tests (same pattern as `SystemsList.test.tsx`).
- Recharts `Tooltip.formatter` type requires `(value) =>` without explicit type annotation (type widened to `number | undefined` by recharts).
- shadcn `Card` component not pre-installed — added via `npx shadcn@latest add card`.

### Completion Notes List

- Implemented full health monitoring dashboard at `/admin/analytics` with 4 summary cards, sortable health table, response time bar chart, and connection status indicator
- API route `/api/admin/health` queries `systems` table directly (no health_checks table), with `requireApiAuth('admin')` guard
- Recharts lazy-loaded via `next/dynamic({ ssr: false })` — bundle at 206.3 KB / 350 KB budget
- 60s auto-refresh via React Query `refetchInterval`, 30s stale time
- Offline systems sorted to top with `bg-red-50` row highlight
- 31 new tests across 7 test files (HealthSummaryCards: 5, SystemsHealthTable: 6, ResponseTimeChart: 2, ConnectionStatus: 4, health query: 4, API route: 5, HealthDashboard integration: 5)
- Full regression suite: 1368 tests pass, 0 failures
- Security checklist: all applicable checks pass (read-only dashboard, no user input, explicit column select, auth guard)

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (Code Review Agent)
**Date:** 2026-02-07
**Outcome:** Approved (after fixes)

**Issues Found & Fixed:**

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| H1 | HIGH | Missing `AnalyticsContent` async Server Component — page.tsx didn't follow Systems page Suspense pattern, causing no server-side prefetch | Added `AnalyticsContent` with server-side Supabase query + `initialData` prop to HealthDashboard |
| M1 | MEDIUM | API route missing `enabled` filter — disabled systems shown in dashboard | Added `.eq('enabled', true)` to Supabase query in both API route and server component |
| M2 | MEDIUM | Redundant double-sort — Supabase `.order('status')` relied on alphabetical coincidence, then JS re-sorted | Removed Supabase `.order('status')`, kept only `.order('display_order')` + JS sort |
| M3 | MEDIUM | Tooltip `hsl(var(--border))` and Bar `hsl(var(--primary))` — wrapping OKLCH values in `hsl()` produces broken colors | Changed to `var(--border)` and `var(--primary)` (direct OKLCH) |
| M4 | MEDIUM | `global.fetch = mockFetch` mutates global without cleanup | Replaced with `vi.stubGlobal('fetch', mockFetch)` + `vi.restoreAllMocks()` in afterEach |
| L1 | LOW | Redundant `'use client'` on HealthSummaryCards and SystemsHealthTable (inherited from parent client component) | Removed directives |

**Post-fix verification:** 31/31 story tests pass, 1367/1368 full regression (1 pre-existing flaky test in `mfa.test.ts` — timing-dependent under load, passes in isolation).

### Change Log

- 2026-02-07: Implemented Story 5-4 Health Monitoring Dashboard — all 10 tasks complete
- 2026-02-07: Code review fixes — H1 server prefetch, M1 enabled filter, M2 double sort, M3 OKLCH color, M4 test cleanup, L1 redundant directives

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**New Files:**
- `src/app/admin/analytics/page.tsx` (modified — replaced placeholder)
- `src/app/admin/analytics/loading.tsx`
- `src/app/admin/analytics/_components/AnalyticsSkeleton.tsx`
- `src/app/admin/analytics/_components/HealthDashboard.tsx`
- `src/app/admin/analytics/_components/HealthSummaryCards.tsx`
- `src/app/admin/analytics/_components/SystemsHealthTable.tsx`
- `src/app/admin/analytics/_components/ResponseTimeChart.tsx`
- `src/app/admin/analytics/_components/ResponseTimeChartInner.tsx`
- `src/app/admin/analytics/_components/ConnectionStatus.tsx`
- `src/app/api/admin/health/route.ts`
- `src/lib/admin/queries/health.ts`
- `src/components/ui/card.tsx` (shadcn install)

**Modified Files:**
- `src/lib/validations/health.ts` (added dashboard interfaces)
- `src/lib/test-utils/mock-factories.ts` (added health dashboard mock factories)
- `package.json` / `package-lock.json` (recharts, react-is)

**Test Files:**
- `src/app/admin/analytics/_components/HealthSummaryCards.test.tsx`
- `src/app/admin/analytics/_components/SystemsHealthTable.test.tsx`
- `src/app/admin/analytics/_components/ResponseTimeChart.test.tsx`
- `src/app/admin/analytics/_components/ConnectionStatus.test.tsx`
- `src/app/admin/analytics/_components/HealthDashboard.test.tsx`
- `src/lib/admin/queries/health.test.ts`
- `src/app/api/admin/health/route.test.ts`
