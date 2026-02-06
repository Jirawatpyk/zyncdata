# Story 4-A: Landing Page Pillars Section (Replace About/Intro)

Status: review

## Story

As a visitor,
I want to see the four DxT business pillars (DxT Smart Platform, DxT Solutions, DxT AI & Data Management, DxT Game) on the landing page,
So that I can understand the full scope of DxT services and navigate to each pillar's website.

## Background

The current "About DxT AI" intro section is a simple heading + body paragraph. The PDF review (page 3) specifies replacing it with a 4-pillar card layout, each linking to an external website. Data should come from the `landing_page_content` database table so it remains CMS-editable in the future (Epic 4 stories).

## Acceptance Criteria

1. **Given** I am on the landing page **When** I scroll past the Hero **Then** I see a section with 4 pillar cards arranged in a responsive grid (1 col mobile, 2 col tablet, 4 col wide desktop ≥1280px)
2. **Given** I view a pillar card **When** I read its content **Then** I see a pillar name (title), a short description, and a "Visit" or "Learn More" link/button
3. **Given** I click a pillar's external link **When** the browser navigates **Then** it opens in a new tab (`target="_blank"` with `rel="noopener noreferrer"`)
4. **Given** the pillar data is stored in `landing_page_content` **When** the page loads **Then** the pillars section renders data from the `pillars` section in the database
5. **Given** I view the page on any device **When** I interact with pillar cards **Then** each card meets 44px minimum touch target and passes WCAG 2.1 AA contrast requirements
6. **Given** the intro section previously existed **When** this story is complete **Then** the `IntroSection` component is replaced by `PillarsSection` on the landing page, and the `intro` DB section is replaced by `pillars`
7. **Given** the landing page uses enterprise/premium design language **When** I view the Hero section **Then** decorative animations are minimal (no glow-pulse on CTA, no gradient-shift on background, max 2 floating orbs)

## Tasks / Subtasks

