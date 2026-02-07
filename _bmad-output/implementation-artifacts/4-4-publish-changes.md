# Story 4.4: Publish Changes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to publish my CMS changes to make them live on the public landing page,
So that visitors see the updated content immediately.

## Background

The CMS currently operates in a **LIVE-ONLY architecture** — every content/theme save via `PATCH /api/content/{section}` calls `revalidatePath('/')` and goes live instantly. This story introduces a **draft/publish workflow** so admins can make multiple edits safely and only push changes to production when ready.

**Prerequisites completed:**
- Story 4-1 (done): Content Section Editor with WYSIWYG — hero, pillars, footer editing via ContentManager
- Story 4-2 (done): Theme & Branding Customization — color scheme, font, logo, favicon via BrandingManager
- Story 4-3 (done): Preview Mode — iframe-based preview with `POST /api/preview` and `usePreviewData()` hook
- Story 4-A/4-B (done): Landing page pillars section + system category layers

**FRs covered:** FR30 (preview before publish), FR31 (publish to make live), FR45 (confirmation dialog)

## Acceptance Criteria

1. **Given** I have pending changes in content, theme, or branding
   **When** I click "Publish"
   **Then** a confirmation dialog appears: "Are you sure you want to publish these changes? They will be live immediately."

2. **Given** I confirm the publish action
   **When** the publish operation executes
   **Then** all pending changes are applied to the production landing page
   **And** the publish completes within 3 seconds (NFR-P3a)
   **And** ISR cache is invalidated so visitors see updates immediately
   **And** I see a success message "Changes published successfully"

3. **Given** I cancel the publish dialog
   **When** the dialog closes
   **Then** no changes are published and my drafts remain intact

4. **Given** the publish operation fails
   **When** the error occurs
   **Then** I see a clear error message and my draft changes are preserved for retry

## Architecture Decision: Draft Content Column (Strategy B)

**Database schema change:** Add `draft_content JSONB DEFAULT NULL` column to `landing_page_content`.

```
Admin Edit → saves to draft_content column → NO revalidatePath → public page unchanged
Admin Publish → copies draft_content → content, nulls draft_content → revalidatePath('/') → public page updated
```

**Why this approach:**
- **Immune to external ISR leaks** — `revalidatePath('/')` is called by health mutations (every 5 min), systems mutations (7 places), and branding mutations (2 places). With Strategy B, these ISR busts are harmless because the public page reads the `content` column, which only changes on explicit publish.
- Simple draft detection: `WHERE draft_content IS NOT NULL` — no timestamp comparison needed
- Preview (Story 4-3) unaffected — reads from React Query cache, not ISR
- Clean separation: `content` = published (public), `draft_content` = work-in-progress (admin)

**Draft/Published state per row:**

| State | `content` column | `draft_content` column |
|-------|-----------------|----------------------|
| Published, no edits | Current live data | `NULL` |
| Has unpublished edits | Previous live data | New admin edits |
| After publish | Updated live data | `NULL` |

**Admin sees:** `COALESCE(draft_content, content)` — always the latest version.
**Public sees:** `content` — only changes when admin publishes.

## Tasks / Subtasks

