# Story 6.3: Reset User Passwords

Status: done

## Story

As a Super Admin,
I want to reset a user's password,
so that locked-out team members can regain access.

## Acceptance Criteria (AC)

1. **Given** I am on the User Management page, **When** I click "Reset Password" for a user in the actions dropdown, **Then** a confirmation dialog appears: "Send password reset email to {email}?"
2. **Given** I confirm the reset, **When** the API processes the request, **Then** a password reset email is sent via Supabase Auth, **And** I see a success toast: "Password reset email sent to {email}"
3. **Given** the email is sent, **When** the user clicks the recovery link, **Then** they are redirected to `/auth/update-password` with a valid session (implicit flow — browser client auto-detects hash fragments)
4. **Given** the user is on the update-password page, **When** they enter and confirm a matching new password (min 6 chars), **Then** their password is updated via `supabase.auth.updateUser({ password })`, **And** they see a success message and are redirected to `/auth/login`
5. **Given** the password update is completed, **When** the user logs in with the new password, **Then** authentication succeeds **And** the previous password no longer works
6. **Given** the reset fails (user not found, email delivery issue), **When** the API returns an error, **Then** I see an error toast with a meaningful message
7. **Given** the `POST /api/users/[userId]/reset-password` endpoint is called, **When** the request lacks `super_admin` authentication, **Then** it returns 401/403 (RBAC enforcement)

## Tasks / Subtasks

- [x] Task 1: Add `resetCmsUserPassword()` domain mutation (AC: 2, 6)
  - [x] 1.1 In `src/lib/users/mutations.ts`, add function that accepts `userId: string`
  - [x] 1.2 Look up user email via `serviceClient.auth.admin.getUserById(userId)` — return 404 if not found
  - [x] 1.3 Call `serviceClient.auth.resetPasswordForEmail(email, { redirectTo: '${NEXT_PUBLIC_SITE_URL}/auth/update-password' })` — MUST use service client (implicit flow); SSR server client would use PKCE which breaks admin-triggered resets
  - [x] 1.4 Return `{ email }` on success (used by toast) — throw on error
  - [x] 1.5 Add unit tests to `src/lib/users/mutations.test.ts` (mock `getUserById` + `resetPasswordForEmail`)

- [x] Task 2: Create API route `POST /api/users/[userId]/reset-password` (AC: 2, 6, 7)
  - [x] 2.1 Create `src/app/api/users/[userId]/reset-password/route.ts`
  - [x] 2.2 Guard: `requireApiAuth('super_admin')` + `isAuthError` check
  - [x] 2.3 Await async params: `const { userId } = await params` (Next.js 16)
  - [x] 2.4 Call `resetCmsUserPassword(userId)`
  - [x] 2.5 Return `{ data: { email }, error: null }` (200) or `{ data: null, error }` (404/500)
  - [x] 2.6 Create `src/app/api/users/[userId]/reset-password/route.test.ts`

