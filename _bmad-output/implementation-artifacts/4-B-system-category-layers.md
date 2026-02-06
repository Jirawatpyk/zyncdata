# Story 4-B: System Category Layers (Grouped Systems Display)

Status: done

## Story

As a visitor,
I want to see systems organized into three business categories (DxT Smart Platform, DxT Solutions, DxT Game) on the landing page,
So that I can easily find and access systems relevant to each DxT business unit.

## Background

The current "Explore" systems section shows a flat grid of all enabled systems. The PDF review (page 4) specifies reorganizing into 3 category layers with distinct visual grouping. This requires a database migration to add a `category` column to the `systems` table, plus updating the landing page UI to render grouped sections.

## Acceptance Criteria

1. **Given** the `systems` table **When** this story is implemented **Then** each system has a `category` column (TEXT, nullable, defaults to NULL) that classifies it under a business unit
2. **Given** I am on the landing page **When** I scroll to the systems section **Then** I see a tab bar with 3 category tabs (DxT Smart Platform, DxT Solutions, DxT Game) and the active tab's systems displayed in a card grid
3. **Given** I click a category tab **When** the tab activates **Then** I see that category's system cards with a fade-in transition, and the tab shows as visually active (cyan underline + cyan text)
4. **Given** a category has no enabled systems **When** I view the systems section **Then** that category tab is hidden (not rendered)
5. **Given** the admin CMS **When** an admin adds/edits a system **Then** they can assign a category from a predefined list or leave it empty
6. **Given** systems exist without a category (NULL) **When** they are displayed **Then** they appear in an "Other" group at the bottom
7. **Given** I am on a mobile device **When** I view the systems section **Then** the layout is responsive (1 col mobile, 2 col tablet, 3 col desktop per category group)
8. **Given** I view the systems tabs on first load **When** no tab has been clicked **Then** the first tab (Smart Platform) is active by default
9. **Given** I view the tabs on mobile (< 640px) **When** the screen is narrow **Then** tab icons are hidden and only text labels are shown

## Tasks / Subtasks