- [x] Task 1: Database migration — add `draft_content` column (AC: all)
  - [x] 1.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_add_draft_content_column.sql`:
    ```sql
    ALTER TABLE landing_page_content ADD COLUMN draft_content JSONB DEFAULT NULL;
    ```
  - [x] 1.2 Run `npm run db:types` to regenerate Supabase types
  - [x] 1.3 Verify migration works with `npx supabase db reset` (local)

- [x] Task 2: Modify save flow — write to `draft_content` instead of `content` (AC: #3, #4)
  - [x] 2.1 Edit `src/lib/content/mutations.ts`:
    - Change `.update({ content, updated_by: userId })` → `.update({ draft_content: content, updated_by: userId })`
    - Remove `revalidatePath('/')` call (line 40) and the `import { revalidatePath }` (line 2)
    - Update JSDoc to reflect "saves to draft_content"
  - [x] 2.2 Edit `src/lib/admin/mutations/content.ts`:
    - Change `useUpdateSection()` success toast from `"Content updated"` → `"Draft saved"`
    - Add `queryClient.invalidateQueries({ queryKey: ['admin', 'publish-status'] })` in `onSettled`
  - [x] 2.3 Update `src/lib/content/mutations.test.ts`:
    - Change test that verifies `.update()` call to assert `{ draft_content: ..., updated_by: ... }` instead of `{ content: ..., updated_by: ... }`
    - Change "should call revalidatePath" test → "should NOT call revalidatePath" (assert not called)

- [x] Task 3: Update admin content query — show draft over published (AC: #1, #3)
  - [x] 3.1 Edit `src/app/api/content/route.ts` (GET handler):
    - Instead of calling `getLandingPageContent()`, query `landing_page_content` directly
    - For each row, use `draft_content ?? content` (coalesce) so admin always sees latest edits
    - Parse through same Zod schemas + fallbacks as `getLandingPageContent()`
  - [x] 3.2 `getLandingPageContent()` in `src/lib/content/queries.ts` — **NO CHANGES** (public always reads `content` column)

- [x] Task 4: Create publish server function (AC: #2, #4)
  - [x] 4.1 Create `src/lib/content/publish.ts`:
    - `publishAllContent(userId: string)` — for each row where `draft_content IS NOT NULL`: copy `draft_content → content`, set `draft_content = NULL`, then call `revalidatePath('/')`
    - `getPublishStatus()` — returns `{ hasDrafts: boolean, draftSections: string[], lastPublishedAt: string | null }`
    - `hasDrafts` = any row where `draft_content IS NOT NULL`
    - `draftSections` = list of `section_name` values with non-null `draft_content`
    - `lastPublishedAt` = for UX only (optional — can use `max(updated_at)` of published rows or omit)

- [x] Task 5: Create publish API endpoint (AC: #2, #4)
  - [x] 5.1 Create `src/app/api/content/publish/route.ts`:
    - **POST** handler: `requireApiAuth('admin')`, call `publishAllContent(auth.user.id)`, return `{ data: { publishedAt }, error: null }`
    - **GET** handler: `requireApiAuth('admin')`, call `getPublishStatus()`, return `{ data: { hasDrafts, draftSections }, error: null }`
  - [x] 5.2 Follow `{ data, error }` response wrapper pattern (mandatory)

- [x] Task 6: Create React Query hooks (AC: #2, #4)
  - [x] 6.1 Create `src/lib/admin/mutations/publish.ts`:
    - `usePublishChanges()` — `POST /api/content/publish`, on success: toast "Changes published successfully" + invalidate `['admin', 'publish-status']` + invalidate `['admin', 'content']`, on error: toast "Failed to publish changes"
    - `publishStatusQueryOptions` — `GET /api/content/publish`, query key `['admin', 'publish-status']`, staleTime 30_000, refetchOnWindowFocus true
  - [x] 6.2 **CRITICAL**: Use `e.preventDefault()` pattern for AlertDialogAction async confirm (see Dev Notes)

- [x] Task 7: Create PublishButton component (AC: #1, #2, #3)
  - [x] 7.1 Create `src/app/admin/_components/PublishButton.tsx` (`'use client'`):
    - Uses `useSuspenseQuery(publishStatusQueryOptions)` to get `hasDrafts`
    - "Publish Changes" button → opens shadcn `AlertDialog`
    - Confirmation text: "Are you sure you want to publish these changes? They will be live immediately."
    - Confirm calls `usePublishChanges().mutateAsync()` with `e.preventDefault()` on AlertDialogAction
    - Button disabled + "No unpublished changes" text when `hasDrafts === false`
    - Loading spinner during publish
    - Style: `variant="default"` (primary) to contrast with PreviewButton (`variant="outline"`)
    - Min 44px touch target (`min-h-11`)
  - [x] 7.2 Wrap PublishButton in `<Suspense fallback={...}>` at every render site (query may fail/suspend)

- [x] Task 8: Add PublishButton to Content + Branding pages (AC: #1)
  - [x] 8.1 Edit `src/app/admin/content/_components/ContentManager.tsx`:
    - Add `<Suspense><PublishButton /></Suspense>` next to existing `<PreviewButton />`
    - Button row: `<div className="mb-4 flex items-center gap-2 justify-end">`
  - [x] 8.2 Edit `src/app/admin/branding/_components/BrandingManager.tsx`:
    - Add `<Suspense><PublishButton /></Suspense>` next to existing `<PreviewButton />`
    - Adjust header row to include both buttons

- [x] Task 9: Add draft indicator badge (AC: #1)
  - [x] 9.1 Show amber "Unpublished changes" badge next to PublishButton when `hasDrafts === true`
  - [x] 9.2 Optionally show count or list of modified section names

- [x] Task 10: Testing (~25-35 tests across 4-5 files) (AC: all)
  - [x] 10.1 Create `src/app/api/content/publish/route.test.ts` — API guardrail tests (8-10 tests):
    - POST with valid auth → calls publishAllContent, returns publishedAt
    - POST without auth → 401
    - POST with non-admin role → 403
    - POST when no drafts → still succeeds (idempotent)
    - GET returns hasDrafts: true when draft_content exists
    - GET returns hasDrafts: false when no drafts
    - GET without auth → 401
    - Verify revalidatePath('/') called on POST success
  - [x] 10.2 Create `src/app/admin/_components/PublishButton.test.tsx` — component tests (8-10 tests):
    - Renders "Publish Changes" button
    - Button disabled when hasDrafts is false
    - Click opens confirmation dialog
    - Confirm triggers mutation
    - Cancel closes dialog without publishing
    - Loading state during publish
    - Success toast on publish
    - Error toast on failure
  - [x] 10.3 Create `src/lib/content/publish.test.ts` — unit tests (5-6 tests):
    - publishAllContent copies draft_content → content and nulls draft_content
    - publishAllContent calls revalidatePath('/')
    - publishAllContent skips rows where draft_content is NULL
    - getPublishStatus returns hasDrafts: true when draft_content exists
    - getPublishStatus returns hasDrafts: false when all draft_content is NULL
    - getPublishStatus returns correct draftSections list
  - [x] 10.4 Update `src/lib/content/mutations.test.ts`:
    - Change `.update()` assertion: `{ draft_content: ..., updated_by: ... }` instead of `{ content: ..., updated_by: ... }`
    - Change revalidatePath test: assert it is NOT called after save
  - [x] 10.5 Update `src/app/api/content/[section]/route.guardrails.test.ts`:
    - Verify PATCH still works (save goes to draft_content via mutations.ts)
  - [x] 10.6 Verify existing preview tests still pass (usePreviewData reads from React Query cache — unaffected)

- [x] Task 11: Verify pre-commit checks pass
  - [x] 11.1 Run `npm run type-check` — 0 errors
  - [x] 11.2 Run `npm run lint` — 0 errors
  - [x] 11.3 Run `npm run test` — all pass (including updated tests)
  - [x] 11.4 Run `npm run size` — all routes within budget
  - [x] 11.5 Run `npm run shadcn:verify` — all checks pass
  - [x] 11.6 Run `npm run story-metrics` — verify file list

## Dev Notes

### Architecture: Why Strategy B over Strategy C

**Strategy C (ISR-Gated — REJECTED)** removed `revalidatePath('/')` from content saves and relied on ISR staleness as the "draft" mechanism. This is fundamentally broken because:

1. `src/lib/health/mutations.ts:179` calls `revalidatePath('/')` on every health check (cron every 5 min)
2. `src/lib/systems/mutations.ts` calls `revalidatePath('/')` in 7 places (add/edit/delete/reorder/toggle)
3. `src/lib/content/branding-mutations.ts` calls `revalidatePath('/')` at lines 50 and 73

Any of these external revalidations would bust the ISR cache and inadvertently publish "draft" content, violating AC #3 ("drafts remain intact").

**Strategy B (Draft Content Column)** stores edits in a separate `draft_content` column. The public `content` column only changes on explicit publish. External `revalidatePath('/')` calls are harmless — they bust ISR but the public page re-renders with the same published `content`.

### Content Save Flow Change — CRITICAL

**Before (Stories 4-1, 4-2) — live-only:**
```
Admin Edit → PATCH /api/content/{section} → updateSectionContent() → writes content column → revalidatePath('/') → LIVE
```

**After (Story 4-4) — draft/publish:**
```
Admin Edit → PATCH /api/content/{section} → updateSectionContent() → writes draft_content column → NOT live
Admin Publish → POST /api/content/publish → publishAllContent() → copies draft_content → content → revalidatePath('/') → LIVE
```

### Server Function: `publishAllContent()`

```typescript
// src/lib/content/publish.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function publishAllContent(userId: string): Promise<{ publishedAt: string }> {
  const supabase = await createClient()

  // Get all rows that have unpublished drafts
  const { data: draftRows, error: fetchError } = await supabase
    .from('landing_page_content')
    .select('id, section_name, draft_content')
    .not('draft_content', 'is', null)

  if (fetchError) throw fetchError

  // Copy draft_content → content for each draft row
  for (const row of draftRows ?? []) {
    const { error: updateError } = await supabase
      .from('landing_page_content')
      .update({
        content: row.draft_content,
        draft_content: null,
        updated_by: userId,
      })
      .eq('id', row.id)

    if (updateError) throw updateError
  }

  // Bust ISR cache — public page re-renders with new content
  revalidatePath('/')

  return { publishedAt: new Date().toISOString() }
}
```

### Server Function: `getPublishStatus()`

```typescript
export async function getPublishStatus(): Promise<{
  hasDrafts: boolean
  draftSections: string[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('landing_page_content')
    .select('section_name, draft_content')
    .not('draft_content', 'is', null)

  if (error) throw error

  const draftSections = (data ?? []).map((r) => r.section_name)

  return {
    hasDrafts: draftSections.length > 0,
    draftSections,
  }
}
```

### Admin Content GET — Return Draft Over Published

The admin GET endpoint (`src/app/api/content/route.ts`) must return `draft_content ?? content` per row so the admin editor always shows the latest version:

```typescript
// src/app/api/content/route.ts — modified GET handler
export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('section_name, content, draft_content')

    if (error) throw error

    // For each row: use draft_content if it exists, otherwise content (published)
    const contentMap = Object.fromEntries(
      data.map((row) => [row.section_name, row.draft_content ?? row.content]),
    )

    // Parse with same Zod schemas + fallbacks as getLandingPageContent()
    const result = {
      hero: heroContentSchema.parse(contentMap.hero),
      pillars: contentMap.pillars ? pillarsContentSchema.parse(contentMap.pillars) : PILLARS_FALLBACK,
      systems: systemsContentSchema.parse(contentMap.systems),
      footer: footerContentSchema.parse(contentMap.footer),
      theme: contentMap.theme ? themeContentSchema.parse(contentMap.theme) : THEME_FALLBACK,
    }

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('[GET /api/content]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch content', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}
```

**Note:** This replaces the existing `getLandingPageContent()` call. The public query (`getLandingPageContent()`) stays unchanged — it only reads `content` column.

### `updateSectionContent()` — Modified

```typescript
// src/lib/content/mutations.ts — after modification
export async function updateSectionContent(
  sectionName: string,
  content: Record<string, unknown>,
  userId: string,
): Promise<ContentRow> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landing_page_content')
    .update({ draft_content: content, updated_by: userId })
    .eq('section_name', sectionName)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Section not found: ${sectionName}`)
    }
    throw error
  }

  // NO revalidatePath — edits stay as drafts until explicit publish
  return data as ContentRow
}
```

### Preview (Story 4-3) is UNAFFECTED

- Preview reads from React Query cache (not ISR-served page)
- `usePreviewData()` aggregates hero/pillars/footer/systems/theme from `['admin', 'content']` cache
- `POST /api/preview` renders HTML from posted data (not DB query)
- Since admin GET now returns `draft_content ?? content`, preview automatically shows drafts
- No changes needed to `usePreviewData()`, `PreviewFrame`, or `POST /api/preview`

### Public Query — NO CHANGES

`getLandingPageContent()` in `src/lib/content/queries.ts` reads `content` column only. Since `draft_content` is a separate column, drafts are invisible to the public. External `revalidatePath('/')` calls (health checks, systems mutations) are harmless — they re-render the page with the same published `content`.

### PublishButton AlertDialog — CRITICAL PATTERN

**MUST use `e.preventDefault()` on AlertDialogAction** to prevent auto-close during async mutation (documented gotcha from Epic 3):

```tsx
<AlertDialogAction
  onClick={async (e) => {
    e.preventDefault()  // Prevent auto-close before async completes
    try {
      await publishMutation.mutateAsync()
      // Dialog closes automatically after mutation settles via onOpenChange
    } catch {
      // Dialog stays open, error toast shown by mutation's onError
    }
  }}
  disabled={publishMutation.isPending}
>
  {publishMutation.isPending ? 'Publishing...' : 'Publish'}
</AlertDialogAction>
```

### Branding Asset Publishing — Scope Note

Logo/favicon files are uploaded directly to Supabase Storage `branding` bucket and become publicly accessible immediately (Storage URLs are direct, not ISR-cached). The URL reference is stored in the `theme` section. When admin changes theme via `useUpdateSection()`, the new URL goes to `draft_content`. When admin publishes, `draft_content` (with new URL) is copied to `content` and ISR refreshes. The `revalidatePath('/')` calls in `branding-mutations.ts` (lines 50, 73) remain unchanged — they're harmless under Strategy B.

### Out-of-Scope: Systems and Health Changes

System mutations (`src/lib/systems/mutations.ts`) and health check mutations (`src/lib/health/mutations.ts`) continue to go live immediately with their existing `revalidatePath('/')` calls. These are **not part of the CMS content draft workflow** — they manage operational data, not editorial content. This is by design: the systems list and health status on the landing page should always be live and accurate.

### Initial State (Fresh Deploy)

After migration, all existing rows have `draft_content = NULL`. This means:
- `hasDrafts = false` → PublishButton shows "No unpublished changes" (disabled)
- Admin editors show current published content (from `content` column)
- First admin edit creates a draft → `hasDrafts = true` → PublishButton enables
- This is correct behavior — no confusing "you have drafts" on first load

### Existing Files Reference

| File | Current Role | Change |
|------|-------------|--------|
| `src/lib/content/mutations.ts` | `updateSectionContent()` writes to `content` + `revalidatePath('/')` | Write to `draft_content` instead, remove `revalidatePath('/')` |
| `src/lib/content/mutations.test.ts` | Tests for `updateSectionContent()` | Update `.update()` assertion + revalidatePath not-called |
| `src/app/api/content/route.ts` | GET returns `getLandingPageContent()` | Return `draft_content ?? content` per row (inline query) |
| `src/app/api/content/[section]/route.ts` | PATCH handler for content saves | No change (calls mutations.ts which handles draft_content) |
| `src/lib/content/queries.ts` | `getLandingPageContent()` with React.cache() | **No change** (public reads `content` column only) |
| `src/lib/admin/mutations/content.ts` | `useUpdateSection()` with "Content updated" toast | Toast → "Draft saved" + invalidate `['admin', 'publish-status']` |
| `src/lib/admin/queries/content.ts` | `contentQueryOptions` → `fetch('/api/content')` | No change (API returns draft-aware data) |
| `src/lib/content/branding-mutations.ts` | `uploadBrandingAsset()` + `deleteBrandingAsset()` with `revalidatePath('/')` | **No change** (harmless under Strategy B) |
| `src/app/admin/content/_components/ContentManager.tsx` | Content editing page | Add `<Suspense><PublishButton /></Suspense>` |
| `src/app/admin/branding/_components/BrandingManager.tsx` | Branding editing page | Add `<Suspense><PublishButton /></Suspense>` |
| `src/app/admin/_components/PreviewButton.tsx` | Preview link button | **No change** (layout reference only) |

### Project Structure Notes

```
NEW files:
  supabase/migrations/YYYYMMDDHHMMSS_add_draft_content_column.sql  — ALTER TABLE
  src/lib/content/publish.ts                        — publishAllContent(), getPublishStatus()
  src/app/api/content/publish/route.ts              — POST (publish) + GET (draft status)
  src/lib/admin/mutations/publish.ts                — usePublishChanges(), publishStatusQueryOptions
  src/app/admin/_components/PublishButton.tsx        — AlertDialog-based publish button

NEW test files:
  src/app/api/content/publish/route.test.ts         — 8-10 API guardrail tests
  src/app/admin/_components/PublishButton.test.tsx   — 8-10 component tests
  src/lib/content/publish.test.ts                   — 5-6 unit tests

MODIFIED files:
  src/lib/content/mutations.ts                      — write draft_content, remove revalidatePath
  src/lib/content/mutations.test.ts                 — update assertions for draft_content
  src/app/api/content/route.ts                      — admin GET returns draft_content ?? content
  src/lib/admin/mutations/content.ts                — toast "Draft saved" + invalidate publish-status
  src/app/admin/content/_components/ContentManager.tsx   — add PublishButton
  src/app/admin/branding/_components/BrandingManager.tsx — add PublishButton
  _bmad-output/implementation-artifacts/sprint-status.yaml — story status update
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] Acceptance criteria (lines 1132-1158)
- [Source: _bmad-output/planning-artifacts/prd.md#FR30, FR31, FR45] Functional requirements
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P3a] Publish within 3 seconds
- [Source: _bmad-output/project-context.md] React Query patterns, API response wrapper
- [Source: src/lib/content/mutations.ts] updateSectionContent() — writes content + revalidatePath (lines 27, 40)
- [Source: src/lib/content/mutations.test.ts] Tests for updateSectionContent (line 53: content assertion, line 65: revalidatePath assertion)
- [Source: src/app/api/content/[section]/route.ts] PATCH handler (line 132 calls updateSectionContent)
- [Source: src/app/api/content/route.ts] Admin GET — currently calls getLandingPageContent() (line 10)
- [Source: src/lib/content/queries.ts] getLandingPageContent() with React.cache() — public query, unchanged
- [Source: src/lib/admin/queries/content.ts] contentQueryOptions → fetch('/api/content') (line 8)
- [Source: src/lib/admin/mutations/content.ts] useUpdateSection() with "Content updated" toast (line 47)
- [Source: src/lib/content/branding-mutations.ts] revalidatePath('/') at lines 50, 73 — stays unchanged
- [Source: src/lib/health/mutations.ts:179] revalidatePath('/') on health check — ISR leak source (harmless under Strategy B)
- [Source: src/lib/systems/mutations.ts] 7 revalidatePath('/') calls — ISR leak source (harmless under Strategy B)
- [Source: src/app/admin/_components/PreviewButton.tsx] Shared button pattern (variant="outline", size="sm")
- [Source: 4-3-preview-mode-client-side.md] Preview reads from React Query cache — unaffected by draft/publish
- [Source: 4-2-theme-branding-customization.md] Theme save patterns, BrandingManager layout
- [Source: 4-1-content-section-editor-with-wysiwyg.md] Content editor patterns, AlertDialog async pattern
- [Source: supabase/migrations/20260204000002_create_landing_page_content_table.sql] Current table schema

### Previous Story Intelligence

**From Story 4-3 (done):**
- Preview uses React Query cache — UNAFFECTED by draft/publish changes
- `usePreviewData()` reads from `['admin', 'content']` cache which now returns draft-aware data
- `PreviewButton` at `src/app/admin/_components/PreviewButton.tsx` — PublishButton goes alongside it
- Preview automatically shows drafts (admin GET returns `draft_content ?? content`)

**From Story 4-2 (done):**
- `useUpdateSection()` handles optimistic update + rollback + toast for 4 sections (hero, pillars, footer, theme)
- Toast says "Content updated" → change to "Draft saved"
- BrandingManager has header row with `justify-between` — add PublishButton alongside PreviewButton

**From Story 4-1 (done):**
- AlertDialog pattern from shadcn used for confirmation dialogs
- `e.preventDefault()` on AlertDialogAction for async operations (CRITICAL — prevents auto-close)
- ContentManager has `<div className="mb-4 flex justify-end">` — expand to include both buttons

**From Epic 3 (done):**
- AlertDialogAction auto-closes on click — `e.preventDefault()` is mandatory for async confirm

### Git Intelligence

Recent commit patterns:
- `feat(branding): implement theme and branding customization (story 4-2)`
- `feat(cms): implement content section editor with WYSIWYG (story 4-1)`
- Expected: `feat(cms): implement publish changes workflow (story 4-4)`

### Security Considerations

1. **Auth**: `requireApiAuth('admin')` on publish endpoint (POST + GET)
2. **No draft leakage**: Public page only reads `content` column — `draft_content` is invisible to unauthenticated users. Even if ISR is busted by health/systems mutations, the `content` column hasn't changed.
3. **Race conditions**: Multiple admins publishing is safe — each publish copies `draft_content → content` atomically per row. `revalidatePath('/')` is idempotent.
4. **No new user input**: Publish only copies existing validated data between columns — no new content processing needed.
5. **CSRF**: Standard API route auth + same-origin policy protects POST.

### Performance Notes

- Publish: N `UPDATE` queries (one per draft row, typically 1-4) + `revalidatePath('/')` = well within 3s NFR-P3a
- Draft status check: 1 DB query (`WHERE draft_content IS NOT NULL`) — lightweight
- No impact on public page performance (same ISR behavior, reads only `content` column)
- New `['admin', 'publish-status']` query has 30s staleTime — minimal overhead

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Fixed pre-existing test `content.test.tsx` that expected "Content updated" toast — updated to "Draft saved"
- Removed unused `createMockFooterContent` import from `route.guardrails.test.ts` (lint warning)
- Pre-existing flaky timeout in `preview/route.test.ts` when run in full suite (passes in isolation)

### Completion Notes List

- **Task 1**: Created migration `20260207000001_add_draft_content_column.sql` — adds `draft_content JSONB DEFAULT NULL` to `landing_page_content`
- **Task 2**: Modified `updateSectionContent()` to write `draft_content` instead of `content`, removed `revalidatePath('/')` call. Toast changed from "Content updated" to "Draft saved". Added `['admin', 'publish-status']` invalidation to `onSettled`.
- **Task 3**: Rewrote admin GET `/api/content` to query `draft_content ?? content` per row (inline Supabase query replacing `getLandingPageContent()` call). Public query unchanged.
- **Task 4**: Created `publishAllContent()` and `getPublishStatus()` in `src/lib/content/publish.ts`.
- **Task 5**: Created `POST + GET /api/content/publish` with `requireApiAuth('admin')`.
- **Task 6**: Created `usePublishChanges()` mutation and `publishStatusQueryOptions` query options.
- **Task 7**: Created `PublishButton` with AlertDialog, `e.preventDefault()` async confirm pattern, disabled state, loading spinner, amber "Unpublished changes" badge, min-h-11 touch target.
- **Task 8**: Added `<Suspense><PublishButton /></Suspense>` to ContentManager and BrandingManager.
- **Task 9**: Draft indicator badge integrated into PublishButton component.
- **Task 10**: 53 tests across 6 test files (12 API, 12 component, 9 unit, 11 guardrails, 5 mutations). Post-CR: +2 component tests (error retry, success close).
- **Task 11**: type-check 0 errors, lint 0 errors, all tests pass (1309/1309 + 1 pre-existing flaky timeout), bundle within budget, shadcn verified.

### Change Log

- 2026-02-07: Implemented draft/publish workflow (Strategy B) — all 11 tasks complete. 46 new/updated tests.
- 2026-02-07: Code Review fixes — M1: documented atomicity trade-off, M2: fixed migration filename in File List, M3: guard revalidatePath when no drafts, M4: controlled dialog open/close state, L1: corrected test count, L3: added error retry + success close tests (+2 tests).

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**NEW files:**
- `supabase/migrations/20260211000002_add_draft_content_column.sql`
- `src/lib/content/publish.ts`
- `src/lib/content/publish.test.ts`
- `src/app/api/content/publish/route.ts`
- `src/app/api/content/publish/route.test.ts`
- `src/lib/admin/mutations/publish.ts`
- `src/app/admin/_components/PublishButton.tsx`
- `src/app/admin/_components/PublishButton.test.tsx`

**MODIFIED files:**
- `src/lib/content/mutations.ts` — write `draft_content`, remove `revalidatePath`
- `src/lib/content/mutations.test.ts` — updated assertions for `draft_content`, revalidatePath not called
- `src/app/api/content/route.ts` — admin GET returns `draft_content ?? content` per row
- `src/app/api/content/route.guardrails.test.ts` — rewritten for draft-aware Supabase mock
- `src/lib/admin/mutations/content.ts` — toast "Draft saved" + invalidate `['admin', 'publish-status']`
- `src/lib/admin/mutations/content.test.tsx` — toast assertion updated to "Draft saved"
- `src/app/admin/content/_components/ContentManager.tsx` — added PublishButton
- `src/app/admin/branding/_components/BrandingManager.tsx` — added PublishButton
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status update
