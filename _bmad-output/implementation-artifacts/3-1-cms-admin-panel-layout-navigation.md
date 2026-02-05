# Story 3.1: CMS Admin Panel Layout & Navigation

Status: done

## Story

As an Admin,
I want a protected CMS admin panel with clear navigation,
So that I can access all management features from a single interface.

## Acceptance Criteria

1. **Given** I am authenticated as Admin or Super Admin **When** I navigate to the admin panel **Then** I see a sidebar navigation (`w-64`, 256px) with links to Systems, Content, Analytics, and Settings sections

2. **Given** I am authenticated **When** I view the admin panel **Then** I see a fixed header (`h-16`, 64px) showing the zyncdata logo (left), my name with a role badge, and a logout button (right)

3. **Given** I am not authenticated **When** I try to access `/admin` routes **Then** I am redirected to the login page (already enforced by proxy.ts + layout guard from Epic 2)

4. **Given** no systems exist yet **When** I view the Systems section **Then** I see an empty state with a clear "Add your first system" call-to-action

5. **Given** any operation is in progress **When** the system is processing **Then** a loading indicator appears within 200ms of operation start

## Prerequisites (BEFORE starting implementation)

1. **Update `src/lib/validations/system.ts`** — add missing fields to match the full database schema:
```typescript
import { z } from 'zod'

export const systemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  logoUrl: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  responseTime: z.number().int().nullable(),
  displayOrder: z.number().int(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type System = z.infer<typeof systemSchema>
```

2. **Install Sonner** (toast notifications):
```bash
npx shadcn@latest add sonner
```

3. **Verify bundle size** after install — run `npm run build` and confirm gzip JS < 350 KB.

## Tasks / Subtasks

