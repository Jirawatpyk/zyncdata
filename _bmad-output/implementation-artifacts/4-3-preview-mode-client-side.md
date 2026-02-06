# Story 4.3: Preview Mode (Client-Side)

Status: done

## Story

As an Admin,
I want to preview all my CMS changes before publishing,
So that I can verify changes look correct and avoid mistakes on the live site.

## Acceptance Criteria

1. **Given** I have unsaved or unpublished changes (content, theme, or systems)
   **When** I click "Preview"
   **Then** a client-side preview simulation renders the landing page with my pending changes
   **And** the preview is clearly labeled "PREVIEW - Not Published"

2. **Given** I am in preview mode
   **When** I view the preview
   **Then** I see the landing page exactly as it would appear to visitors with all my changes applied

3. **Given** I am in preview mode
   **When** I click "Preview on different devices"
   **Then** I can view the preview at mobile (375px), tablet (768px), and desktop (1280px) widths

4. **Given** I am satisfied with the preview
   **When** I click "Back to Editor"
   **Then** I return to the editing interface with my changes preserved

5. **Given** I am not satisfied with the preview
   **When** I return to the editor
   **Then** I can continue making changes and preview again

## Tasks / Subtasks

- [x] Task 1: Create preview data aggregation layer (AC: 1, 2)
  - [x] 1.1 Create `src/lib/admin/queries/preview.ts` with `usePreviewData()` hook
  - [x] 1.2 Aggregate all pending content + theme + branding from React Query cache
  - [x] 1.3 Merge pending changes with current published data to produce full preview state
- [x] Task 2: Create `PreviewFrame` component — iframe-based preview renderer (AC: 1, 2, 3)
  - [x] 2.1 Create `src/app/admin/preview/_components/PreviewFrame.tsx` (`'use client'`)
  - [x] 2.2 Render iframe with device-width controls (375px / 768px / 1280px)
  - [x] 2.3 Add "PREVIEW - Not Published" banner at top of preview
  - [x] 2.4 Add responsive device toolbar with active state indicators
- [x] Task 3: Create preview API route for iframe content (AC: 1, 2)
  - [x] 3.1 Create `src/app/api/preview/route.ts` (POST) — accepts full preview payload
  - [x] 3.2 Return SSR-rendered landing page HTML with preview data injected
  - [x] 3.3 Auth guard: admin role required
- [x] Task 4: Create `PreviewPage` admin route (AC: 1, 3, 4, 5)
  - [x] 4.1 Create `src/app/admin/preview/page.tsx` (Server Component wrapper)
  - [x] 4.2 Create `src/app/admin/preview/_components/PreviewManager.tsx` (`'use client'`)
  - [x] 4.3 Add "Back to Editor" navigation button
  - [x] 4.4 Add device-size toggle toolbar
- [x] Task 5: Add "Preview" button to Content and Branding pages (AC: 1)
  - [x] 5.1 Add Preview button to `ContentManager.tsx`
  - [x] 5.2 Add Preview button to `BrandingManager.tsx`
  - [x] 5.3 Navigate to `/admin/preview` passing current state via React Query cache
- [x] Task 6: Add admin sidebar nav item for Preview (AC: 4)
  - [x] 6.1 Update `AdminSidebar.tsx` with Preview nav link (Eye icon)
- [x] Task 7: Testing (~30-40 tests across 5-6 files) (AC: all)
  - [x] 7.1 Unit tests for `usePreviewData()` hook (4 tests)
  - [x] 7.2 Component tests for `PreviewFrame` (device sizes, banner, iframe attrs) (10 tests)
  - [x] 7.3 Component tests for `PreviewManager` (navigation, device toggle, back button) (8 tests)
  - [x] 7.4 API guardrail tests for `POST /api/preview` (auth, validation, response format) (7 tests)
  - [x] 7.5 Integration tests for Preview button on Content/Branding pages (3 tests)

## Dev Notes

### Critical Architecture Context

**Current State — LIVE-ONLY Architecture:**
The CMS currently has NO draft/published separation. All content updates via `PATCH /api/content/{section}` go directly to the `landing_page_content` table and `revalidatePath('/')` makes changes live immediately. The `metadata` JSONB column exists but is unused.

