# Story 6.2: Assign & Change User Roles

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Super Admin,
I want to assign or change user roles,
so that I can control what each team member can access and do.

## Acceptance Criteria

1. **"Change Role" button appears in Actions column** — For each user row in the UsersTable, an actions dropdown menu appears with a "Change Role" option. The current user's own row does NOT show "Change Role" (cannot change own role).
2. **Change Role dialog shows all roles** — When I click "Change Role", a dialog opens showing the user's email, current role, and a dropdown with all three roles: Super Admin, Admin, User. The current role is pre-selected.
3. **Role update via Supabase Auth Admin API** — When I select a new role and click "Save", the user's `app_metadata.role` is updated via `serviceClient.auth.admin.updateUserById()`. The change takes effect immediately on the user's next page load.
4. **Success confirmation** — After successful role change, a success toast appears: "Role updated successfully" with description "Changed [email] to [new role]". The UsersTable updates immediately via optimistic update.
5. **Last Super Admin protection** — When I try to change the last Super Admin to Admin or User, the system prevents it with an error: "At least one Super Admin is required". This is enforced server-side and displayed as an inline error in the dialog.
6. **No-op guard** — If I select the same role the user already has and click Save, the dialog shows a validation message "User already has this role" and does NOT make an API call.
7. **RBAC enforcement** — Only Super Admin can access the PATCH endpoint. Enforced via `requireApiAuth('super_admin')` at API level. Page-level guard already exists from Story 6-1.
8. **Loading and error states** — Save button shows `Loader2` spinner with "Saving..." text during submission. Server errors display as toast within 500ms (NFR-P7).

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

<!-- ANALYSIS: 8 tasks, 3 layers (Validation + API + UI, no migration). Within threshold. Proceed. -->

