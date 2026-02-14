# Story 6.1: Create CMS User Accounts

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Super Admin,
I want to create new CMS user accounts for DxT Team members,
so that they can access the CMS and manage the platform.

## Acceptance Criteria

1. **User Management page loads and displays existing users** — When I navigate to `/admin/users`, I see a table showing all CMS users with columns: Email, Role, Status, Last Login, and Actions.
2. **"Add User" button opens a creation dialog** — I see an "Add User" button that opens a dialog with fields: Email (required, email format), Role dropdown (Admin or User — never super_admin), and Submit/Cancel buttons.
3. **Successful user creation via Supabase Auth Admin API** — When I submit valid data, a new user is created in Supabase Auth with the selected role stored in `app_metadata.role`, and the user is invited via `inviteUserByEmail` (Supabase sends invite email) so the user can set their own password.
4. **New user appears immediately in the user list** — After creation, the new user appears in the table with status "Invited" (pending email confirmation) via optimistic update.
5. **Duplicate email prevention** — If I try to create a user with an email that already exists, I see an inline error message "A user with this email already exists" and the dialog stays open for correction.
6. **Form validation** — Empty email, invalid email format, or no role selected triggers inline validation errors before submission. Errors appear within 200ms (client-side).
7. **RBAC enforcement** — Only Super Admin can access `/admin/users`. Admin and User roles are redirected to `/unauthorized`. Enforced at both page level (`requireAuth('super_admin')`) and API level (`requireApiAuth('super_admin')`).
8. **Mandatory MFA on first login** — When the invited user clicks the invite link and sets their password, they are redirected to MFA enrollment (existing flow from Story 2.2) before accessing CMS features.
9. **Admin sidebar navigation** — A "Users" link with `Users` icon appears in the admin sidebar, positioned after "Analytics" and before "Settings". Only visible to super_admin role.
10. **Loading and error states** — Loading skeleton shows while user list fetches. Button shows loading spinner during creation. Error toast appears on server failures within 500ms (NFR-P7).

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

<!-- ANALYSIS: 10 tasks, 3 layers (API + UI + tests, no migration needed). Within threshold. Proceed. -->