**Story 4-3 Approach — Client-Side Preview Simulation:**
This story creates a preview that shows how the landing page WOULD look with pending (in-editor) changes, WITHOUT saving to DB. The preview aggregates the current React Query cache state (which contains optimistic/edited data) and renders it in an isolated view.

**Story 4-4 (Next) — Publish Changes:**
Story 4-4 will add the draft/publish workflow. Story 4-3 does NOT need to modify the DB schema or add draft columns. Preview works purely with client-side state.

### Preview Strategy: iframe + POST API

**Why iframe (NOT inline rendering):**
- Landing page components (`Hero`, `PillarsSection`, `CategoryTabs`, `Footer`) are **Server Components** — they cannot be re-rendered on the client with different props
- An iframe with a POST endpoint allows SSR of the full landing page with preview data injected
- This isolates preview CSS/JS from the admin panel (no style conflicts)
- Device-width simulation via `iframe { width: 375px }` is accurate and simple

**POST /api/preview Flow:**
1. Admin clicks "Preview" on Content or Branding page
2. `PreviewManager` reads all pending data from React Query cache
3. POST request sends full preview payload to `/api/preview`
4. API route renders landing page HTML with preview data (not from DB)
5. Returns HTML → iframe displays it
6. Preview banner overlaid on top

**Alternative Considered:** `?preview=true` query param on landing page. Rejected because:
- Public landing page is RSC-only; passing preview data via URL/cookies is fragile
- Requires modifying public page components to check preview state
- Security risk: preview query param could leak draft content publicly

### PreviewPayload Type Definition

```typescript
// src/lib/admin/queries/preview.ts
interface PreviewPayload {
  hero: HeroContent           // { title, subtitle, description }
  pillars: PillarsContent     // { heading, items: [...] }
  footer: FooterContent       // { copyright, contactEmail, links: [...] } — camelCase from cache
  systems: SystemsContent     // { heading, subtitle } — read-only display heading
  theme: ThemeContent         // { colorScheme, font, logoUrl, faviconUrl }
}
// Note: Systems list (individual system cards) comes from DB — not editable in preview.
// Only the systems section heading/subtitle from landing_page_content is included.
// Soft-deleted systems (enabled: false) are already filtered by getEnabledSystemsByCategory().
```

### Data Aggregation Pattern

```typescript
// src/lib/admin/queries/preview.ts
export function usePreviewData(): PreviewPayload {
  // Read current cached content (includes optimistic updates from editing)
  const { data: content } = useSuspenseQuery(contentQueryOptions)

  // Build preview payload from cache state
  return {
    hero: content.hero,
    pillars: content.pillars,
    footer: content.footer,
    systems: content.systems,
    theme: content.theme,
  }
}
```

### Device Width Preview

Use a **Button group** (3 buttons with active state via `variant="default"` vs `variant="outline"`) — consistent with CategoryTabs active-state pattern from Story 4-B. Each button shows device icon (Smartphone, Tablet, Monitor from lucide-react) + label:
- **Mobile:** 375px width (Smartphone icon)
- **Tablet:** 768px width (Tablet icon)
- **Desktop:** 1280px width (Monitor icon) — default active

iframe container sets `width` and centers with `mx-auto`. The iframe content is the full landing page — scrollable within the iframe.

### State Preservation on Navigation

Preview state relies on React Query cache. When admin navigates "Back to Editor" → cache persists (SPA navigation). If admin refreshes the browser, cache resets to published data (acceptable for admin-only preview — edits are already saved to DB by the content/branding editors). No localStorage or URL-state persistence needed.

### Preview Banner

A fixed-position banner at the top of the iframe content (injected into the HTML response):
```html
<div style="position:fixed;top:0;left:0;right:0;z-index:9999;
  background:#f59e0b;color:#000;text-align:center;padding:8px;font-weight:bold;">
  PREVIEW - Not Published
</div>
```
Add `padding-top: 40px` to body so content isn't hidden behind banner.

### Project Structure Notes

New files follow existing admin conventions:
```
src/app/admin/preview/
├── page.tsx                          # Server Component (auth + metadata)
├── loading.tsx                       # Skeleton
└── _components/
    ├── PreviewManager.tsx            # 'use client' — orchestrates preview
    └── PreviewFrame.tsx              # 'use client' — iframe + device controls
src/lib/admin/queries/preview.ts      # usePreviewData() hook
src/app/api/preview/route.ts          # POST — render preview HTML
```