- [x] Task 1 — Zod validation schemas and role constants update (AC: #2, #6)
  - [x] 1.1 Add `ALL_ROLES` constant to `src/lib/validations/user.ts`: `['super_admin', 'admin', 'user'] as const` (includes super_admin for role change — unlike `ASSIGNABLE_ROLES` which excludes it for user creation)
  - [x] 1.2 Add `AllRole` type: `(typeof ALL_ROLES)[number]`
  - [x] 1.3 Add `ALL_ROLE_LABELS` record: `{ super_admin: 'Super Admin', admin: 'Admin', user: 'User' }` (note: `UsersTable.tsx` has a local `getRoleLabel()` function — these overlap but serve different contexts: `ALL_ROLE_LABELS` for form/dialog, `getRoleLabel()` for table display. Acceptable duplication.)
  - [x] 1.4 Add `updateUserRoleSchema`: `z.object({ role: z.enum(ALL_ROLES, { message: 'Role is required' }) })`
  - [x] 1.5 Add `UpdateUserRoleInput` type: `z.infer<typeof updateUserRoleSchema>`
  - [x] 1.6 Add unit tests for `updateUserRoleSchema`: valid roles, invalid role rejection, empty string rejection

- [x] Task 2 — Domain mutation: update user role via Supabase Auth Admin API (AC: #3, #5)
  - [x] 2.1 Add `updateCmsUserRole(userId: string, input: UpdateUserRoleInput)` to `src/lib/users/mutations.ts`
  - [x] 2.2 Implementation: `serviceClient.auth.admin.updateUserById(userId, { app_metadata: { role: input.role } })`
  - [x] 2.3 **Last Super Admin check (server-side):** Before updating, if user's current role is `super_admin` and new role is NOT `super_admin`, count all super_admins via `listUsers()` and filter by `app_metadata.role === 'super_admin'`. If count === 1, throw `new Error('At least one Super Admin is required')`
  - [x] 2.4 Return transformed `CmsUser` from updated user data
  - [x] 2.5 Add unit tests with mocked Supabase admin client: success case, last super admin prevention, user not found error

- [x] Task 3 — API route: PATCH `/api/users/[userId]/route.ts` (AC: #3, #5, #7)
  - [x] 3.1 Create `src/app/api/users/[userId]/route.ts` with PATCH handler
  - [x] 3.2 Auth guard: `requireApiAuth('super_admin')`
  - [x] 3.3 Extract `userId` from route params: `const { userId } = await params`
  - [x] 3.4 **Self-role-change prevention (server-side):** If `auth.user.id === userId`, return 409 with "Cannot change your own role". Defense-in-depth — UI also hides the action, but API must enforce independently.
  - [x] 3.5 Zod validation on request body with `updateUserRoleSchema`
  - [x] 3.6 Call `updateCmsUserRole(userId, validated)`
  - [x] 3.7 Handle error cases: validation → 400, self-change → 409, last super admin → 409 CONFLICT, not found → 404, internal → 500
  - [x] 3.8 Standard `{ data, error }` response wrapper. No `revalidatePath` needed — users page uses React Query client-side cache exclusively, no RSC server cache for user data.
  - [x] 3.9 Add integration tests: auth guard, validation, success, self-role-change rejection, last super admin error, not found

- [x] Task 4 — React Query mutation hook: `useUpdateUserRole()` (AC: #3, #4)
  - [x] 4.1 Add `useUpdateUserRole()` to `src/lib/admin/mutations/users.ts`
  - [x] 4.2 `mutationFn`: PATCH `/api/users/${userId}` with `{ role }` body
  - [x] 4.3 Optimistic update: update role in cached `['admin', 'users']` array, rollback on error
  - [x] 4.4 `onSettled`: always invalidate `['admin', 'users']` query
  - [x] 4.5 Add mutation tests

- [x] Task 5 — EditRoleDialog component (AC: #1, #2, #4, #5, #6, #8)
  - [x] 5.1 Create `src/app/admin/users/_components/EditRoleDialog.tsx`
  - [x] 5.2 Props: `user: CmsUser` (the user being edited), `currentAuthUserId: string` (to prevent self-edit) — Note: simplified to `open`/`onOpenChange` controlled pattern; self-edit prevention handled at UsersTable level (Task 6)
  - [x] 5.3 React Hook Form + Zod with `updateUserRoleSchema`, default value = user's current role
  - [x] 5.4 Dialog content: user email (read-only display), current role badge, role Select dropdown with all 3 roles
  - [x] 5.5 No-op guard: if selected role === current role, show form-level error "User already has this role" and don't submit
  - [x] 5.6 `mutateAsync` + try/catch pattern (Epic 4 P2 rule)
  - [x] 5.7 Inline error for "last super admin" server error, toast for other errors
  - [x] 5.8 Loading state: `form.formState.isSubmitting` disables button + `Loader2` spinner + "Saving..." text
  - [x] 5.9 `handleOpenChange` lifecycle: clear `serverError`, `form.reset()` on dialog close
  - [x] 5.10 Accessibility: `data-testid` on all interactive elements, `DialogDescription`, `role="alert"` on errors
  - [x] 5.11 Add component tests: render, role selection, no-op guard, submit success, last super admin error, 404 user-not-found toast, loading state, dialog close cleanup

- [x] Task 6 — UsersTable Actions column integration (AC: #1)
  - [x] 6.1 Pass `currentAuthUserId` prop to `UsersTable` from the parent page (via server-to-client data flow)
  - [x] 6.2 Update `src/app/admin/users/page.tsx` to pass the authenticated user's ID to `UsersTable`
  - [x] 6.3 Replace `{/* Story 6-2/6-3/6-4 actions */}` placeholder in UsersTable with:
    - `DropdownMenu` (shadcn) with `DropdownMenuTrigger` (ellipsis icon button `MoreHorizontal`)
    - `DropdownMenuItem` "Change Role" that opens `EditRoleDialog`
    - Leave placeholder comment `{/* Story 6-3/6-4 actions */}` for future action items
  - [x] 6.4 Hide "Change Role" action for the current user's own row (`user.id === currentAuthUserId`)
  - [x] 6.5 Install shadcn `dropdown-menu` component if not already installed: `npx shadcn@latest add dropdown-menu`
  - [x] 6.6 Update UsersTable tests: actions column rendering, self-action hidden, dropdown interaction

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — Supabase Auth Admin API contract verification -->
- [x] Task 7 — Integration contract verification (AC: all)
  - [x] 7.1 Verify Supabase Auth Admin API: `updateUserById(id, { app_metadata })` accepts role update
  - [x] 7.2 Verify `listUsers` can be used to count super_admins for last-admin check
  - [x] 7.3 Run `npm run type-check && npm run lint && npm run test` — all pass (1634 tests, 144 files)
  - [x] 7.4 Run `npm run size` — admin route stays under 350 KB budget (206.3 KB / 350 KB)

- [x] Task 8 — Mock factory update (AC: all)
  - [x] 8.1 No new mock factory needed — `createMockCmsUser()` already supports role override from Story 6-1
  - [x] 8.2 Verify existing mock factories cover all test scenarios for this story — confirmed via 1634 passing tests

## Dev Notes

### Architecture & Patterns

**Supabase Auth Admin API — `updateUserById` (key method for this story):**
```typescript
// src/lib/users/mutations.ts — add to existing file
import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

const { data, error } = await serviceClient.auth.admin.updateUserById(userId, {
  app_metadata: { role: newRole },
})
```

**CRITICAL — Role assignment includes super_admin:**
Story 6-1 used `ASSIGNABLE_ROLES = ['admin', 'user']` to prevent creating super_admin via Add User form. Story 6-2 is DIFFERENT — the Change Role dialog allows assigning ALL roles including `super_admin`. This requires a separate constant `ALL_ROLES` and separate schema `updateUserRoleSchema`.

**Last Super Admin Protection (server-side ONLY — don't trust client):**
```typescript
// In updateCmsUserRole() — check BEFORE updating
async function countSuperAdmins(): Promise<number> {
  const serviceClient = createServiceClient()
  const { data: { users } } = await serviceClient.auth.admin.listUsers()
  return users.filter(u => u.app_metadata?.role === 'super_admin').length
}

// Before role change:
if (currentRole === 'super_admin' && newRole !== 'super_admin') {
  const superAdminCount = await countSuperAdmins()
  if (superAdminCount <= 1) {
    throw new Error('At least one Super Admin is required')
  }
}
```

**NOTE on `listUsers()` for counting:** For the current scale (5-7 CMS users, NFR-P5), calling `listUsers()` to count super_admins is acceptable. Supabase `listUsers()` defaults to `perPage: 50` — sufficient for MVP scale but increase if user count grows. For future scale, consider a more efficient approach (RPC function or metadata query).

**Known limitation — TOCTOU race condition:** The last-super-admin check and the `updateUserById` call are NOT atomic. Between the count check and the update, another concurrent request could theoretically change a different super admin's role. Acceptable for 5-7 CMS user scale — extremely unlikely with single-digit admin counts.

**Session impact on role change:** When User A's role is changed by User B, User A's active session continues with the old role until their next server request (Supabase `getUser()` reads fresh `app_metadata` per request). User A does NOT get kicked out mid-session — their next navigation/refresh reflects the new permissions. This is expected behavior.

**API Route — Dynamic route with `[userId]`:**
```typescript
// src/app/api/users/[userId]/route.ts
// Next.js 16: params is async — MUST await
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params  // CRITICAL: Next.js 16 async params
  // ... validation and mutation
}
```

**IMPORTANT Next.js 16 async params:** Route params are async in Next.js 16. MUST use `await params` — NOT destructure directly.

**Dialog pattern — EditRoleDialog (follows AddUserDialog pattern):**
- Uses `Dialog` with controlled `open` state (NOT `DialogTrigger` — triggered from DropdownMenu)
- Props receive `user: CmsUser` to pre-populate current role
- `handleOpenChange` clears `serverError` and resets form on close
- `mutateAsync` + try/catch (Epic 4 P2 rule)

**Actions column — DropdownMenu pattern:**
```typescript
// Inside UsersTable row render
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, UserCog } from 'lucide-react'

// For each user row (only if user.id !== currentAuthUserId):
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`user-actions-${user.id}`}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Open menu</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={() => setEditingUser(user)} data-testid={`change-role-${user.id}`}>
      <UserCog className="mr-2 h-4 w-4" />
      Change Role
    </DropdownMenuItem>
    {/* Story 6-3/6-4 actions */}
  </DropdownMenuContent>
</DropdownMenu>
```

**Passing `currentAuthUserId` to client:**
The page.tsx Server Component currently calls `await requireAuth('super_admin')` **without destructuring** (discards the return value). Must change to destructure and pass `user.id`:
```typescript
// src/app/admin/users/page.tsx — CHANGE existing line
// BEFORE: await requireAuth('super_admin')
// AFTER:
const { user } = await requireAuth('super_admin')
return <UsersTable currentAuthUserId={user.id} />
```

**Optimistic update pattern for role change:**
```typescript
// In useUpdateUserRole() — onMutate handler
onMutate: async ({ userId, role }) => {
  await queryClient.cancelQueries({ queryKey: ['admin', 'users'] })
  const previous = queryClient.getQueryData<CmsUser[]>(['admin', 'users'])

  queryClient.setQueryData<CmsUser[]>(['admin', 'users'], (old) =>
    old?.map((u) => u.id === userId ? { ...u, role } : u) ?? []
  )

  return { previous }
},
onError: (_error, _variables, context) => {
  if (context?.previous) {
    queryClient.setQueryData(['admin', 'users'], context.previous)
  }
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
},
```

### Error Codes

Existing `ErrorCode` from `src/lib/errors/codes.ts` — no new codes needed:
- `UNAUTHORIZED` — not logged in
- `FORBIDDEN` — insufficient role
- `CONFLICT` — last super admin prevention (409)
- `VALIDATION_ERROR` — invalid input
- `NOT_FOUND` — user ID not found (404)
- `INTERNAL_ERROR` — server failure

**Error mapping in API route:**
| Error case | HTTP status | ErrorCode | Client handling |
|------------|-----------|-----------|-----------------|
| Invalid role value | 400 | VALIDATION_ERROR | Toast |
| Self-role-change | 409 | CONFLICT | Toast (UI hides action, but API enforces independently) |
| Last super admin | 409 | CONFLICT | Inline `serverError` in dialog (match on "Super Admin" text) |
| User not found | 404 | NOT_FOUND | Toast |
| Auth failure | 401/403 | UNAUTHORIZED/FORBIDDEN | Redirect |
| Server error | 500 | INTERNAL_ERROR | Toast |

### Performance Targets

- Role update completes < 1 second (NFR-P3)
- Validation errors appear < 200ms (client-side Zod)
- Server errors appear < 500ms (NFR-P7)
- Loading indicator appears < 200ms (NFR-P8)
- Optimistic update reflects immediately in table

### Security Checklist

- [x] `requireApiAuth('super_admin')` on PATCH endpoint
- [x] Page-level guard already exists from Story 6-1 (`requireAuth('super_admin')`)
- [x] Service client (`service.ts`) only used server-side — `import 'server-only'` guard
- [x] `super_admin` IS allowed in role change (unlike creation) — controlled via `ALL_ROLES` schema
- [x] Last super admin check is SERVER-SIDE (never trust client-side validation alone)
- [x] Role input validated with Zod `.enum()` — no injection risk
- [x] Self-role-change prevented at BOTH UI level (hide action for own row) AND server-side (`auth.user.id === userId` → 409)
- [x] Error messages don't leak internal details

### Testing Approach

**Expected: ~35-45 new tests across ~5-6 test files** (baseline: 1591 tests / 142 files → target: ~1630 / ~147)

**Unit tests:**
- Zod `updateUserRoleSchema` validation boundaries (`user.test.ts` — add ~5 tests) — valid roles, invalid, empty
- Domain mutation `updateCmsUserRole()` (`mutations.test.ts` — add ~5-6 tests) — success, last admin, not found
- React Query `useUpdateUserRole()` hook (`users.test.tsx` — add ~4 tests) — mutate, optimistic, rollback

**Component tests:**
- EditRoleDialog: render, pre-populated role, role selection, no-op guard, submit success, last super admin error, 404 user-not-found toast, loading state, dialog close cleanup — ~11-13 tests (NEW file)
- UsersTable: actions column render, self-action hidden, dropdown opens, Change Role triggers dialog — ~5-6 tests (update existing)

**Integration tests:**
- API PATCH route: auth guard, validation, success, self-role-change 409, last super admin 409, not found 404, internal error — ~9-11 tests (NEW file)

**Use static imports only (Epic 4 D1 lesson):**
```typescript
// CORRECT
import { updateUserRoleSchema } from '@/lib/validations/user'
// NEVER: const { updateUserRoleSchema } = await import(...)
```

**Mock factories:**
```typescript
import { createMockCmsUser } from '@/lib/test-utils/mock-factories'
const superAdmin = createMockCmsUser({ role: 'super_admin' })
const admin = createMockCmsUser({ role: 'admin', id: 'user-002' })
```

### Project Structure Notes

- Alignment with unified project structure: **ALIGNED** — extends Story 6-1 patterns
- New directory: `src/app/api/users/[userId]/` (dynamic route segment)
- New component: `EditRoleDialog.tsx` in existing `_components/` folder
- shadcn component to install: `dropdown-menu`
- No database migrations needed

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 6, Story 6.2] — Acceptance criteria, BDD scenarios
- [Source: `_bmad-output/project-context.md`] — 147 implementation rules, API response format
- [Source: `src/lib/users/mutations.ts`] — Existing `createCmsUser()` pattern (extends with `updateCmsUserRole`)
- [Source: `src/lib/users/queries.ts`] — `listCmsUsers()` for super admin count. Note: `transformAuthUser()` is private — use inline transform in `updateCmsUserRole()` (matching existing `createCmsUser()` pattern in `mutations.ts`)
- [Source: `src/lib/validations/user.ts`] — Existing schemas, `ASSIGNABLE_ROLES`, `CmsUser` type
- [Source: `src/app/api/users/route.ts`] — Reference API route pattern (GET/POST)
- [Source: `src/lib/admin/mutations/users.ts`] — `useCreateUser()` optimistic update pattern
- [Source: `src/app/admin/users/_components/UsersTable.tsx:123`] — Actions column placeholder to replace
- [Source: `src/app/admin/users/_components/AddUserDialog.tsx`] — Dialog pattern to follow
- [Source: `src/lib/auth/guard.ts`] — `requireApiAuth()`, `Role` type, `ROLE_HIERARCHY`
- [Source: `src/lib/errors/codes.ts`] — ErrorCode enum (CONFLICT for last admin)
- [Source: `src/lib/admin/queries/api-adapter.ts`] — `unwrapResponse<T>()` for fetch → typed response
- [Source: `_bmad-output/implementation-artifacts/react-query-patterns.md`] — Rule #7: mutateAsync + try/catch
- [Source: `_bmad-output/implementation-artifacts/security-pre-review-checklist.md`] — Security validation
- [Source: Supabase Auth Admin API docs] — `auth.admin.updateUserById()` for role updates

### Cross-Story Context (Epic 6 Roadmap)

| Story | Depends On | Impact on Actions Column |
|-------|-----------|--------------------------|
| 6-2 Assign/Change Roles (this) | 6-1 (users exist) | Adds DropdownMenu with "Change Role" item |
| 6-3 Reset Passwords | 6-1, builds on 6-2 DropdownMenu | Adds "Reset Password" to DropdownMenu |
| 6-4 Disable/Delete Users | 6-1, builds on 6-2 DropdownMenu | Adds "Disable"/"Delete" to DropdownMenu |
| 6-5 Login History | 6-1 | Adds user detail panel (may not use DropdownMenu) |

**Design the DropdownMenu as extensible** — Story 6-3 and 6-4 will add more items. Keep a placeholder comment for future action items.

### Previous Story Intelligence

**From Story 6-1 (immediate predecessor — in review):**
- Supabase Auth Admin API patterns established: `createServiceClient()`, `auth.admin.*` namespace
- `CmsUser` type and `transformAuthUser()` function ready in queries layer
- `ROLE_HIERARCHY` duplicated client-side in `AdminSidebar.tsx` (can't import `guard.ts` server-only)
- UsersTable Actions column has placeholder: `{/* Story 6-2/6-3/6-4 actions */}` — replace this
- `createMockCmsUser()` and `createMockCmsUserList()` factories ready
- JSDOM polyfills for Radix UI already in `test-setup.ts`
- `fireEvent.pointerDown` pattern needed for Radix Select in Dialog tests
- Zod v4 uses `{ message }` not `{ required_error }` in `z.enum()`
- HTML5 `type="email"` was removed from Input to avoid conflict with Zod validation — no issue for this story (no email input)

**From Epic 5 (most recent completed):**
- `mutateAsync` + try/catch enforced in all mutation callsites
- Static imports only in tests (no `await import()`)
- Mock factories centralized in `mock-factories.ts`
- Peak defect density halved with story splitting

**From Epic 3 Systems CRUD (closest analogy for CRUD patterns):**
- `EditSystemDialog` pattern is reference for `EditRoleDialog` (but simpler — single field)
- Inline server errors keep dialog open, toast for generic errors
- Optimistic update with rollback on error
- `onSettled` always invalidates query cache

### Git Intelligence

**Recent commits:**
```
e75ef74 feat(users): add user management page and create user dialog (Story 6-1)
82db023 chore: complete Epic 5 retro action items and centralize system mock factories
```

**Commit convention:** `type(scope): description`
- Suggested commit: `feat(users): add role assignment and change role dialog (Story 6-2)`

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No blocking issues encountered during implementation.

### Completion Notes List

- **Task 1:** Added `ALL_ROLES`, `AllRole`, `ALL_ROLE_LABELS`, `updateUserRoleSchema`, `UpdateUserRoleInput` to `user.ts`. 10 new tests.
- **Task 2:** Added `updateCmsUserRole()` with last-super-admin server-side protection. 5 new tests.
- **Task 3:** Created PATCH `/api/users/[userId]` with auth guard, self-change prevention (409), Zod validation, last-admin protection (409), not-found (404). 9 new tests.
- **Task 4:** Added `useUpdateUserRole()` hook with optimistic update + rollback. 4 new tests.
- **Task 5:** Created `EditRoleDialog` with controlled open/close, no-op guard, inline error for last-admin, toast for other errors, loading state. 11 new tests.
- **Task 6:** Integrated DropdownMenu in UsersTable Actions column, installed shadcn `dropdown-menu` (removed `dark:` class per ESLint rule), passed `currentAuthUserId` from page.tsx, hid actions for current user row. 5 new tests.
- **Task 7:** type-check ✅, lint ✅, 1634 tests pass ✅, bundle budget ✅ (admin 206.3 KB / 350 KB).
- **Task 8:** Existing `createMockCmsUser()` factory covers all scenarios — no changes needed.
- **Security checklist:** All applicable checks pass. TOCTOU for last-admin documented as known limitation.
- **Total new tests:** 44 (baseline 1591 → 1634, delta = 43 from this story + 1 from recent maintenance)

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**New files (5):**
- `src/app/api/users/[userId]/route.ts` — PATCH handler for role update
- `src/app/api/users/[userId]/route.test.ts` — API integration tests (9 tests)
- `src/app/admin/users/_components/EditRoleDialog.tsx` — Change Role dialog
- `src/app/admin/users/_components/EditRoleDialog.test.tsx` — Dialog tests (11 tests)
- `src/components/ui/dropdown-menu.tsx` — shadcn DropdownMenu component (dark: class removed)

**Modified files (10):**
- `src/lib/validations/user.ts` — Add `ALL_ROLES`, `AllRole`, `ALL_ROLE_LABELS`, `updateUserRoleSchema`, `UpdateUserRoleInput`
- `src/lib/validations/user.test.ts` — Add 10 new tests for ALL_ROLES, ALL_ROLE_LABELS, updateUserRoleSchema
- `src/lib/users/mutations.ts` — Add `updateCmsUserRole()` with last-super-admin check
- `src/lib/users/mutations.test.ts` — Add 5 new tests for updateCmsUserRole
- `src/lib/admin/mutations/users.ts` — Add `useUpdateUserRole()` hook with optimistic update
- `src/lib/admin/mutations/users.test.tsx` — Add 4 new tests for useUpdateUserRole
- `src/app/admin/users/page.tsx` — Destructure `requireAuth()` return, pass `currentAuthUserId` to UsersTable
- `src/app/admin/users/_components/UsersTable.tsx` — Actions column with DropdownMenu + EditRoleDialog, `currentAuthUserId` prop
- `src/app/admin/users/_components/UsersTable.test.tsx` — Add 5 new tests for actions column, update existing tests for `currentAuthUserId` prop
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status update

### Code Review

**Reviewer:** Claude Opus 4.6 (5-agent parallel review)
**Date:** 2026-02-14
**Result:** No issues found (all flagged issues scored <80 confidence). Clean pass.

**Review Agents:**
1. CLAUDE.md compliance audit
2. Shallow bug scan
3. Git history context review
4. Previous PR comments check (no PRs in repo — direct-to-main workflow)
5. Code comments compliance check

**Issues Reviewed & Accepted (score <80):**

| # | Issue | Score | Rationale |
|---|-------|-------|-----------|
| 1 | `dropdown-menu.tsx` import `from "radix-ui"` flagged as broken | 0 | False positive — project uses consolidated `radix-ui@1.4.3` package. All other shadcn components (alert-dialog, dialog, select) use identical pattern. TypeScript, lint, and 1634 tests pass. |
| 2 | TOCTOU race condition in last-super-admin check (non-atomic count + update) | 15 | Known limitation documented in Dev Notes. Acceptable for 5-7 CMS user scale (NFR-P5). Not a CLAUDE.md violation. |

**Key Compliance Verified:**
- Next.js 16 async `params` awaited correctly in API route
- API responses use `{ data, error }` wrapper
- React Query scoped to `/admin/` routes only
- `mutateAsync` + try/catch pattern (Epic 4 P2)
- Optimistic updates with rollback
- Defense-in-depth: self-role-change blocked at UI + API layers
- No `dark:` Tailwind classes
- All 1634 tests passing, bundle budget compliant (admin 206.3 KB / 350 KB)

### Code Review Fixes (BMAD Adversarial CR)

**Reviewer:** Claude Opus 4.6 (BMAD adversarial code review workflow)
**Date:** 2026-02-14
**Issues Fixed:** 3 Medium, 3 Low → all resolved

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| M1 | MEDIUM | Actions button `h-8 w-8` override violates 44px touch target | Removed `h-8 w-8` — `size="icon"` provides `size-11` (44x44) |
| M2 | MEDIUM | `CmsUser.role` typed `string` → forces `as` casts | Changed to `AllRole` union type, removed 3 casts in EditRoleDialog, updated transforms |
| M3 | MEDIUM | Error routing via fragile `message.includes('Super Admin')` | Added `LastSuperAdminError` class, route.ts uses `instanceof` check |
| L1 | LOW | Duplicate CmsUser transform in createCmsUser/updateCmsUserRole | Extracted `toCmsUser()` helper in mutations.ts |
| L2 | LOW | Missing dialog close cleanup test | Added test for cancel clearing serverError state |
| L3 | LOW | Missing 500/generic error toast test | Added test for generic server error → toast (not inline) |

**Files modified by fixes:**
- `src/lib/validations/user.ts` — `CmsUser.role: string` → `AllRole`
- `src/lib/users/mutations.ts` — Added `LastSuperAdminError`, `toCmsUser()` helper
- `src/lib/users/queries.ts` — Import `AllRole`, update transform cast
- `src/lib/admin/mutations/users.ts` — `UpdateUserRoleVariables.role: string` → `AllRole`
- `src/app/api/users/[userId]/route.ts` — Import + use `LastSuperAdminError` instanceof
- `src/app/admin/users/_components/EditRoleDialog.tsx` — Remove 3 `as` casts
- `src/app/admin/users/_components/EditRoleDialog.test.tsx` — +2 tests (L2, L3)
- `src/app/api/users/[userId]/route.test.ts` — Use `LastSuperAdminError` + `importOriginal`
- `src/lib/users/mutations.test.ts` — Verify `LastSuperAdminError` type

**Post-fix verification:** type-check ✅, lint ✅, 1636 tests ✅, bundle budget ✅