- [x] Task 1: Update database seed data — replace `intro` section with `pillars` (AC: #4, #6)
  - [x] 1.1 Update `supabase/seed.sql` — replace `intro` section_name with `pillars`
  - [x] 1.2 New JSONB content structure for `pillars` — updated with real content from PDF review page 3
  - [x] 1.3 Push seed to local Supabase — seed file updated (manual reset required for local DB)

- [x] Task 2: Update Zod validation schema (AC: #4)
  - [x] 2.1 Replace `introContentSchema` with `pillarsContentSchema` in `src/lib/validations/content.ts`
  - [x] 2.2 Schema shape: `pillarItemSchema` + `pillarsContentSchema` with `z.string().url().nullable()` for URL
  - [x] 2.3 Update `LandingPageContent` interface — replace `intro` with `pillars`
  - [x] 2.4 Update `getLandingPageContent()` in `src/lib/content/queries.ts` — parse `contentMap.pillars` instead of `contentMap.intro`
  - [x] 2.5 Add deploy-safe fallback: `PILLARS_FALLBACK` constant returns `{ heading: 'Our Pillars', items: [] }` when section missing

- [x] Task 3: Create PillarsSection component (AC: #1, #2, #3, #5)
  - [x] 3.1 Create `src/app/_components/PillarsSection.tsx` — Server Component
  - [x] 3.2 Responsive grid layout: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
  - [x] 3.3 Pillar card styling — minimal/enterprise design with left accent bar, hover bg change, Lucide icons
  - [x] 3.4 Map `icon` field to Lucide icons (Building2, Lightbulb, Brain, Gamepad2) with Building2 fallback
  - [x] 3.5 Use `FadeInOnScroll` animation wrapper per card (staggered delay 0/100/200/300ms)
  - [x] 3.6 Ensure min 44px touch target on links (`min-h-11`)
  - [x] 3.7 Section background: `bg-slate-50` with gradient divider line

- [x] Task 4: Tone down Hero animations for visual consistency (AC: #7, UX-approved)
  - [x] 4.1 Removed `motion-safe:animate-gradient-shift` from section — now static gradient
  - [x] 4.2 Removed `float-c` orb and radial spotlight — keeping only `float-a` + `float-b`
  - [x] 4.3 CTA button — removed `motion-safe:animate-glow-pulse`, kept hover shadow
  - [x] 4.4 All `fade-up` entrance animations, DxT brand styling, gradient text, typography unchanged
  - [x] 4.5 Hero.test.tsx — no assertions referenced removed classes, no changes needed

- [x] Task 5: Update landing page to use PillarsSection (AC: #1, #6)
  - [x] 5.1 Replace `<IntroSection>` with `<PillarsSection>` in `src/app/(public)/page.tsx`
  - [x] 5.2 Pass `pillars` content from `getLandingPageContent()` to `PillarsSection`
  - [x] 5.3 Keep `IntroSection` component file (not deleted — may be reused)

- [x] Task 6: Update tests (AC: #1-#6)
  - [x] 6.1 Create `src/app/_components/PillarsSection.test.tsx` — 10 unit tests (heading, cards, titles, links, null URL, empty items, section element, grid classes, touch targets)
  - [x] 6.2 Update `src/lib/content/queries.test.ts` — mock `pillars` section instead of `intro` + deploy-safe fallback test
  - [x] 6.3 Accessibility: min-h-11 touch target verified, axe audit deferred to E2E (no jsdom axe for Server Components)
  - [x] 6.4 IntroSection.test.tsx — kept unchanged (component not removed per 5.3)
  - [x] 6.5 Hero.test.tsx — no assertions referenced removed classes, no changes needed

- [ ] Task 7: Push seed data to cloud (AC: #4)
  - [ ] 7.1 Run `supabase db push` if any migration needed
  - [ ] 7.2 Create temp script to upsert `pillars` section and remove `intro` section on cloud

## Dev Notes

### Data Model

The `landing_page_content` table uses JSONB `content` column keyed by `section_name`. This story replaces:
- **Old:** `section_name = 'intro'` with `{ heading, body }`
- **New:** `section_name = 'pillars'` with `{ heading, items: [...] }`

### Deploy Order (IMPORTANT)

Code deploys before cloud data update → `contentMap.pillars` will be `undefined` briefly.
**Mitigation:** Fallback in `getLandingPageContent()` returns empty pillars if section not found.
**Recommended deploy sequence:**
1. Push cloud data first (upsert `pillars` + delete `intro`)
2. Deploy code
3. Remove fallback in a follow-up cleanup (optional — fallback is harmless)

### Icons Strategy

Use Lucide React icons mapped by string key. Keep the mapping simple — a switch/map in the component. Don't over-engineer an icon registry.

### Placeholder Data

URLs and descriptions are sample/placeholder data per user instruction. Real content will be filled in later. DxT Game has `url: null` (no website yet).

### Component Hierarchy

```
page.tsx
├── Hero
├── PillarsSection  ← NEW (replaces IntroSection)
│   └── PillarCard × 4
├── SystemGrid (Explore section)
└── Footer
```

### Estimated File Changes

| File | Action |
|------|--------|
| `supabase/seed.sql` | Edit — replace intro with pillars |
| `src/lib/validations/content.ts` | Edit — new schema |
| `src/lib/content/queries.ts` | Edit — parse pillars |
| `src/app/_components/PillarsSection.tsx` | **New** |
| `src/app/_components/Hero.tsx` | Edit — tone down animations (Task 4) |
| `src/app/(public)/page.tsx` | Edit — swap component |
| `src/app/_components/PillarsSection.test.tsx` | **New** |
| `src/app/_components/Hero.test.tsx` | Edit — update animation assertions |
| `src/lib/content/queries.test.ts` | Edit — update mock |
| `src/app/_components/IntroSection.test.tsx` | Delete or update |

## Dev Agent Record

### Implementation Plan

- Task 1-2: Replace `intro` DB section with `pillars` JSONB structure; add `pillarItemSchema`/`pillarsContentSchema` Zod validation; deploy-safe fallback (`PILLARS_FALLBACK` constant).
- Task 3: New `PillarsSection` Server Component with `PillarCard` sub-component. Lucide icon mapping via `ICON_MAP` record. Responsive grid (1→2→4 cols). FadeInOnScroll staggered animation.
- Task 4: Removed 3 Hero animations: gradient-shift, float-c orb + radial spotlight, glow-pulse on CTA. Kept 2 floating orbs + all fade-up animations.
- Task 5: Swapped `IntroSection` → `PillarsSection` in page.tsx. Kept IntroSection file for potential reuse.
- Task 6: 10 new PillarsSection tests + 1 fallback test in queries. Used `deepRender` helper to resolve non-hook function components in JSX tree traversal.

### Debug Log

- PillarsSection test failures (initial): JSX tree traversal couldn't see through `PillarCard` function component — `extractText`/`findAllByType` only recurse via `props.children`, but PillarCard receives named props. Fixed with `deepRender` helper that calls non-hook function components (catches FadeInOnScroll hook errors via try/catch).

### Completion Notes

- All 997 tests pass (85 files) — baseline was 986 tests, added 11 new
- TypeScript: 0 errors
- ESLint: 0 errors (8 pre-existing warnings)
- Bundle budget: Landing page 242.6 KB / 250 KB (unchanged — PillarsSection is Server Component)
- Seed data descriptions updated with real content from PDF review page 3

## File List

| File | Action |
|------|--------|
| `supabase/seed.sql` | Edit |
| `src/lib/validations/content.ts` | Edit |
| `src/lib/content/queries.ts` | Edit |
| `src/app/_components/PillarsSection.tsx` | New |
| `src/app/_components/PillarsSection.test.tsx` | New |
| `src/app/_components/Hero.tsx` | Edit |
| `src/app/(public)/page.tsx` | Edit |
| `src/lib/content/queries.test.ts` | Edit |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-06 | Story 4-A implementation: replaced IntroSection with PillarsSection (4 pillar cards), toned down Hero animations, updated Zod schemas and queries with deploy-safe fallback, 11 new tests |

## Scope Additions

| Change | Reason | Impact |
|--------|--------|--------|
| Seed data descriptions refined via Party Mode (Sophia's parallel-structure rewrite) | User approved concise, parallel-structure descriptions over raw PDF text for better card visual balance | No code impact — seed data only |