### Existing Files to Modify

- `src/app/admin/content/_components/ContentManager.tsx` — add Preview button
- `src/app/admin/branding/_components/BrandingManager.tsx` — add Preview button
- `src/app/admin/_components/AdminSidebar.tsx` — add Preview nav item

### Key Patterns from Previous Stories

**React Query (admin only):**
- Query key: `['admin', 'content']` for all content
- Use `useSuspenseQuery(contentQueryOptions)` to read cached data
- `useQueryClient()` for direct cache access if needed

**Admin page pattern (from 4-1, 4-2):**
```typescript
// page.tsx (Server Component)
export const metadata = { title: 'Preview | Admin' }
export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <PreviewManager />
    </Suspense>
  )
}
```

**Navigation pattern (from 4-2):**
- Button with `router.push('/admin/preview')` using `useRouter()` from `next/navigation`
- AdminSidebar uses `{href, icon, label}` array — add `{ href: '/admin/preview', icon: Eye, label: 'Preview' }`

**Auth guard on API routes (from 4-1):**
```typescript
const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, { status: 401 })
```

**API response wrapper (mandatory):**
```typescript
return NextResponse.json({ data: htmlString, error: null })
```

**No `dark:` Tailwind classes** — ESLint rule enforces this.
**All interactive elements min 44px** (`min-h-11`).
**No barrel files** — import directly from source.

### Theme/Branding Preview Integration

The preview must apply theme CSS variables. Use `getThemeCssVars()` and `getThemeFontVar()` from `src/lib/content/theme-provider.ts`:

```typescript
// In the preview API route, apply theme to rendered HTML
const cssVars = getThemeCssVars(previewData.theme.colorScheme)
const fontVar = getThemeFontVar(previewData.theme.font)
// Inject as <style> in the <head> of preview HTML
```

**Logo/Favicon in preview:** Use `previewData.theme.logoUrl` and `previewData.theme.faviconUrl` — these are already public URLs from the branding storage bucket. No special handling needed.

### CSS Variables Architecture (from Story 4-2)

Two-level indirection for runtime theme override:
```css
:root {
  --dxt-primary: #41b9d5;      /* Runtime override point */
}
@theme inline {
  --color-dxt-primary: var(--dxt-primary);  /* Tailwind references */
}
```

Preview injects `style="--dxt-primary: {value}"` on a wrapper div to override colors.

### Security Considerations

- `POST /api/preview` requires admin auth (same pattern as content API)
- Preview HTML is returned as a string, rendered in a sandboxed iframe
- iframe `sandbox` attribute: `sandbox="allow-same-origin allow-scripts"` to allow CSS/JS but prevent navigation
- No draft data persisted — preview is ephemeral (client-side only)
- XSS: preview content comes from admin's own edits (already sanitized by content API pipeline)

### Performance Considerations

- Preview HTML is server-rendered on demand — no caching needed (ephemeral)
- iframe content loads independently — doesn't block admin panel
- No bundle impact on public routes (preview is admin-only)
- Keep admin/preview route within 350 KB FLJ budget

### Footer snake_case Transform

Footer data from React Query cache is already **camelCase** (`contactEmail`, not `contact_email`). Pass directly to landing page RSC rendering components — no reverse transform needed. The landing page components (`Footer`) already expect camelCase props from `getLandingPageContent()` query layer.

### References

- [Source: epics.md — Epic 4, Story 4.3] Acceptance criteria and user story
- [Source: architecture.md — Section 3.2] Data fetching strategy, RSC patterns
- [Source: architecture.md — Section 4] File structure, naming conventions
- [Source: project-context.md] React Query restrictions, API response wrapper, testing standards
- [Source: 4-1-content-section-editor-with-wysiwyg.md] Content API patterns, React Query setup, sanitization
- [Source: 4-2-theme-branding-customization.md] Theme CSS vars, branding storage, font loading
- [Source: 4-A-landing-page-pillars-section.md] PillarsSection Server Component, fallback patterns
- [Source: 4-B-system-category-layers.md] CategoryTabs children pattern, category grouping

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| PreviewButton extracted as shared component | Reuse across Content/Branding pages instead of duplicating | +1 file (`PreviewButton.tsx`), zero behavior change |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