- [x] Task 3: Add `useResetUserPassword()` React Query hook (AC: 2, 6)
  - [x] 3.1 In `src/lib/admin/mutations/users.ts`, add `useResetUserPassword()` hook
  - [x] 3.2 `mutationFn`: POST to `/api/users/${userId}/reset-password`, unwrap response
  - [x] 3.3 No optimistic update needed (no cache change — password reset doesn't modify user list)
  - [x] 3.4 Add tests to `src/lib/admin/mutations/users.test.tsx`

- [x] Task 4: Create ResetPasswordDialog component (AC: 1, 2, 6)
  - [x] 4.1 Create `src/app/admin/users/_components/ResetPasswordDialog.tsx`
  - [x] 4.2 Use `AlertDialog` (not `Dialog`) — confirmation pattern with destructive action styling
  - [x] 4.3 Body: "A password reset email will be sent to **{email}**. The user will receive a link to set a new password."
  - [x] 4.4 `AlertDialogAction` with `e.preventDefault()` for async confirm (known gotcha: auto-closes otherwise)
  - [x] 4.5 Success toast: "Password reset email sent to {email}"
  - [x] 4.6 Error toast for failures
  - [x] 4.7 Loading state: spinner + disabled buttons during mutation
  - [x] 4.8 Create `src/app/admin/users/_components/ResetPasswordDialog.test.tsx`

- [x] Task 5: Integrate Reset Password into UsersTable (AC: 1)
  - [x] 5.1 Add `resettingUser` state (same pattern as `editingUser` for EditRoleDialog)
  - [x] 5.2 Add "Reset Password" `DropdownMenuItem` — replace `{/* Story 6-3/6-4 actions */}` placeholder at line 160
  - [x] 5.3 Use `KeyRound` icon from lucide-react
  - [x] 5.4 Wire to `ResetPasswordDialog` (controlled open/onOpenChange)
  - [x] 5.5 Update `src/app/admin/users/_components/UsersTable.test.tsx` with new action tests

- [x] Task 6: Create `/auth/update-password` page (AC: 3, 4, 5)
  - [x] 6.1 Create `src/app/auth/update-password/page.tsx` as `'use client'` component
  - [x] 6.2 On mount: register `supabase.auth.onAuthStateChange()` listener for `PASSWORD_RECOVERY` event — this fires when browser client auto-detects hash fragments (`#access_token=...&type=recovery`) from Supabase implicit flow redirect
  - [x] 6.3 Also call `supabase.auth.getSession()` on mount as fallback (handles case where hash was already processed before listener registered)
  - [x] 6.4 If no session after mount + no PASSWORD_RECOVERY event within ~2-3s → redirect to `/auth/login?error=session_expired` (use timeout — hash fragment processing is async, don't redirect too early)
  - [x] 6.5 Form fields: new password + confirm password (min 6 chars, must match)
  - [x] 6.6 Zod schema: `updatePasswordSchema` — add to `src/lib/validations/user.ts` + tests in `user.test.ts`
  - [x] 6.7 Use browser Supabase client (`createClient()` from `src/lib/supabase/client.ts`)
  - [x] 6.8 On submit: `supabase.auth.updateUser({ password })` → show inline success message ("Password updated successfully. Redirecting to login...") → `setTimeout` redirect to `/auth/login` (no `?message=` param needed — LoginForm doesn't handle it)
  - [x] 6.9 Style consistent with existing auth pages (same layout via `src/app/auth/layout.tsx`)
  - [x] 6.10 Create `src/app/auth/update-password/page.test.tsx`

- [x] Task 7: Verify integration contracts
  - [x] 7.1 Verify `redirectTo` URL (`/auth/update-password`) is under `/auth/*` (allowed by proxy.ts — confirmed)
  - [x] 7.2 Verify Supabase `site_url` / `additional_redirect_urls` in `config.toml` allow the redirect origin
  - [x] 7.3 Verify browser client (`createBrowserClient` from `@supabase/ssr`) auto-processes hash fragments on page load
  - [x] 7.4 Run full test suite: `npm run test`
  - [x] 7.5 Run bundle budget: `npm run size`
  - [x] 7.6 Run type check: `npm run type-check`
  - [x] 7.7 Run lint: `npm run lint`

## Dev Notes

### Two-Part Flow Architecture

**Part A — Admin triggers reset (admin-side):**
1. Admin clicks "Reset Password" in actions dropdown → confirmation AlertDialog
2. Confirm → `POST /api/users/[userId]/reset-password`
3. Server: `requireApiAuth('super_admin')` → `getUserById(userId)` → `resetPasswordForEmail(email)`
4. Supabase sends recovery email → admin sees success toast

**Part B — User resets password (user-side, implicit flow):**
1. User clicks recovery link in email
2. Supabase validates recovery token → redirects to `/auth/update-password#access_token=XXX&refresh_token=YYY&type=recovery`
3. Browser Supabase client (`createBrowserClient` from `@supabase/ssr`) auto-detects hash fragments during initialization
4. Client creates session from tokens, fires `PASSWORD_RECOVERY` event, cleans URL hash via `history.replaceState()`
5. Page shows password form → user enters new password → `supabase.auth.updateUser({ password })`
6. Redirect to `/auth/login` → user logs in with new password → MFA verify → admin dashboard

**Why implicit flow (NOT PKCE):**
- The service client (`@supabase/supabase-js`) uses `flowType: 'implicit'` by default
- `resetPasswordForEmail` sends NO `code_challenge` to Supabase Auth
- Supabase Auth sees no PKCE params → uses implicit flow → redirect with hash fragments
- This is the correct pattern for admin-triggered resets where the initiator (admin) ≠ the consumer (user)
- **Proven by:** Story 6-1 invite flow — `inviteUserByEmail` uses same service client + implicit flow + hash fragments → works

**DO NOT use SSR server client** (`@supabase/ssr`) for `resetPasswordForEmail`:
- SSR client uses `flowType: 'pkce'` → generates `code_verifier` stored in admin's cookies
- Recovery redirect would have `?code=` requiring `code_verifier` from admin's cookies
- User's browser has no `code_verifier` → `exchangeCodeForSession` fails
- **This breaks the entire flow.**

### Supabase APIs Used

| Method | Client | Flow | Purpose |
|--------|--------|------|---------|
| `auth.admin.getUserById(userId)` | Service (`@supabase/supabase-js`) | N/A | Look up user email from userId |
| `auth.resetPasswordForEmail(email, { redirectTo })` | Service (`@supabase/supabase-js`) | **Implicit** | Trigger recovery email — MUST use service client, NOT SSR client |
| `auth.onAuthStateChange(PASSWORD_RECOVERY)` | Browser (`@supabase/ssr`) | Auto | Detect session from hash fragments on update-password page |
| `auth.updateUser({ password })` | Browser (`@supabase/ssr`) | N/A | User-side password update (requires valid session) |

### Key Configuration

- `redirectTo`: `${NEXT_PUBLIC_SITE_URL}/auth/update-password` (direct — NOT through `/auth/callback`)
- Recovery token expiry: `otp_expiry = 3600` (1 hour, per `supabase/config.toml`)
- Email rate limit: `max_frequency = "1s"` (per `supabase/config.toml`)
- Implicit flow: Service client sends NO `code_challenge` → Supabase redirects with hash fragments

### Important Constraints

1. **NO database migration needed** — password reset is entirely Supabase Auth
2. **Service client REQUIRED** (`src/lib/supabase/service.ts`) — uses `@supabase/supabase-js` with implicit flow. Do NOT use SSR server client (`@supabase/ssr`) which would use PKCE and break the flow (code_verifier stored in admin's cookies, inaccessible to user)
3. **Proxy.ts** already allows `/auth/*` as public paths — no changes needed
4. **Auth callback route NOT involved** — this flow uses implicit redirect (hash fragments), not PKCE code exchange. The callback route at `src/app/auth/callback/route.ts` is NOT used.
5. **No "Forgot Password" on login page** — out of scope (admin-triggered only in this story)
6. **MFA after recovery** — user gets AAL1 session from hash fragments. MFA check happens automatically when navigating to `/admin/*` via proxy.ts
7. **Self-reset allowed** — admin can reset own password (harmless — just sends email to self)
8. **AlertDialogAction** auto-closes on click — MUST use `e.preventDefault()` for async confirm (known gotcha from MEMORY.md)

### Existing Patterns to Follow

**Domain mutation** (`src/lib/users/mutations.ts`):
- Import `createServiceClient` from `@/lib/supabase/service`
- Import `'server-only'` guard at top
- Throw typed errors for specific conditions
- Return typed result (here: `{ email: string }`)

**API route** (`src/app/api/users/[userId]/route.ts`):
- `requireApiAuth('super_admin')` + `isAuthError` guard
- `const { userId } = await params` (Next.js 16 async params)
- `NextResponse.json({ data, error })` wrapper pattern
- Import `ErrorCode` from `@/lib/errors/codes`
- Specific HTTP status: 404 (not found), 500 (server error)

**React Query hook** (`src/lib/admin/mutations/users.ts`):
- `useMutation` with proper generics `<TData, TError, TVariables>`
- `unwrapResponse<T>(res)` from `@/lib/admin/queries/api-adapter`
- No optimistic update for this case (no cache state changes)

**UsersTable dropdown** (`src/app/admin/users/_components/UsersTable.tsx:160`):
- Placeholder comment `{/* Story 6-3/6-4 actions */}` marks exact insertion point
- Follow `editingUser` state pattern: add `resettingUser` state with `useState<CmsUser | null>(null)`
- `DropdownMenuItem` with `onSelect={() => setResetingUser(user)}`
- Import `KeyRound` from `lucide-react` for icon

**Auth page** (`src/app/auth/login/page.tsx` and siblings):
- Login page itself is a **server component** that renders a client-side form component
- For update-password, make the page itself `'use client'` because hash fragment detection must happen at top level
- Uses auth layout (`src/app/auth/layout.tsx`) — server component with gradient background
- Browser Supabase client (`createClient()` from `@/lib/supabase/client`)
- Form with React Hook Form + Zod validation

**Implicit flow hash fragment handling** (unique to this story):
- Browser client auto-detects `#access_token=...&type=recovery` during initialization
- Listen for `onAuthStateChange` event `PASSWORD_RECOVERY` + call `getSession()` as fallback
- Client cleans URL hash via `history.replaceState()` automatically
- Proven pattern: invite flow (Story 6-1) uses same implicit flow with hash fragments

### Security Considerations

1. **Rate limiting**: Supabase natively rate-limits `resetPasswordForEmail`
2. **Token expiry**: Recovery tokens expire after 1 hour (configurable in `config.toml`)
3. **One-time use**: Recovery tokens are single-use — once used, the link is invalidated
4. **Hash fragment security**: Tokens in URL hash are NOT sent to the server, only available client-side via JavaScript
5. **Service role key**: Used only server-side in `mutations.ts` — never exposed to client
6. **Session invalidation**: After password update, Supabase Auth v2.149+ kills existing sessions
7. **Redirect URL validation**: Supabase validates `redirectTo` against `site_url` + `additional_redirect_urls` in config

### Project Structure Notes

**New files (6):**
```
src/app/api/users/[userId]/reset-password/route.ts       # API endpoint
src/app/api/users/[userId]/reset-password/route.test.ts   # API tests
src/app/admin/users/_components/ResetPasswordDialog.tsx    # Admin confirmation dialog
src/app/admin/users/_components/ResetPasswordDialog.test.tsx
src/app/auth/update-password/page.tsx                      # User password update page
src/app/auth/update-password/page.test.tsx
```

**Modified files (8):**
```
src/lib/users/mutations.ts              # Add resetCmsUserPassword()
src/lib/users/mutations.test.ts         # Add tests
src/lib/admin/mutations/users.ts        # Add useResetUserPassword()
src/lib/admin/mutations/users.test.tsx   # Add tests
src/lib/validations/user.ts             # Add updatePasswordSchema
src/lib/validations/user.test.ts        # Add tests for updatePasswordSchema
src/app/admin/users/_components/UsersTable.tsx       # Add Reset Password to dropdown
src/app/admin/users/_components/UsersTable.test.tsx   # Update tests
```

**Unchanged (reused as-is):**
```
src/lib/supabase/service.ts             # Service client factory (implicit flow — critical for this story)
src/lib/supabase/client.ts              # Browser client factory (handles hash fragments on update-password page)
src/app/auth/layout.tsx                 # Auth layout
src/lib/supabase/proxy.ts              # Already allows /auth/* paths
```

### Fallback: Resend Email (if needed)

If `resetPasswordForEmail` email delivery is unreliable in production, an alternative path exists:
1. Use `auth.admin.generateLink({ type: 'recovery', email })` to get the `action_link`
2. Send the link via Resend (`createResendClient()` from `src/lib/health/notifications.ts` pattern)
3. Use `escapeHtml()` from same module for email content sanitization
4. This gives full control over email content and delivery. NOT needed for MVP but available as fallback.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6, Story 6.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md#Rule 7 — mutateAsync + try/catch]
- [Source: _bmad-output/implementation-artifacts/security-pre-review-checklist.md]
- [Source: src/lib/users/mutations.ts — existing user mutation patterns + invite flow (implicit flow precedent)]
- [Source: src/lib/supabase/service.ts — service client uses `@supabase/supabase-js` with implicit flow]
- [Source: src/app/api/users/[userId]/route.ts — existing [userId] route pattern]
- [Source: src/lib/admin/mutations/users.ts — existing React Query hooks]
- [Source: src/app/admin/users/_components/UsersTable.tsx:160 — insertion point placeholder]
- [Source: src/lib/health/notifications.ts — Resend + escapeHtml() patterns (fallback reference)]
- [Source: supabase/config.toml — email & auth configuration (otp_expiry, max_frequency)]
- [Supabase Docs: resetPasswordForEmail — implicit flow for admin-triggered resets]
- [Supabase Docs: auth.updateUser — client-side password update]
- [Supabase Docs: onAuthStateChange PASSWORD_RECOVERY event — hash fragment detection]

### Code Review

- **Reviewer:** Claude Opus 4.6 (Amelia — Dev Agent)
- **Date:** 2026-02-14
- **Result:** PASS (all issues auto-fixed)
- **Issues Found:** 3 MEDIUM, 3 LOW (1 false positive retracted)
- **Issues Fixed:**
  - M1: Added `console.warn` for missing `NEXT_PUBLIC_SITE_URL` in `resetCmsUserPassword()` — inconsistent with `createCmsUser()` pattern
  - M2: Added loading state test for ResetPasswordDialog — `isPending: true` path was untested (spinner + disabled button)
  - M3: ~~Test count inflated~~ — RETRACTED (false positive; dev's count of 38 was correct, reviewer miscounted)
  - L1: Replaced `email!` non-null assertion with defensive null check + throw
  - L2: Added missing `afterEach` import from vitest in `page.test.tsx`
  - L3: Added `layout.tsx` for page metadata — `'use client'` page can't export metadata
- **Issues Accepted (no fix needed):** None
- **Post-fix verification:** 1673 tests pass (147 files), type-check clean, lint clean

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

(none — clean implementation, no debug issues)

### Completion Notes List

- **Task 1:** Added `resetCmsUserPassword()` to `mutations.ts` using service client (implicit flow). getUserById → resetPasswordForEmail → return { email }. 5 unit tests covering success, user not found, reset failure, missing site URL.
- **Task 2:** Created `POST /api/users/[userId]/reset-password` route with `requireApiAuth('super_admin')` guard. Returns 200/404/500 with `{ data, error }` wrapper. 5 tests.
- **Task 3:** Added `useResetUserPassword()` React Query hook — simple `useMutation` with `unwrapResponse`, no optimistic update needed. 4 tests.
- **Task 4:** Created `ResetPasswordDialog` using `AlertDialog` with `e.preventDefault()` for async confirm. Success/error toasts via sonner. Loading spinner during mutation. 5 tests.
- **Task 5:** Integrated into UsersTable — `resettingUser` state, `KeyRound` icon, `DropdownMenuItem` replacing placeholder comment. Updated placeholder to `{/* Story 6-4 actions */}`. 2 new tests.
- **Task 6:** Created `/auth/update-password` page as `'use client'` component. `onAuthStateChange` for PASSWORD_RECOVERY + `getSession()` fallback + 3s timeout redirect. React Hook Form + Zod validation (min 6 chars, password match). Consistent styling with auth layout. `updatePasswordSchema` added to validations. 7 page tests + 6 schema tests.
- **Task 7:** All integration contracts verified — proxy.ts allows `/auth/*`, Supabase config allows redirect origins, browser client auto-processes hash fragments. Full suite 1672 pass, bundle budget within limits, type-check clean, lint clean.
- **Security checklist:** All applicable items pass. Rate limiting via Supabase native, auth guarded with `requireApiAuth('super_admin')`, all redirects hardcoded, no data exposure.

### Change Log

- 2026-02-14: Story 6-3 implementation complete — password reset flow (admin-triggered + user-facing update-password page). 38 new tests added (1634 → 1672 total).
- 2026-02-14: Code review fixes — 5 issues resolved: (M1) added console.warn for missing NEXT_PUBLIC_SITE_URL, (M2) added loading state test for ResetPasswordDialog, (L1) replaced email! non-null assertion with defensive check, (L2) added missing afterEach import, (L3) added page metadata via layout.tsx. +1 test (1672 → 1673 total).

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

**New files (7):**
- `src/app/api/users/[userId]/reset-password/route.ts`
- `src/app/api/users/[userId]/reset-password/route.test.ts`
- `src/app/admin/users/_components/ResetPasswordDialog.tsx`
- `src/app/admin/users/_components/ResetPasswordDialog.test.tsx`
- `src/app/auth/update-password/page.tsx`
- `src/app/auth/update-password/page.test.tsx`
- `src/app/auth/update-password/layout.tsx` — page metadata (CR fix L3)

**Modified files (8):**
- `src/lib/users/mutations.ts` — added `resetCmsUserPassword()`
- `src/lib/users/mutations.test.ts` — added 5 tests for resetCmsUserPassword
- `src/lib/admin/mutations/users.ts` — added `useResetUserPassword()` hook
- `src/lib/admin/mutations/users.test.tsx` — added 4 tests for useResetUserPassword
- `src/lib/validations/user.ts` — added `updatePasswordSchema` + `UpdatePasswordInput` type
- `src/lib/validations/user.test.ts` — added 6 tests for updatePasswordSchema
- `src/app/admin/users/_components/UsersTable.tsx` — added Reset Password dropdown item + ResetPasswordDialog integration
- `src/app/admin/users/_components/UsersTable.test.tsx` — added 2 tests for reset password action