- [x] Task 1: Database migration — add `category` column to `systems` table (AC: #1)
  - [x] 1.1 Create migration `20260208000001_add_category_to_systems.sql`
  - [x] 1.2 Add column: `ALTER TABLE systems ADD COLUMN category TEXT NULL;`
  - [x] 1.3 Add check constraint or comment documenting valid values: `'dxt_smart_platform'`, `'dxt_solutions'`, `'dxt_game'`
  - [x] 1.4 Regenerate database types (`npm run db:types`)

- [x] Task 2: Update seed data with categories and sample systems (AC: #1, #2)
  - [x] 2.1 Update `supabase/seed.sql` — add `category` to existing INSERT and expand with sample systems
  - [x] 2.2 Use ON CONFLICT to handle existing system names

- [x] Task 3: Update validation schemas and types (AC: #1, #5)
  - [x] 3.1 Add `category: z.string().nullable()` to `systemSchema` in `src/lib/validations/system.ts`
  - [x] 3.2 Add `category` to `SYSTEM_SELECT_COLUMNS` in `src/lib/systems/queries.ts`
  - [x] 3.3 Define category constants: `SYSTEM_CATEGORIES`, `SystemCategory`, `CATEGORY_LABELS`
  - [x] 3.4 Update `createSystemSchema` and `updateSystemSchema` — add `category: z.enum(SYSTEM_CATEGORIES).nullable().optional()`

- [x] Task 4: Update `getEnabledSystems()` query (AC: #2, #4, #6)
  - [x] 4.1 Add new function `getEnabledSystemsByCategory()` in `src/lib/systems/queries.ts`
  - [x] 4.2 Keep existing `getEnabledSystems()` unchanged (admin panel still uses flat list)

- [x] Task 5: Install shadcn Tabs + Create CategoryTabs component (AC: #2, #3, #4, #6, #7, #8, #9)
  - [x] 5.1 Install shadcn Tabs: `npx shadcn@latest add tabs`
  - [x] 5.2 Create `src/app/_components/CategoryTabs.tsx` — `'use client'` thin wrapper (tab logic only)
  - [x] 5.3 Tab bar styling — Underline Tabs with dxt-primary active state
  - [x] 5.4 Tab content uses hidden attribute for instant switching
  - [x] 5.5 Hide tabs with 0 systems (AC: #4) — empty tabs filtered in page.tsx
  - [x] 5.6 Tab order: `dxt_smart_platform` → `dxt_solutions` → `dxt_game` (+ `other` if exists)

- [x] Task 6: Update landing page to use CategoryTabs (AC: #2)
  - [x] 6.1 Replace inline `SystemGrid` in `src/app/(public)/page.tsx` with `CategoryTabs`
  - [x] 6.2 Call `getEnabledSystemsByCategory()` — group systems server-side
  - [x] 6.3 Keep section heading ("Explore") and subtitle from content DB
  - [x] 6.4 SystemCard remains Server Component — zero client JS for cards

- [x] Task 7: Update admin system forms + data layer (AC: #5)
  - [x] 7.1 Add category `<select>` dropdown to `AddSystemDialog`
  - [x] 7.2 Add category `<select>` dropdown to `EditSystemDialog`
  - [x] 7.3 Server mutations pass `category` through via Zod schema (toSnakeCase handles it)
  - [x] 7.4 Update `src/lib/admin/mutations/systems.ts` — include `category` in optimistic updates
  - [x] 7.5 API routes already pass body through to mutations — no changes needed

- [x] Task 7.6: Show category badge in SystemsList (AC: #5)
  - [x] 7.6.1 Import `CATEGORY_LABELS` and `SystemCategory` from validations
  - [x] 7.6.2 Render category badge inline next to system name (only when category is not null)
  - [x] 7.6.3 Use `CATEGORY_LABELS` for human-readable display, fallback to raw value
  - [x] 7.6.4 Add 3 unit tests: badge shown, badge hidden when null, correct labels for all categories

- [x] Task 8: Update tests (AC: #1-#7)
  - [x] 8.1 Update `src/lib/systems/queries.test.ts` — test `getEnabledSystemsByCategory()` grouping logic
  - [x] 8.2 Create `src/app/_components/CategoryTabs.test.tsx` — 7 unit tests
  - [x] 8.3 Update guardrail tests for category field (logo, toggle, systems route)
  - [x] 8.4 Update `src/lib/validations/system.test.ts` for `category` field (+13 tests)
  - [x] 8.5 Update mock factories with `category: null` default

- [x] Task 9: E2E tests (AC: #2, #3, #7)
  - [x] 9.1 Create `tests/e2e/landing-page-categories.spec.ts`
  - [x] 9.2 Test tab bar visible with category names
  - [x] 9.3 Test clicking tab switches displayed systems
  - [x] 9.4 Test pillars section visible (Story 4-A)

- [x] Task 10: Push to cloud (AC: #1, #2)
  - [x] 10.1 Run `supabase db push` for migration
  - [x] 10.2 Create temp script to upsert new systems with categories on cloud
  - [x] 10.3 Delete temp script after execution

## Dev Agent Record

### Implementation Plan

- Database-first approach: migration → seed → types → schema → queries → UI → admin → tests
- Used native `<select>` for admin category dropdown instead of installing shadcn Select (avoids unnecessary dependency)
- CategoryTabs uses custom ARIA tablist/tab/tabpanel pattern with `hidden` attribute (not shadcn Tabs primitive) for optimal server/client boundary: tab state is client-only, card grids are server-rendered children
- Used `toSnakeCase()` transform in mutations — no explicit `category` handling needed in `createSystem()`/`updateSystem()` since Zod schema includes it and the existing `toSnakeCase` pipeline handles it

### Debug Log

- `npm run db:types` failed because `supabase` CLI not on PATH — used `npx supabase gen types` directly
- First `supabase db reset` got 502 from storage bucket recreation — transient, retry succeeded
- `getEnabledSystemsByCategory()` tests initially failed with ZodError on non-UUID `id` values (`s1`, `s2`) — fixed to use proper UUIDs
- Fixed `dark:` classes in shadcn tabs.tsx (3 violations) — removed per project rule

### Completion Notes

- **1048 tests passing** across 89 test files (was 986 baseline → +62 new tests incl. 4-A)
- **Story-metrics:** 1091/1091 tests passed (331/332 suites)
- **CategoryTabs:** 14 unit tests (7 original + 7 from code review: keyboard nav, tabindex, fade-in)
- **Bundle budget:** Landing page 242.6 KB / 250 KB (within budget)
- **Type check:** Clean (0 story-related errors; 1 pre-existing error in HeroEditor.test.tsx)
- **Lint:** 0 errors, 9 warnings (all pre-existing)
- **Security checklist:** All applicable items checked (see below)
- All 9 ACs satisfied
- Cloud migration and seed data pushed successfully
- Code review: 7 issues found, all fixed (H1, M1-M3, L1-L3)

### Code Review Fixes Applied

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | Optimistic update can't clear category to null (`?? s.category`) | Changed to `!== undefined` guard in `mutations/systems.ts` |
| M1 | MEDIUM | No fade-in transition on tab switch (AC#3) | Added `animate-tab-fade-in` CSS animation + conditional render wrapper |
| M2 | MEDIUM | Unused `tabs.tsx` dead code | Deleted `src/components/ui/tabs.tsx` |
| M3 | MEDIUM | Missing ARIA keyboard nav (roving tabindex, arrow keys) | Added `tabIndex`, `onKeyDown` with ArrowLeft/Right/Home/End |
| L1 | LOW | File List claimed `database.ts` modified (not in git) | Corrected File List |
| L2 | LOW | `systemSchema.category` accepts any string | Documented as intentional (DB response can contain any value) |
| L3 | LOW | Mock factory `createMockSystemList` generates non-UUID IDs | Fixed to use valid UUID v4 format |

### Security Checklist Evaluation

1. **Input Validation:** ✅ Category validated with `z.enum(SYSTEM_CATEGORIES).nullable().optional()` in both create/update schemas. API routes parse body with Zod.
2. **Auth & RBAC:** N/A — No new auth-gated routes. Admin forms already protected.
3. **Open Redirects:** N/A — No redirects added.
4. **Error Handling:** ✅ `getEnabledSystemsByCategory()` throws on Supabase error (inherits from `getEnabledSystems()`). Mutations already have error handling.
5. **Race Conditions:** N/A — Read-only grouping function. Category updates are simple field updates.
6. **Data Exposure:** ✅ `SYSTEM_SELECT_COLUMNS` specifies explicit columns (category added). No sensitive data in category field.
7. **CSP & Headers:** N/A — No external resources added.
8. **Rate Limiting:** N/A — No new auth endpoints.

## File List

### New Files
| File | Description |
|------|-------------|
| `supabase/migrations/20260208000001_add_category_to_systems.sql` | Migration: add category column |
| `src/app/_components/CategoryTabs.tsx` | Client component: tab bar for category switching |
| `src/app/_components/CategoryTabs.test.tsx` | Unit tests for CategoryTabs (14 tests) |
| ~~`src/components/ui/tabs.tsx`~~ | ~~shadcn Tabs primitive~~ (removed in code review — unused dead code) |
| `tests/e2e/landing-page-categories.spec.ts` | E2E tests for category tabs |

### Modified Files
| File | Description |
|------|-------------|
| `supabase/seed.sql` | Updated with categories + 10 new sample systems |
| ~~`src/types/database.ts`~~ | ~~Regenerated~~ (not in git diff — types were already up-to-date) |
| `src/lib/validations/system.ts` | Added SYSTEM_CATEGORIES, CATEGORY_LABELS, category to schemas |
| `src/lib/systems/queries.ts` | Added category to SELECT columns + getEnabledSystemsByCategory() |
| `src/app/(public)/page.tsx` | Replaced SystemGrid with CategoryTabs using children pattern |
| `src/app/admin/systems/_components/AddSystemDialog.tsx` | Added category dropdown |
| `src/app/admin/systems/_components/SystemsList.tsx` | Added category badge next to system name |
| `src/app/admin/systems/_components/SystemsList.test.tsx` | Added 3 category badge tests |
| `src/app/admin/systems/_components/EditSystemDialog.tsx` | Added category dropdown |
| `src/lib/admin/mutations/systems.ts` | Added category to optimistic updates |
| `src/lib/test-utils/mock-factories.ts` | Added category: null to SYSTEM_DEFAULTS |
| `src/lib/systems/queries.test.ts` | Updated SELECT const, added category to mocks, added groupBy tests |
| `src/lib/systems/mutations.test.ts` | Added category to mock data |
| `src/lib/systems/queries.guardrails.test.ts` | Added category to mock data |
| `src/lib/validations/system.test.ts` | Added category tests (+13 tests) |
| `src/app/api/systems/[id]/logo/route.guardrails.test.ts` | Added category to mock data |
| `src/app/api/systems/[id]/toggle/route.guardrails.test.ts` | Added category to mock data |
| `src/app/api/systems/route.guardrails.test.ts` | Added category to mock data |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Status: in-progress → review |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-06 | Story implemented: DB migration, seed data, validation schemas, queries, CategoryTabs component, landing page update, admin forms, unit tests (34 new), E2E tests, cloud push | Dev Agent (Amelia) |
| 2026-02-06 | Code review: Fixed H1 optimistic update bug, M1 fade-in transition, M2 dead code removal, M3 keyboard a11y, L1/L3 doc+test fixes (+7 tests) | Code Review (Dev Agent) |
| 2026-02-06 | Task 7.6: Added category badge to admin SystemsList — shows CATEGORY_LABELS next to system name (+3 tests, 31 total in file) | Dev Agent (Amelia) |

## Scope Additions

| Change | Reason | Impact |
|--------|--------|--------|
| Used native `<select>` instead of shadcn Select | Avoid adding dependency for single dropdown | Minimal — same UX, one fewer package |
| Removed `dark:` classes from shadcn tabs.tsx | Project rule: no dark: classes | None — standard shadcn post-install fix |
| Updated 6 guardrail/test files with `category: null` | New field must be in all System mock objects | Tests pass — no logic change |

## Dev Notes

### Database Schema Change

```sql
-- Migration: 20260208000001_add_category_to_systems.sql
ALTER TABLE systems ADD COLUMN category TEXT NULL;

-- Optional: Add comment for documentation
COMMENT ON COLUMN systems.category IS 'Business unit: dxt_smart_platform, dxt_solutions, dxt_game';
```

No foreign key to a categories table — keep it simple with TEXT + constants. Can evolve to a lookup table if needed in the future.

### Grouping Strategy

Use manual `reduce()` to group systems by category — `Object.groupBy()` is ES2024 but our tsconfig targets ES2017 (`lib: ["esnext"]` doesn't guarantee runtime availability). Systems with `category = NULL` go to an "Other" bucket rendered last.

Category display order is hardcoded (not configurable): Smart Platform → Solutions → Game → Other. This aligns with the PDF review layout.

### Placeholder Data

All system names, URLs, and descriptions are sample/placeholder data. The user explicitly said real data will be filled in later. Use `coming_soon` status for most new systems since they don't have health checks yet.

### Impact on Admin CMS

The admin system forms need a category dropdown. Data flow:
- **UI:** `AddSystemDialog.tsx` / `EditSystemDialog.tsx` — add `<select>` field (native HTML)
- **Validation:** `createSystemSchema` / `updateSystemSchema` — add optional `category` field
- **Client mutation:** `src/lib/admin/mutations/systems.ts` — include `category` in optimistic updates
- **Server mutation:** `src/lib/systems/mutations.ts` — `createSystem()` / `updateSystem()` pass through to Supabase via `toSnakeCase()`
- **API routes:** `src/app/api/systems/route.ts` + `[id]/route.ts` — no changes needed (body is already spread to validation schema)

Note: there is NO `src/lib/actions/systems.ts` — admin uses API routes + React Query, NOT server actions.

### UI Pattern: Tabs (UX-approved)

Tabs Style chosen over Stacked Sections for:
- Compact layout — no long scroll
- Better mobile experience
- Clear category separation

Uses custom ARIA tab pattern with Lucide icons (Building2, Lightbulb, Gamepad2). Tab icons hidden on mobile via `hidden sm:inline`.

Bundle impact: CategoryTabs adds minimal client JS (tab state only). Landing page First Load JS: 242.6 KB (within 250 KB budget).

### Children Pattern — Server/Client Boundary (Architect-approved)

`CategoryTabs` is `'use client'` but uses the **children pattern**: tab logic only lives in the client component, while SystemCard grids are passed as `children` from the Server Component parent (`page.tsx`).

**Result:** CategoryTabs client JS ≈ minimal (tab state only). SystemCards render as pure server HTML — zero hydration cost.

```
page.tsx (Server Component)
├── Hero (Server)
├── PillarsSection (Server, Story 4-A)
├── Systems Section (heading from DB)
│   └── CategoryTabs ('use client' — thin wrapper, tab logic only)
│       └── children (passed from page.tsx — Server Components):
│           ├── Tab: "DxT Smart Platform" → grid of SystemCard × N (Server)
│           ├── Tab: "DxT Solutions" → grid of SystemCard × N (Server)
│           └── Tab: "DxT Game" → grid of SystemCard × N (Server)
└── Footer (Server)
```

### Dependencies

- **Story 4-A** should be done first (replaces IntroSection with PillarsSection). This story (4-B) is independent but the landing page layout makes more sense when both are applied together.
- Existing SystemCard component is reused as-is — no changes needed to the card itself.