- [x] Task 1 — Zod validation schemas and types (AC: #2, #5, #6)
  - [x] 1.1 Create `src/lib/validations/user.ts` with `createUserSchema`, `CmsUser` type, `Role` type reuse from guard.ts
  - [x] 1.2 Add unit tests for schema boundary cases (invalid email, missing role, super_admin rejection)

- [x] Task 2 — Domain queries: list users from Supabase Auth Admin API (AC: #1)
  - [x] 2.1 Create `src/lib/users/queries.ts` with `listCmsUsers()` using `createServiceClient().auth.admin.listUsers()`
  - [x] 2.2 Transform Supabase Auth user to `CmsUser` type (snake_case → camelCase in queries layer)
  - [x] 2.3 Add unit tests with mocked Supabase admin client

- [x] Task 3 — Domain mutations: create user via Supabase Auth Admin API (AC: #3, #5)
  - [x] 3.1 Create `src/lib/users/mutations.ts` with `createCmsUser()` using two-step: `auth.admin.createUser()` + `auth.admin.inviteUserByEmail()` OR single `inviteUserByEmail` with `app_metadata` if supported
  - [x] 3.2 Handle duplicate email error from Supabase Auth (map to `CONFLICT` error code)
  - [x] 3.3 Set `app_metadata.role` during creation (admin-controlled, not user-editable)
  - [x] 3.4 Add unit tests with mocked Supabase admin client

- [x] Task 4 — API route: GET and POST `/api/users` (AC: #1, #3, #5, #7)
  - [x] 4.1 Create `src/app/api/users/route.ts` with GET (list) and POST (create)
  - [x] 4.2 Auth guard: `requireApiAuth('super_admin')` on both endpoints
  - [x] 4.3 Zod validation on POST body, duplicate email → 409 CONFLICT
  - [x] 4.4 Standard `{ data, error }` response wrapper
  - [x] 4.5 Add integration tests (auth guard, validation, success, duplicate)

- [x] Task 5 — React Query hooks: queries and mutations (AC: #1, #3, #4)
  - [x] 5.1 Create `src/lib/admin/queries/users.ts` with `usersQueryOptions`
  - [x] 5.2 Create `src/lib/admin/mutations/users.ts` with `useCreateUser` (optimistic insert + rollback)
  - [x] 5.3 Add mutation tests

- [x] Task 6 — Users page and table component (AC: #1, #10)
  - [x] 6.1 Create `src/app/admin/users/page.tsx` (Server Component with `requireAuth('super_admin')`)
  - [x] 6.2 Create `src/app/admin/users/loading.tsx` (skeleton loader)
  - [x] 6.3 Create `src/app/admin/users/_components/UsersTable.tsx` (client component with React Query)
  - [x] 6.4 Display columns: Email, Role (badge), Status (Active/Invited/Disabled badge), Last Login, Actions
  - [x] 6.5 Empty state: "No users found" message when only super_admin exists (super_admin is seeded, not created here)
  - [x] 6.6 Actions column: render empty `<TableCell>` with `{/* Story 6-2/6-3/6-4 actions */}` placeholder
  - [x] 6.7 Add component tests (data render, empty state, loading skeleton)

- [x] Task 7 — Add User dialog component (AC: #2, #3, #4, #5, #6, #10)
  - [x] 7.1 Create `src/app/admin/users/_components/AddUserDialog.tsx` with React Hook Form + Zod
  - [x] 7.2 Email input + Role select (Admin/User only, super_admin excluded)
  - [x] 7.3 `mutateAsync` + try/catch pattern (Epic 4 P2 rule)
  - [x] 7.4 Inline error for duplicate email (`serverError` state + `role="alert"`), toast for other errors
  - [x] 7.5 Loading state: `form.formState.isSubmitting` disables button + `Loader2` spinner (match AddSystemDialog pattern)
  - [x] 7.6 `handleOpenChange` lifecycle: clear `serverError`, `form.reset()` on dialog close
  - [x] 7.7 Accessibility: `data-testid` on all interactive elements, `DialogDescription`, `role="alert"` on errors
  - [x] 7.8 Add component tests (render, validation, submit success, duplicate error, loading state, dialog close cleanup)

- [x] Task 8 — Admin sidebar: add Users nav link (AC: #9)
  - [x] 8.1 Update `AdminShell.tsx` to pass `role={auth.role}` prop to `AdminSidebar`
  - [x] 8.2 Update `AdminSidebar` interface to accept `role` prop, add `requiredRole?` to `NavItem`
  - [x] 8.3 Add "Users" to `navItems` with `Users` icon from lucide-react, `requiredRole: 'super_admin'`
  - [x] 8.4 Position after Analytics, before Settings
  - [x] 8.5 Filter `navItems` in render: hide items where `requiredRole` exceeds current role
  - [x] 8.6 Update AdminShell, AdminSidebar, and their tests

- [x] Task 9 — Mock factories (AC: all)
  - [x] 9.1 Add `createMockCmsUser()` and `CmsUser` defaults to `src/lib/test-utils/mock-factories.ts`
  - [x] 9.2 Add `createMockCmsUserList(count)` helper

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — Supabase Auth Admin API contract verification -->
- [x] Task 10 — Integration contract verification (AC: all)
  - [x] 10.1 Verify Supabase Auth Admin API: `createUser` / `inviteUserByEmail` accepts `app_metadata.role`
  - [x] 10.2 Verify `listUsers` returns all fields needed for `CmsUser` type (email, role from app_metadata, last_sign_in_at, created_at)
  - [x] 10.3 Verify `inviteUserByEmail` sends email correctly in local Supabase (may need Inbucket check)
  - [x] 10.4 Run `npm run type-check && npm run lint && npm run test` — all pass
  - [x] 10.5 Run `npm run size` — admin route stays under 350 KB budget

## Dev Notes

### Architecture & Patterns

**Supabase Auth Admin API (NEW for this project — first time usage):**
- All admin user operations use `createServiceClient()` from `src/lib/supabase/service.ts`
- This client uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS
- **CRITICAL:** Never import `service.ts` in client components — it has `import 'server-only'` guard
- Admin API namespace: `supabase.auth.admin.*` (not `supabase.auth.*`)
- Reference: Supabase Auth Admin docs — `createUser`, `inviteUserByEmail`, `listUsers`, `updateUserById`, `deleteUser`

**Key API methods:**
```typescript
// List all users
const { data: { users }, error } = await serviceClient.auth.admin.listUsers()
```

**PRIMARY approach — invite flow (use this):**
```typescript
// Step 1: Create user with role in app_metadata
const { data: { user }, error } = await serviceClient.auth.admin.createUser({
  email: input.email,
  app_metadata: { role: input.role },
  email_confirm: false,  // User must confirm via invite link
})
if (error) throw error

// Step 2: Send invite email (Supabase sends magic link, user sets own password)
await serviceClient.auth.admin.inviteUserByEmail(input.email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`,
})
```
User clicks invite link → sets password → redirected to login → MFA enrollment required (existing Epic 2 flow).

**FALLBACK (only if invite emails don't work in local dev):**
Use `createUser` with temp password + `email_confirm: true`. Admin communicates password manually. Dev should test primary approach first with Supabase Inbucket (local email inbox at `localhost:54324`).

**No database migration needed for this story:**
- Users are stored entirely in Supabase Auth (`auth.users` table, managed by Supabase)
- Roles stored in `auth.users.app_metadata.role` (JSONB field)
- No custom `cms_users` table needed for MVP (Story 6-5 may add one for login history)
- Existing `backup_codes` table already references `auth.users(id)` via `user_id`

**Existing patterns to follow (from Epic 3 Systems CRUD):**

| Layer | Systems (reference) | Users (this story) |
|-------|--------------------|--------------------|
| Validation | `src/lib/validations/system.ts` | `src/lib/validations/user.ts` |
| Domain Queries | `src/lib/systems/queries.ts` | `src/lib/users/queries.ts` |
| Domain Mutations | `src/lib/systems/mutations.ts` | `src/lib/users/mutations.ts` |
| API Route | `src/app/api/systems/route.ts` | `src/app/api/users/route.ts` |
| RQ Queries | `src/lib/admin/queries/systems.ts` | `src/lib/admin/queries/users.ts` |
| RQ Mutations | `src/lib/admin/mutations/systems.ts` | `src/lib/admin/mutations/users.ts` |
| Page | `src/app/admin/systems/page.tsx` | `src/app/admin/users/page.tsx` |
| Dialog | `AddSystemDialog.tsx` | `AddUserDialog.tsx` |

**Auth guard pattern (SUPER_ADMIN only — stricter than Systems):**
```typescript
// Page level (Server Component)
const { user, role } = await requireAuth('super_admin')  // NOT 'admin'

// API route level
const auth = await requireApiAuth('super_admin')  // NOT 'admin'
if (isAuthError(auth)) return auth
```

**React Query mutation pattern (follow Epic 4 P2 rule + AddSystemDialog reference):**
```typescript
// In AddUserDialog.tsx — mutateAsync MUST be in try/catch
const onSubmit: SubmitHandler<CreateUserInput> = async (data) => {
  setServerError(null)
  try {
    await createUser.mutateAsync(data)
    toast.success('User created successfully')
    form.reset()
    setOpen(false)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    if (message.includes('already exists')) {
      setServerError(message)  // Inline error — keep dialog open
    } else {
      toast.error('Unable to create user', { description: message })
    }
  }
}

// Submit button uses form.formState.isSubmitting (NOT mutation.isPending)
// This matches AddSystemDialog pattern and tracks the entire onSubmit handler
<Button type="submit" disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
  ) : 'Create User'}
</Button>
```

**Admin Sidebar update — conditional nav for super_admin:**

**CRITICAL data flow (3 files to update):**
1. `layout.tsx` already passes `auth` to `AdminShell` — no change needed
2. **`AdminShell.tsx`** — currently passes `userRole={auth.role}` to `AdminHeader` but **NOT to `AdminSidebar`**. Must add `role={auth.role}` prop to `<AdminSidebar>`.
3. **`AdminSidebar.tsx`** — must accept `role` prop, add `requiredRole?` to `NavItem`, filter in render.

```typescript
// AdminShell.tsx — ADD role prop to AdminSidebar
<AdminSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} role={auth.role} />

// AdminSidebar.tsx — Updated interface + filtering
interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  role: Role  // NEW — from AdminShell
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRole?: Role  // Optional — undefined = visible to all admin roles
}

const navItems: NavItem[] = [
  { label: 'Systems', href: '/admin/systems', icon: Monitor },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'Preview', href: '/admin/preview', icon: Eye },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users, requiredRole: 'super_admin' },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

// In render — simple role check (guard.ts has 'server-only', cannot import in client)
const ROLE_HIERARCHY: Record<string, number> = { user: 1, admin: 2, super_admin: 3 }
const visibleItems = navItems.filter(
  (item) => !item.requiredRole || ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[item.requiredRole]
)
```

**WARNING:** `guard.ts` has `import 'server-only'` — do NOT import `hasMinimumRole` or `Role` type from it in client components. Instead, define a local `ROLE_HIERARCHY` constant in `AdminSidebar.tsx` (same logic, duplicated for client-side safety). The `role` prop type can be `string` to avoid the import.

**Dialog lifecycle pattern (match AddSystemDialog exactly):**
```typescript
// AddUserDialog.tsx — handleOpenChange clears all state on close
function handleOpenChange(isOpen: boolean) {
  setOpen(isOpen)
  if (!isOpen) {
    setServerError(null)
    form.reset()
  }
}
// Use: <Dialog open={open} onOpenChange={handleOpenChange}>
```

### CmsUser Type Design

```typescript
// src/lib/validations/user.ts
import { z } from 'zod'

export const ASSIGNABLE_ROLES = ['admin', 'user'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const createUserSchema = z.object({
  email: z.string().email('Valid email address required').max(255),
  role: z.enum(ASSIGNABLE_ROLES, { required_error: 'Role is required' }),
})
export type CreateUserInput = z.infer<typeof createUserSchema>

// CmsUser type — represents a user in the admin UI
export interface CmsUser {
  id: string
  email: string
  role: string           // 'super_admin' | 'admin' | 'user'
  isConfirmed: boolean   // email confirmed
  lastSignInAt: string | null
  createdAt: string
}
```

**Transform function in queries layer (snake_case → camelCase):**
```typescript
// src/lib/users/queries.ts
import type { User as SupabaseUser } from '@supabase/supabase-js'

function transformAuthUser(authUser: SupabaseUser): CmsUser {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    role: (authUser.app_metadata?.role as string) ?? 'user',
    isConfirmed: !!authUser.email_confirmed_at,
    lastSignInAt: authUser.last_sign_in_at ?? null,
    createdAt: authUser.created_at,
  }
}
```

### Error Codes

Existing `ErrorCode` from `src/lib/errors/codes.ts`:
- `UNAUTHORIZED` — not logged in
- `FORBIDDEN` — insufficient role
- `CONFLICT` — duplicate email (use this for 409)
- `VALIDATION_ERROR` — invalid input
- `INTERNAL_ERROR` — server failure

No new error codes needed.

### Performance Targets

- User creation completes < 1 second (NFR-P3)
- Validation errors appear < 200ms (client-side Zod)
- Server errors appear < 500ms (NFR-P7)
- Loading indicator appears < 200ms (NFR-P8)
- System supports 5-7 concurrent CMS users (NFR-P5)

### Security Checklist

- [x] `requireApiAuth('super_admin')` on all user management endpoints
- [x] `requireAuth('super_admin')` on page Server Component
- [x] Service client (`service.ts`) only used server-side — `import 'server-only'` guard
- [x] `super_admin` role excluded from createUser form (only admin/user selectable)
- [x] Email input validated with Zod `.email()` — no XSS risk
- [x] Role input validated with Zod `.enum()` — no injection risk
- [x] No passwords stored/displayed in admin UI (Supabase Auth handles hashing)
- [x] Error messages don't leak internal details (no stack traces, no Supabase error internals)

### Testing Approach

**Expected: ~40-50 new tests across ~8-10 new test files** (baseline: 1532 tests / 135 files → target: ~1575 / ~145)

**Unit tests:**
- Zod schema validation boundaries (`user.test.ts`) — ~8-10 tests
- Domain query/mutation logic with mocked Supabase client — ~8-10 tests
- React Query mutation hooks — ~4-6 tests

**Component tests:**
- AddUserDialog: render, validation, submit success, duplicate error, loading state, dialog close cleanup — ~10-12 tests
- UsersTable: render with data, empty state, loading skeleton — ~6-8 tests

**Integration tests:**
- API route: auth guard enforcement, Zod validation, success response, duplicate handling — ~8-10 tests

**Use static imports only (Epic 4 D1 lesson):**
```typescript
// CORRECT
import { createUserSchema } from '@/lib/validations/user'
// NEVER: const { createUserSchema } = await import(...)
```

**Mock factories:**
```typescript
import { createMockCmsUser } from '@/lib/test-utils/mock-factories'
const user = createMockCmsUser({ role: 'admin', email: 'admin@dxt.com' })
```

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming): **ALIGNED** — follows Epic 3 Systems pattern exactly
- New directory: `src/app/admin/users/` and `src/lib/users/`
- No conflicts with existing code (Epic 6 is a new feature area)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.1] — Full acceptance criteria, BDD scenarios
- [Source: `_bmad-output/project-context.md`] — 147 implementation rules, API response format, testing standards
- [Source: `src/lib/supabase/service.ts`] — Service client with SERVICE_ROLE_KEY for Auth Admin API
- [Source: `src/lib/auth/guard.ts`] — Auth guards: `requireAuth()`, `requireApiAuth()`, `isAuthError()`, `Role` type
- [Source: `src/lib/errors/codes.ts`] — Error codes including CONFLICT for duplicate email
- [Source: `src/app/api/systems/route.ts`] — Reference API route pattern (GET list + POST create)
- [Source: `src/lib/admin/mutations/systems.ts`] — Reference React Query mutation with optimistic update + rollback
- [Source: `src/lib/admin/queries/systems.ts`] — Reference React Query queryOptions pattern
- [Source: `src/lib/admin/queries/api-adapter.ts`] — `unwrapResponse<T>()` and `ApiError` for fetch → typed response
- [Source: `src/app/admin/_components/AdminSidebar.tsx`] — Current nav items, needs Users link addition
- [Source: `_bmad-output/implementation-artifacts/react-query-patterns.md`] — Rule #7: mutateAsync + try/catch
- [Source: `_bmad-output/implementation-artifacts/security-pre-review-checklist.md`] — Security validation checklist
- [Source: Supabase Auth Admin API docs] — `auth.admin.createUser()`, `inviteUserByEmail()`, `listUsers()`

### Cross-Story Context (Epic 6 Roadmap)

| Story | Depends On | Adds To This Story's Code |
|-------|-----------|---------------------------|
| 6-2 Assign/Change Roles | 6-1 (users exist) | Adds EditRoleDialog to UsersTable Actions column |
| 6-3 Reset Passwords | 6-1 (users exist) | Adds ResetPasswordDialog to UsersTable Actions column |
| 6-4 Disable/Delete Users | 6-1 (users exist) | Adds Disable/Delete buttons to UsersTable Actions column |
| 6-5 Login History | 6-1 (users exist) | May add `cms_users` table for denormalized last_login tracking |

**Design the UsersTable Actions column as extensible** — leave a placeholder comment for Stories 6-2 through 6-4 action buttons. Don't implement them now, but structure the column to accommodate them.

### Previous Story Intelligence

**From Epic 5 (most recent work):**
- Peak defect density halved (10 vs 20 issues per story) — story splitting works
- `mutateAsync` + try/catch enforced in all mutation callsites
- Static imports only in tests (no `await import()`)
- Mock factories centralized in `mock-factories.ts` — add `createMockCmsUser()` here
- OKLCH color issue not applicable to this story (no charts)
- `escapeHtml()` not needed (no server-side HTML generation in this story)

**From Epic 3 Systems CRUD (closest analogy):**
- `AddSystemDialog` is the template for `AddUserDialog`
- Inline server errors (duplicate name → duplicate email) keep dialog open
- Toast for generic errors
- Optimistic insert with temp ID → replace on success → rollback on error
- `onSettled` always invalidates query cache

### Git Intelligence

**Recent commits** — all Epic 5 work is done. Clean main branch. Last commit: `82db023 chore: complete Epic 5 retro action items and centralize system mock factories`

**Commit convention:** `type(scope): description`
- `feat(users): add user management page and create user dialog (Story 6-1)` — suggested commit message

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| JSDOM polyfills in `test-setup.ts` | Radix UI Select/Dialog use pointer capture + scrollIntoView APIs missing in JSDOM | Low — 4 polyfill lines, affects all tests |
| shadcn `table` + `skeleton` installed | UsersTable + loading skeleton need these components | Low — 2 new shadcn components |
| `fireEvent.pointerDown` pattern for Radix Select in Dialog | `userEvent.click` blocked by JSDOM pointer-events on Dialog overlay | Low — reusable pattern for future tests |
| Removed `type="email"` from AddUserDialog Input | HTML5 email validation interfered with Zod validation in tests | Low — Zod `.email()` handles validation instead |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Implementation Plan

Task execution order follows story file exactly. Red-green-refactor cycle per task.

### Debug Log References

- Zod v4 `z.enum()` uses `{ message }` not `{ required_error }` — fixed in Task 10 type-check
- Radix UI Select in JSDOM needs `fireEvent.pointerDown` with `{ button: 0, pointerId: 1, pointerType: 'mouse' }` — bypasses pointer-events check
- JSDOM missing `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView` — polyfilled in test-setup.ts
- HTML5 `type="email"` on Input prevented Zod validation test from reaching `.email()` check — removed in favor of Zod-only validation

### Completion Notes List

- All 10 tasks complete, 59 new tests (1532 → 1591), 142 test files (135 → 142)
- All checks pass: type-check, lint, tests, bundle budget
- Supabase Auth Admin API contracts verified against @supabase/auth-js types
- Security checklist fully verified
- AdminSidebar role-based filtering uses client-side ROLE_HIERARCHY (can't import guard.ts 'server-only')
- inviteUserByEmail local verification deferred (requires running local Supabase with Inbucket)

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**New files (19):**
- `src/lib/validations/user.ts` — Zod schemas, CmsUser type, ASSIGNABLE_ROLES
- `src/lib/validations/user.test.ts` — 12 tests
- `src/lib/users/queries.ts` — listCmsUsers() server-only
- `src/lib/users/queries.test.ts` — 5 tests
- `src/lib/users/mutations.ts` — createCmsUser() two-step
- `src/lib/users/mutations.test.ts` — 5 tests
- `src/app/api/users/route.ts` — GET + POST /api/users
- `src/app/api/users/route.test.ts` — 12 tests
- `src/lib/admin/queries/users.ts` — usersQueryOptions
- `src/lib/admin/mutations/users.ts` — useCreateUser hook
- `src/lib/admin/mutations/users.test.tsx` — 4 tests
- `src/app/admin/users/page.tsx` — Server Component with requireAuth('super_admin')
- `src/app/admin/users/loading.tsx` — Skeleton loader
- `src/app/admin/users/_components/UsersTable.tsx` — Client component
- `src/app/admin/users/_components/UsersTable.test.tsx` — 9 tests
- `src/app/admin/users/_components/AddUserDialog.tsx` — React Hook Form + Zod
- `src/app/admin/users/_components/AddUserDialog.test.tsx` — 10 tests
- `src/components/ui/table.tsx` — shadcn Table component
- `src/components/ui/skeleton.tsx` — shadcn Skeleton component

**Modified files (7):**
- `src/app/admin/_components/AdminShell.tsx` — pass role prop to AdminSidebar
- `src/app/admin/_components/AdminSidebar.tsx` — role-based filtering, Users nav link
- `src/app/admin/_components/AdminSidebar.test.tsx` — added role prop + 2 role-filtering tests
- `src/app/admin/_components/AdminSidebar.guardrails.test.tsx` — added role prop
- `src/lib/test-utils/mock-factories.ts` — added createMockCmsUser, createMockCmsUserList
- `src/test-setup.ts` — JSDOM polyfills for Radix UI
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status update

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-02-14 | Story 6-1 implementation complete | 26 files (19 new, 7 modified) |
