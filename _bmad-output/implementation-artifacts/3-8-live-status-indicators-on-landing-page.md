# Story 3.8: Live Status Indicators on Landing Page

Status: done

## Story

As a visitor,
I want to see health status indicators and freshness timestamps on each system card,
so that I know which systems are online and how recent the data is before clicking.

## Acceptance Criteria

1. **Given** I am on the public landing page **When** I view system cards **Then** each card displays a status badge showing the current system status from the database (online/offline) **And** each card shows a "Last checked: X minutes ago" timestamp
2. **Given** a system's status is "online" **When** I view its card **Then** I see a green indicator
3. **Given** a system's status is "offline" **When** I view its card **Then** I see a red indicator with visual prominence (visual hierarchy draws attention to offline systems)
4. **Given** the status field in the database is null or unknown **When** I view the card **Then** a neutral/gray indicator is shown with text "Status unknown"
5. **Given** status indicators are displaying **When** Epic 5 Health Check Service is not yet implemented **Then** systems display seeded/default values (status: null → "Status unknown") to avoid false trust in unverified data

## Tasks / Subtasks

- [x] Task 1: Database migration — add `last_checked_at` column to `systems` table (AC: #1)
  - [x] 1.1 Create migration `20260207000002_add_last_checked_at_to_systems.sql`
  - [x] 1.2 Add `last_checked_at TIMESTAMPTZ NULL` column
  - [x] 1.3 ~~Update seed.sql~~ — Not needed: `last_checked_at` defaults to NULL; no seed.sql change required
  - [x] 1.4 Regenerate database types (`npm run db:types`)
- [x] Task 2: Update validation schema and types (AC: #1)
  - [x] 2.1 Add `lastCheckedAt: z.string().nullable()` to `systemSchema` in `src/lib/validations/system.ts`
  - [x] 2.2 Add `last_checked_at` to `SYSTEM_SELECT_COLUMNS` in `src/lib/systems/queries.ts`
  - [x] 2.3 Update transform layer tests for `lastCheckedAt` field
- [x] Task 3: Install shadcn/ui Badge component (AC: #2, #3, #4)
  - [x] 3.1 Run `npx shadcn@latest add badge`
  - [x] 3.2 Verify Badge component installed at `src/components/ui/badge.tsx`
- [x] Task 4: Create StatusBadge component (AC: #2, #3, #4)
  - [x] 4.1 Create `src/components/patterns/StatusBadge.tsx` — Server Component
  - [x] 4.2 Map status values: `'online'` → green, `'offline'` → red, `null`/unknown → gray
  - [x] 4.3 Use `animate-ping` with `motion-safe:` for online dot pulse
  - [x] 4.4 Include proper `aria-label` for accessibility
  - [x] 4.5 Write unit tests `src/components/patterns/StatusBadge.test.tsx`
- [x] Task 5: Create RelativeTime client component (AC: #1)
  - [x] 5.1 Create utility `src/lib/utils/relative-time.ts` using native `Intl.RelativeTimeFormat`
  - [x] 5.2 Create `src/components/patterns/RelativeTime.tsx` — `'use client'` leaf component
  - [x] 5.3 Auto-refresh every 60 seconds via `setInterval`
  - [x] 5.4 Handle null `lastCheckedAt` — display "Never checked"
  - [x] 5.5 Write unit tests for utility and component
- [x] Task 6: Update SystemCard to display status indicators (AC: #1, #2, #3, #4)
  - [x] 6.1 Add `lastCheckedAt` prop to `SystemCardProps`
  - [x] 6.2 Add StatusBadge below the system name/description area
  - [x] 6.3 Add RelativeTime below the StatusBadge (or footer area)
  - [x] 6.4 Handle `coming_soon` status — show "Coming Soon" badge (no health indicator)
  - [x] 6.5 Update existing SystemCard tests for new props and rendering
  - [x] 6.6 Add accessibility tests for status indicators
- [x] Task 7: Update landing page to pass `lastCheckedAt` (AC: #1)
  - [x] 7.1 Update `SystemGrid` in `src/app/(public)/page.tsx` to pass `lastCheckedAt` prop
- [x] Task 8: E2E tests (AC: #1-#5)
  - [x] 8.1 Create `tests/e2e/landing-page-status.spec.ts`
  - [x] 8.2 Test status badge visibility on landing page cards
  - [x] 8.3 Test timestamp display on cards
  - [x] 8.4 Test unknown/null status displays gray badge

## Dev Notes

### Architecture Decision: Status Display Before Epic 5

This story displays **read-only status data** from the existing `systems.status` column. Real health checks are implemented in Epic 5. Before Epic 5:
- All systems have `status: NULL` (seeded) → displays "Status unknown" (gray badge)
- `coming_soon` systems show a "Coming Soon" badge instead of health status
- `last_checked_at` will be NULL → displays "Never checked"

This avoids showing false "online"/"offline" indicators until real health data exists.

### Database Schema

The `systems` table already has a `status TEXT NULL` column. Only `last_checked_at` needs to be added:

```sql
-- Migration: 20260207000002_add_last_checked_at_to_systems.sql
ALTER TABLE systems ADD COLUMN last_checked_at TIMESTAMPTZ NULL;
```

No seed data changes needed — `last_checked_at` defaults to NULL.

### Status Mapping Logic

```
status value       → Badge color   → Label           → Dot animation
─────────────────────────────────────────────────────────────────
'online'           → green         → "Online"        → animate-ping (pulse)
'offline'          → red           → "Offline"       → static (no animation)
null / unknown     → gray          → "Status unknown" → static
'coming_soon'      → blue/indigo   → "Coming Soon"   → static (existing behavior)
```

### Component Architecture

```
SystemCard (RSC — server component)
├── StatusBadge (RSC — no client JS needed)
│   └── StatusDot (RSC — ping animation is CSS-only)
└── RelativeTime ('use client' — needs useEffect/useState for auto-refresh)
```

- **StatusBadge**: Pure RSC. Uses `shadcn/ui Badge` + custom colored dot. Zero client JS.
- **RelativeTime**: Must be `'use client'` because it auto-refreshes every 60s via `useEffect`. It's a **leaf component** — minimal bundle impact.
- **Intl.RelativeTimeFormat**: Native browser/Node.js API. Zero-dependency. Works in SSR.

### StatusBadge Component Design

```typescript
// src/components/patterns/StatusBadge.tsx
// NO 'use client' — this is a Server Component

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SystemStatus = 'online' | 'offline' | 'coming_soon' | 'unknown'

function resolveStatus(status: string | null): SystemStatus {
  if (status === 'online' || status === 'offline' || status === 'coming_soon') return status
  return 'unknown'
}

const CONFIG = {
  online:      { label: 'Online',         dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ping: true },
  offline:     { label: 'Offline',         dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             ping: false },
  unknown:     { label: 'Status unknown',  dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-600 border-gray-200',          ping: false },
  coming_soon: { label: 'Coming Soon',     dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    ping: false },
} as const
```

### RelativeTime Utility (Zero Dependencies)

```typescript
// src/lib/utils/relative-time.ts
// Uses native Intl.RelativeTimeFormat — 0 KB bundle impact

const CUTOFFS = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity]
const UNITS: Intl.RelativeTimeFormatUnit[] = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year']

export function getRelativeTimeString(date: Date | number, lang = 'en'): string {
  const timeMs = typeof date === 'number' ? date : date.getTime()
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000)
  if (Math.abs(deltaSeconds) < 10) return 'just now'
  const unitIndex = CUTOFFS.findIndex((cutoff) => Math.abs(deltaSeconds) < cutoff)
  const divisor = unitIndex ? CUTOFFS[unitIndex - 1] : 1
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  return rtf.format(Math.round(deltaSeconds / divisor), UNITS[unitIndex])
}
```

### SystemCard Changes

Current `SystemCardProps` has: `name, url, logoUrl, description, status`. Add `lastCheckedAt: string | null`.

Layout update — add status row below description:

```
┌─────────────────────────────────────┐
│ [Logo]  System Name          [→]    │
│         Description text...         │
│         ● Online    Last checked:   │
│                     5 minutes ago   │
└─────────────────────────────────────┘
```

For `coming_soon` systems: show "Coming Soon" badge instead of health status. No timestamp.

For `offline` systems: use stronger visual treatment (e.g., slightly more prominent badge) to draw attention per AC #3.

### Landing Page Changes

Only change: pass `lastCheckedAt` to `SystemCard` in `SystemGrid`:

```tsx
<SystemCard
  name={system.name}
  url={system.url}
  logoUrl={system.logoUrl}
  description={system.description}
  status={system.status}
  lastCheckedAt={system.lastCheckedAt}  // NEW
/>
```

### Project Structure Notes

**New files:**
- `supabase/migrations/20260207000002_add_last_checked_at_to_systems.sql`
- `src/components/ui/badge.tsx` (installed via shadcn CLI)
- `src/components/patterns/StatusBadge.tsx`
- `src/components/patterns/StatusBadge.test.tsx`
- `src/components/patterns/RelativeTime.tsx`
- `src/components/patterns/RelativeTime.test.tsx`
- `src/lib/utils/relative-time.ts`
- `src/lib/utils/relative-time.test.ts`
- `tests/e2e/landing-page-status.spec.ts`

**Modified files:**
- `src/lib/validations/system.ts` — add `lastCheckedAt` to `systemSchema`
- `src/lib/validations/system.test.ts` — update tests
- `src/lib/systems/queries.ts` — add `last_checked_at` to `SYSTEM_SELECT_COLUMNS`
- `src/components/patterns/SystemCard.tsx` — add StatusBadge + RelativeTime
- `src/components/patterns/SystemCard.test.tsx` — update tests
- `src/app/(public)/page.tsx` — pass `lastCheckedAt` prop
- `src/types/database.ts` — regenerated (auto via `npm run db:types`)

### Critical Implementation Rules

1. **Next.js 16 async params:** `const { id } = await params` in dynamic routes
2. **snake_case → camelCase:** Only in `src/lib/systems/queries.ts` (transform layer)
3. **No `dark:` Tailwind classes** — ESLint `local/no-dark-classes` enforces
4. **Min 44px touch targets** — `min-h-11` on interactive elements
5. **`cn()` for conditional classes** — never string concatenation
6. **`'use client'` only on RelativeTime** — StatusBadge stays RSC
7. **No barrel files** — import directly from source
8. **Vitest syntax** — `describe`, `it`, `expect`, `vi.mock` (not Jest)
9. **Co-locate unit tests** — `ComponentName.test.tsx` next to `ComponentName.tsx`
10. **`revalidatePath('/')` not needed here** — this is read-only, no mutations
11. **shadcn/ui New York style** — when installing Badge component

### Anti-Patterns to Avoid

- **NO** `moment.js` or `date-fns` — use native `Intl.RelativeTimeFormat`
- **NO** polling/WebSocket for status refresh in this story — that's Epic 5
- **NO** fake "online" seed data — keep `status: NULL` to avoid false trust
- **NO** `dark:` Tailwind classes
- **NO** global state for status — RSC fetches from DB on page load
- **NO** client-side Supabase queries on public page — use server component
- **NO** manual `updated_at` setting in migration
- **NO** modifying `createSystemSchema` or `updateSystemSchema` — status is read-only from health checks
- **NO** adding status editing to admin panel — status comes from health checks only (Epic 5)

### Testing Strategy

**Unit tests (~15-20 new tests):**
- `StatusBadge.test.tsx`: online/offline/null/coming_soon rendering, correct colors, aria-labels, ping animation class
- `RelativeTime.test.tsx`: renders time string, handles null, auto-refresh behavior (vi.useFakeTimers)
- `relative-time.test.ts`: utility function — various time deltas, edge cases (just now, minutes, hours, days)
- `system.test.ts`: validation schema includes `lastCheckedAt`
- `SystemCard.test.tsx`: updated tests with `lastCheckedAt` prop, status badge rendering

**E2E tests (~4-6 tests):**
- Landing page shows status badges on system cards
- Unknown/null status shows gray "Status unknown" badge
- Coming soon systems show "Coming Soon" badge
- Timestamp area shows "Never checked" for null `last_checked_at`

### Dependencies from Previous Stories

- **Story 3.1-3.7:** All system CRUD, logo management, admin panel complete
- **SystemCard** already exists with `status` prop (used for `coming_soon` routing)
- **Landing page** already passes `status` to SystemCard
- **`getEnabledSystems()`** already fetches `status` column
- **`systemSchema`** already validates `status: z.string().nullable()`
- **next/image** already configured with remotePatterns (Story 3.7)

### What Epic 5 Will Change

When Epic 5 (Health Check Service) is implemented:
- A background service will periodically check system URLs
- It will UPDATE `systems.status` to `'online'` or `'offline'`
- It will UPDATE `systems.last_checked_at` to the check timestamp
- The StatusBadge and RelativeTime components will automatically display real data
- No changes to Story 3.8 code needed — it's already wired up

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Schema]
- [Source: _bmad-output/planning-artifacts/architecture.md#Real-time Architecture]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/3-7-system-logo-management.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed shadcn Badge `dark:` classes — removed 3 occurrences to pass ESLint `local/no-dark-classes` rule
- Updated 10+ test files with `lastCheckedAt: null` / `last_checked_at: null` in System mock objects to fix Zod validation and TypeScript type errors after adding the field to `systemSchema`
- RelativeTime test: corrected expected value for 90s → "1 minute ago" (not "2 minutes ago") — `Intl.RelativeTimeFormat` rounds 1.5 to 1
- SystemCard tests: separated fake-timer tests from axe accessibility tests to avoid axe timeout conflicts
- [CR] database.ts was NOT regenerated in original commit — fixed by running `npx supabase gen types typescript --local`
- [CR] Offline StatusBadge lacked visual prominence per AC #3 — added `font-semibold` + `border-red-300`
- [CR] `Intl.RelativeTimeFormat` was instantiated on every call — memoized with Map cache
- [CR] StatusBadge tests used fragile `JSON.stringify(jsx)` pattern — rewritten to use `render()` + DOM queries
- [CR] 6 files in commit missing from File List — added (admin dialog tests, E2E fixes, sprint-status)
- [CR] `admin-delete-system.spec.ts` included unrelated ISR fix — documented as scope note
- [CR] Task 1.3 seed.sql update was unnecessary (NULL default) — task description corrected

### Completion Notes List

- ✅ Task 1: Migration `20260207000002_add_last_checked_at_to_systems.sql` created and pushed to cloud. Types regenerated.
- ✅ Task 2: `systemSchema` updated with `lastCheckedAt`, `SYSTEM_SELECT_COLUMNS` updated, 5 new schema tests added (83 total in system.test.ts)
- ✅ Task 3: shadcn/ui Badge installed, `dark:` classes removed
- ✅ Task 4: StatusBadge RSC created with 4-status mapping (online/offline/unknown/coming_soon), 15 unit tests including 3 axe a11y tests
- ✅ Task 5: `getRelativeTimeString` utility (zero dependencies, native `Intl.RelativeTimeFormat`), RelativeTime client component with 60s auto-refresh, 10+8=18 tests
- ✅ Task 6: SystemCard updated with StatusBadge + RelativeTime, coming_soon hides timestamp, 22 tests (8 new status indicator tests + 4 a11y tests)
- ✅ Task 7: Landing page passes `lastCheckedAt` prop to SystemCard
- ✅ Task 8: 5 E2E tests covering status badge visibility, unknown status, coming_soon, timestamp display
- ✅ Security checklist: All 8 sections evaluated — all N/A (read-only display, no auth, no mutations, no user input)
- **Test totals:** 983 tests across 84 files — 0 failures (was 935 across 81 files pre-story)

### Change Log

- 2026-02-06: Story 3.8 implementation complete — all 8 tasks done, all tests passing
- 2026-02-06: Code review — fixed 8 issues (1 HIGH, 5 MEDIUM, 2 LOW): database.ts regenerated, offline visual prominence added, RTF memoized, tests rewritten, File List corrected

### File List

**New files:**
- `supabase/migrations/20260207000002_add_last_checked_at_to_systems.sql`
- `src/components/ui/badge.tsx`
- `src/components/patterns/StatusBadge.tsx`
- `src/components/patterns/StatusBadge.test.tsx`
- `src/components/patterns/RelativeTime.tsx`
- `src/components/patterns/RelativeTime.test.tsx`
- `src/lib/utils/relative-time.ts`
- `src/lib/utils/relative-time.test.ts`
- `tests/e2e/landing-page-status.spec.ts`

**Modified files:**
- `src/lib/validations/system.ts` — added `lastCheckedAt` to `systemSchema`
- `src/lib/validations/system.test.ts` — added 5 `systemSchema` tests
- `src/lib/systems/queries.ts` — added `last_checked_at` to `SYSTEM_SELECT_COLUMNS`
- `src/lib/systems/queries.test.ts` — added `last_checked_at` / `lastCheckedAt` to mock data
- `src/lib/systems/mutations.test.ts` — added `last_checked_at` / `lastCheckedAt` to mock data
- `src/lib/systems/queries.guardrails.test.ts` — added `last_checked_at` to mock data
- `src/components/patterns/SystemCard.tsx` — added StatusBadge + RelativeTime + `lastCheckedAt` prop
- `src/components/patterns/SystemCard.test.tsx` — rewritten with 22 tests (status indicators + a11y)
- `src/app/(public)/page.tsx` — pass `lastCheckedAt` prop to SystemCard
- `src/types/database.ts` — regenerated (includes `last_checked_at`)
- `src/app/api/systems/route.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/route.guardrails.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/[id]/route.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/[id]/toggle/route.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/[id]/toggle/route.guardrails.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/[id]/logo/route.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/[id]/logo/route.guardrails.test.ts` — added `lastCheckedAt` to mock
- `src/app/api/systems/reorder/route.test.ts` — added `lastCheckedAt` to mock
- `src/app/admin/systems/_components/AddSystemDialog.test.tsx` — added `lastCheckedAt` to mock
- `src/app/admin/systems/_components/DeleteSystemDialog.test.tsx` — added `lastCheckedAt` to mock
- `src/app/admin/systems/_components/EditSystemDialog.test.tsx` — added `lastCheckedAt` to mock
- `src/app/admin/systems/_components/SystemsList.test.tsx` — added `lastCheckedAt` to mock
- `src/lib/admin/mutations/systems.ts` — added `lastCheckedAt: null` to optimistic create
- `src/lib/admin/mutations/systems.test.tsx` — added `lastCheckedAt` to mock
- `tests/e2e/admin-delete-system.spec.ts` — ISR reload fix (scope note: unrelated to story 3.8, fixes flaky delete verification)