(none)

### Completion Notes List

- ✅ Task 1: `usePreviewData()` hook aggregates all 5 content sections (hero, pillars, footer, systems, theme) from React Query cache — 4 tests
- ✅ Task 2: `PreviewFrame` renders sandboxed iframe with device-width controls (375/768/1280px), "PREVIEW - Not Published" banner, active state indicators — 10 tests
- ✅ Task 3: `POST /api/preview` accepts full preview payload, validates with Zod, renders HTML with theme CSS vars, systems from DB, auth guard — 9 tests (incl. XSS + malformed JSON)
- ✅ Task 4: Preview page with `PreviewManager` orchestrating fetch → iframe display, "Back to Editor" nav, loading/error states — 8 tests
- ✅ Task 5: Preview button (shared `PreviewButton` component) added to ContentManager and BrandingManager — 3 tests
- ✅ Task 6: AdminSidebar updated with Preview nav item (Eye icon) between Branding and Analytics
- ✅ Task 7: Total 34 new tests across 5 test files — all passing (post-review: +2 security tests)

### Implementation Plan

1. **Preview data aggregation**: `usePreviewData()` reads from `useSuspenseQuery(contentQueryOptions)` cache — reflects optimistic updates from editing
2. **Preview rendering**: POST API route constructs full HTML with inline styles matching landing page structure, theme CSS vars, and preview banner
3. **iframe isolation**: `sandbox="allow-same-origin allow-scripts"` prevents navigation while allowing CSS/JS rendering
4. **Device preview**: Button group with Smartphone/Tablet/Monitor icons, default Desktop (1280px), sets iframe width
5. **Navigation**: `PreviewButton` is a `<Link>` to `/admin/preview`, "Back to Editor" uses `router.push('/admin/content')`
6. **HTML template approach**: Since landing page uses RSC + client components (FadeInOnScroll, CategoryTabs), API route renders static HTML with inline styles matching the visual structure — avoids complex React SSR in Route Handler

### Change Log

- 2026-02-06: Story 4-3 implementation complete — 7 tasks, 32 tests, all ACs satisfied
- 2026-02-06: Code review fixes — H1: memoize usePreviewData (useMemo), M1: remove unnecessary 'use client' from PreviewButton, M2+M5: +2 XSS/malformed-JSON tests, M4: document footer schema divergence, L1: move PreviewButton to admin/_components/, L2: aria-label on iframe container

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**New Files:**
- `src/lib/admin/queries/preview.ts` — usePreviewData() hook + PreviewPayload type
- `src/lib/admin/queries/preview.test.ts` — 4 unit tests for usePreviewData
- `src/app/admin/preview/page.tsx` — Server Component wrapper with Suspense
- `src/app/admin/preview/loading.tsx` — Loading skeleton
- `src/app/admin/preview/_components/PreviewFrame.tsx` — iframe + device controls
- `src/app/admin/preview/_components/PreviewFrame.test.tsx` — 10 component tests
- `src/app/admin/preview/_components/PreviewManager.tsx` — preview orchestrator
- `src/app/admin/preview/_components/PreviewManager.test.tsx` — 8 component tests
- `src/app/api/preview/route.ts` — POST endpoint for preview HTML
- `src/app/api/preview/route.test.ts` — 9 API guardrail tests (incl. XSS + malformed JSON)
- `src/app/admin/_components/PreviewButton.tsx` — shared Preview link button (moved from content/_components/ during review)
- `src/app/admin/_components/PreviewButton.test.tsx` — 3 button tests

**Modified Files:**
- `src/lib/admin/queries/preview.ts` — added useMemo to stabilize object reference (review fix H1)
- `src/app/admin/preview/_components/PreviewFrame.tsx` — added aria-label on iframe container (review fix L2)
- `src/app/api/preview/route.ts` — documented footer schema divergence (review fix M4)
- `src/app/admin/content/_components/ContentManager.tsx` — added PreviewButton import + render
- `src/app/admin/branding/_components/BrandingManager.tsx` — added PreviewButton import + render
- `src/app/admin/_components/AdminSidebar.tsx` — added Preview nav item with Eye icon