- [x] Task 1: Create admin shell layout with sidebar + header (AC: #1, #2)
  - [x] 1.1 Create `src/app/admin/_components/AdminSidebar.tsx` — client component with nav links
  - [x] 1.2 Create `src/app/admin/_components/AdminHeader.tsx` — client component
  - [x] 1.3 Create `src/app/admin/_components/AdminShell.tsx` — client component composing layout
  - [x] 1.4 Update `src/app/admin/layout.tsx`
  - [x] 1.5 Responsive behavior

- [x] Task 2: Create admin Systems page with empty state (AC: #4)
  - [x] 2.1 Create `src/app/admin/systems/page.tsx` (Server Component)
  - [x] 2.2 Create `src/app/admin/systems/_components/SystemsEmptyState.tsx`
  - [x] 2.3 Create `src/app/admin/systems/_components/SystemsList.tsx` — client component
  - [x] 2.4 Wire up React Query `systemsQueryOptions` in `src/lib/admin/queries/systems.ts`

- [x] Task 3: Create shared CMS UI patterns (AC: #5)
  - [x] 3.1 Configure Sonner `<Toaster />` in admin layout (prerequisite install already done)
  - [x] 3.2 Create `src/components/patterns/LoadingSpinner.tsx`
  - [x] 3.3 Create `src/components/patterns/EmptyState.tsx` — reusable across Epic 3-7

- [x] Task 4: Create placeholder pages for future sections
  - [x] 4.1 Create `src/app/admin/content/page.tsx` — EmptyState with "Content management coming soon"
  - [x] 4.2 Create `src/app/admin/analytics/page.tsx` — EmptyState with "Analytics coming soon"
  - [x] 4.3 Create `src/app/admin/settings/page.tsx` — EmptyState with "Settings coming soon"

- [x] Task 5: Set up admin data layer foundation (AC: #4)
  - [x] 5.1 Create `src/lib/admin/queries/api-adapter.ts`
  - [x] 5.2 Create `src/lib/admin/queries/systems.ts`
  - [x] 5.3 Update `src/lib/systems/queries.ts` with `getSystems()` function
  - [x] 5.4 Create `src/app/api/systems/route.ts` — API route for React Query

- [x] Task 6: Create error boundary + loading for admin routes
  - [x] 6.1 Create `src/app/admin/error.tsx` — admin-specific error boundary (`'use client'`)
  - [x] 6.2 Create `src/app/admin/loading.tsx` — admin-level loading state using LoadingSpinner

- [x] Task 7: Create shared test utilities
  - [x] 7.1 Create `src/lib/test-utils.ts`

- [x] Task 8: Write tests (target: 80%+ coverage per vitest.config.ts)
  - [x] 8.1 Unit tests for AdminSidebar (12 tests)
  - [x] 8.2 Unit tests for AdminHeader (13 tests)
  - [x] 8.3 Unit tests for SystemsEmptyState (6 tests)
  - [x] 8.4 Unit tests for EmptyState, LoadingSpinner (10 + 11 tests)
  - [x] 8.5 Unit tests for `unwrapResponse()` (7 tests)
  - [x] 8.6 Unit tests for `systemsQueryOptions` (3 tests)
  - [x] 8.7 Unit tests for `getSystems()` query (5 tests)
  - [x] 8.8 Unit tests for `/api/systems` route (4 tests)
  - [x] 8.9 Integration test: admin layout renders sidebar + header with auth context (4 tests)
  - [x] 8.10 Accessibility tests (jest-axe) on ALL new components
  - [x] 8.11 E2E test: admin route redirects for unauthenticated users (4 tests)
  - [x] 8.12 E2E test placeholders for authenticated tests (skipped, requires auth fixture)
  - [x] 8.13 All tests pass: 512 tests across 61 files

## Dev Notes

### Existing Infrastructure (DO NOT recreate)

| File | Purpose | Action |
|------|---------|--------|
| `src/app/admin/layout.tsx` | `requireAuth('admin')` + QueryProvider | **Enhance** — add AdminShell + Toaster |
| `src/app/admin/page.tsx` | Placeholder admin page | **Replace** — redirect to `/admin/systems` |
| `src/components/patterns/LogoutButton.tsx` | Logout button (form action) | **Reuse** in AdminHeader |
| `src/components/providers/query-provider.tsx` | React Query (isServer singleton) | **Already in layout** |
| `src/lib/auth/guard.ts` | `requireAuth()` + `requireApiAuth()` + types | **Reuse** — import `AuthResult`, `Role` types |
| `src/lib/validations/system.ts` | Zod schema + `System` type | **Update** — add missing fields (see Prerequisites) |
| `src/components/ui/button.tsx` | shadcn/ui Button (min-h-11) | **Reuse** for all buttons |
| `src/components/ui/input.tsx` | shadcn/ui Input (min-h-11) | **Reuse** for search/filters |
| `src/components/layouts/Header.tsx` | Public header (DxT branding pattern) | **Reference** for logo gradient badge style |

### Database Schema Reference

```sql
-- systems table (migration 20260204000001 — already exists)
CREATE TABLE systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  status TEXT,              -- null until Epic 5 health checks
  response_time INTEGER,    -- null until Epic 5
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public reads enabled=true only; Admin/Super Admin has full CRUD
-- Indexes: idx_systems_enabled(enabled, display_order), idx_systems_display_order(display_order)
```

### Sidebar Navigation Structure

| Nav Item | Route | Icon (lucide-react) | Epic |
|----------|-------|---------------------|------|
| Systems | `/admin/systems` | `Monitor` | Epic 3 (this) |
| Content | `/admin/content` | `FileText` | Epic 4 |
| Analytics | `/admin/analytics` | `BarChart3` | Epic 5 |
| Settings | `/admin/settings` | `Settings` | Epic 6-7 |

### Layout Dimensions & Responsive Breakpoints

| Element | Desktop (>=1024px) | Tablet (768-1023px) | Mobile (<768px) |
|---------|-------------------|--------------------|-----------------|
| Header | Fixed, `h-16`, full width, `z-40` | Same | Same |
| Sidebar | Fixed, `w-64`, visible | Collapsed, toggle via hamburger, overlay | Hidden, hamburger drawer with backdrop |
| Content | `ml-64 pt-16` | `pt-16` (no margin, sidebar overlays) | `pt-16` |

### Security Considerations

- Auth enforced by `requireAuth('admin')` in layout — DO NOT add duplicate checks in pages
- API route `/api/systems` MUST use `requireApiAuth('admin')` — returns JSON errors, not redirects
- RLS policies: public sees `enabled=true` only; admin/super_admin has full CRUD
- User info from `requireAuth()` return (server-side) — do NOT call `supabase.auth.getUser()` again in client
- No sensitive data in client-side state — role/name are non-sensitive display values

### Performance Constraints

- Bundle limit: **350 KB** (gzip JS) — run `npm run build` after adding Sonner to verify
- Sonner adds ~5KB gzipped
- React Query ~15KB already included via QueryProvider
- All new route pages code-split automatically by Next.js
- AlertDialog deferred to Story 3.2 (no destructive actions in this story's scope)

### Explicitly Deferred (NOT in scope)

- **AlertDialog** — install in Story 3.2 when delete confirmation is needed
- **Keyboard shortcuts** (`Cmd+K`, `?`) — defer to future story, UX spec section 04-ux-patterns.md
- **Breadcrumbs** — defer to Story 3.2+ when sub-pages exist (e.g., `/admin/systems/[id]/edit`)
- **Command palette** — not MVP scope

### Previous Story Intelligence

**From Epic 2 Retrospective:**
- Automation > documentation: ESLint rules catch what docs miss
- 44px touch targets enforced in Button/Input defaults — no manual override needed
- `dark:` Tailwind classes banned (ESLint `local/no-dark-classes`)
- Security pre-review checklist: `_bmad-output/implementation-artifacts/security-pre-review-checklist.md`
- React Query patterns: `_bmad-output/implementation-artifacts/react-query-patterns.md`

**From Story 2.6 (Route Protection & RBAC):**
- `requireAuth('admin')` in layout = single entry point — all child pages protected
- User metadata (`app_metadata.role`) set during account creation, not user-editable
- MFA AAL2 enforcement handled in guard.ts — admin layout inherits this

### Project Structure (all new + modified files)

```
src/
├── app/admin/
│   ├── layout.tsx                  # MODIFY: add AdminShell + Toaster
│   ├── page.tsx                    # MODIFY: redirect to /admin/systems
│   ├── error.tsx                   # NEW: admin error boundary
│   ├── loading.tsx                 # NEW: admin loading state
│   ├── _components/
│   │   ├── AdminShell.tsx          # NEW: client — sidebar + header + content
│   │   ├── AdminSidebar.tsx        # NEW: client — nav links with active state
│   │   ├── AdminHeader.tsx         # NEW: client — logo + user info + logout
│   │   ├── AdminShell.test.tsx
│   │   ├── AdminSidebar.test.tsx
│   │   └── AdminHeader.test.tsx
│   ├── systems/
│   │   ├── page.tsx                # NEW: RSC — systems list with Suspense
│   │   └── _components/
│   │       ├── SystemsEmptyState.tsx
│   │       ├── SystemsList.tsx     # NEW: client — React Query list
│   │       ├── SystemsEmptyState.test.tsx
│   │       └── SystemsList.test.tsx
│   ├── content/
│   │   └── page.tsx                # NEW: placeholder
│   ├── analytics/
│   │   └── page.tsx                # NEW: placeholder
│   └── settings/
│       └── page.tsx                # NEW: placeholder
├── app/api/systems/
│   └── route.ts                    # NEW: GET — admin systems API
├── components/patterns/
│   ├── EmptyState.tsx              # NEW: reusable empty state
│   ├── EmptyState.test.tsx
│   ├── LoadingSpinner.tsx          # NEW: 200ms delayed spinner
│   └── LoadingSpinner.test.tsx
├── lib/
│   ├── admin/queries/
│   │   ├── api-adapter.ts          # NEW: unwrapResponse + ApiError
│   │   ├── api-adapter.test.ts
│   │   ├── systems.ts              # NEW: systemsQueryOptions
│   │   └── systems.test.ts
│   ├── systems/
│   │   ├── queries.ts              # NEW: server-side getSystems (snake→camel)
│   │   └── queries.test.ts
│   ├── validations/
│   │   └── system.ts               # MODIFY: add missing fields
│   └── test-utils.ts               # NEW: createTestQueryClient + createQueryWrapper
```

### Git Commit Conventions

```
feat(story-3.1): cms admin panel layout with sidebar navigation
test(story-3.1): add unit and E2E tests for admin layout components
fix(story-3.1): <description>  # for code review fixes
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3-Story-3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Fetching-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Admin-Panel-Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design/04-ux-patterns.md#Empty-States]
- [Source: _bmad-output/planning-artifacts/ux-design/04-ux-patterns.md#Loading-States]
- [Source: _bmad-output/planning-artifacts/ux-design/04-ux-patterns.md#Navigation-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design/05-responsive-accessibility.md#Breakpoints]
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md]
- [Source: _bmad-output/implementation-artifacts/security-pre-review-checklist.md]
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-02-05.md]
- [Source: _bmad-output/project-context.md]
- [Source: supabase/migrations/20260204000001_create_systems_table.sql]
- [Source: supabase/migrations/20260204000003_create_rls_policies.sql]
- [Source: src/lib/validations/system.ts]
- [Source: src/lib/auth/guard.ts]
- [Source: src/app/admin/layout.tsx]
- [Source: src/components/patterns/LogoutButton.tsx]
- [Source: src/components/layouts/Header.tsx]

## Dev Agent Record

### Agent Model Used
- Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Fixed Zod datetime validation (ISO datetime strict → permissive string)
- Updated existing getEnabledSystems/getSystemByName to include all schema fields
- Fixed test mocks to include aud, created_at fields for User type

### Completion Notes List
- All 8 tasks completed with comprehensive test coverage
- 512 tests across 61 files, all passing
- Lint and type-check clean
- Admin shell layout with responsive sidebar (desktop persistent, mobile/tablet hamburger toggle)
- Empty state pattern implemented for Systems, Content, Analytics, Settings pages
- React Query integration for client-side data fetching
- API route with auth guard for /api/systems
- Shared LoadingSpinner with 200ms delay and EmptyState pattern components
- Sonner toast notifications configured
- Prerequisites completed: system.ts schema updated, Sonner installed

### Code Review Fixes (2026-02-05)
- [M1] Deleted `supabase/temp-check-users.ts` — temp script not in scope, contains service role key
- [M2] Fixed React act() warnings in accessibility tests — wrapped axe assertions in act()
  - AdminSidebar.test.tsx
  - AdminHeader.test.tsx
  - AdminShell.test.tsx
  - SystemsEmptyState.test.tsx
  - EmptyState.test.tsx
  - UnauthorizedPage.test.tsx (bonus: from Epic 2)

### File List
**New Files:**
- src/app/admin/_components/AdminSidebar.tsx
- src/app/admin/_components/AdminSidebar.test.tsx
- src/app/admin/_components/AdminHeader.tsx
- src/app/admin/_components/AdminHeader.test.tsx
- src/app/admin/_components/AdminShell.tsx
- src/app/admin/_components/AdminShell.test.tsx
- src/app/admin/systems/page.tsx
- src/app/admin/systems/_components/SystemsEmptyState.tsx
- src/app/admin/systems/_components/SystemsEmptyState.test.tsx
- src/app/admin/systems/_components/SystemsList.tsx
- src/app/admin/systems/_components/SystemsList.test.tsx
- src/app/admin/content/page.tsx
- src/app/admin/analytics/page.tsx
- src/app/admin/settings/page.tsx
- src/app/admin/error.tsx
- src/app/admin/loading.tsx
- src/app/api/systems/route.ts
- src/app/api/systems/route.test.ts
- src/components/patterns/LoadingSpinner.tsx
- src/components/patterns/LoadingSpinner.test.tsx
- src/components/patterns/EmptyState.tsx
- src/components/patterns/EmptyState.test.tsx
- src/components/ui/sonner.tsx
- src/lib/admin/queries/api-adapter.ts
- src/lib/admin/queries/api-adapter.test.ts
- src/lib/admin/queries/systems.ts
- src/lib/admin/queries/systems.test.ts
- src/lib/test-utils.ts
- tests/e2e/admin-layout.spec.ts

**Modified Files:**
- src/app/admin/layout.tsx — added AdminShell + Toaster
- src/app/admin/page.tsx — redirect to /admin/systems
- src/app/admin/page.test.tsx — updated for redirect behavior
- src/app/admin/layout.test.tsx — added mocks for navigation, logout, new tests
- src/lib/validations/system.ts — added responseTime, enabled, createdAt, updatedAt
- src/lib/systems/queries.ts — added getSystems(), updated select columns
- src/lib/systems/queries.test.ts — added tests for getSystems()
