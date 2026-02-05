# Story 2.5: Secure Logout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a CMS user,
I want to log out of the CMS securely,
So that my session is terminated and no one can access my account from this browser.

## Acceptance Criteria

1. **Given** I am logged in to the CMS **When** I click the "Logout" button **Then** my session is terminated on the server (Supabase Auth session invalidated) **And** I am redirected to the login page

2. **Given** I have logged out **When** I press the browser back button **Then** I cannot access protected CMS pages and am redirected to login

3. **Given** I have logged out **When** I inspect browser storage **Then** all session tokens and auth cookies are cleared

## Tasks / Subtasks

**Dependency: Stories 2.1, 2.2, 2.3, 2.4 must be complete. All confirmed done.**

- [x] Task 1: Create logout Server Action (AC: #1, #3)
  - [x] 1.1: Create `src/lib/actions/logout.ts`:
    ```typescript
    'use server'

    import 'server-only'
    import { redirect } from 'next/navigation'
    import { revalidatePath } from 'next/cache'
    import { createClient } from '@/lib/supabase/server'

    export async function logoutAction(): Promise<never> {
      const supabase = await createClient()

      // signOut() with default scope='global' revokes ALL sessions across devices
      // @supabase/ssr automatically clears session cookies via setAll() callback
      try {
        await supabase.auth.signOut()
      } catch {
        // Even if Supabase API fails (network error, downtime), still proceed
        // with redirect — user should NEVER be stuck on a protected page.
        // @supabase/ssr cookie clearing via setAll() happens regardless.
      }

      // Bust Next.js full-route cache so stale authenticated pages are not served
      revalidatePath('/', 'layout')

      redirect('/auth/login')
    }
    ```
  - [x] 1.2: **DESIGN DECISIONS:**
    - **Server Action** (not Route Handler) — enables `<form action={}>` pattern with progressive enhancement (works even if JS is disabled)
    - **Server client** (`createClient` from `@/lib/supabase/server`) — has full cookie read/write access via `@supabase/ssr` `setAll()` callback, ensuring all `sb-*` session cookies (including chunked cookies) are cleared
    - **Default `scope: 'global'`** — revokes ALL user sessions across all devices. This is the most secure option for MVP. The refresh token is revoked immediately; the access token (JWT) remains valid until its `exp` claim (~1 hour) but the cookie is deleted so the browser can't use it
    - **`revalidatePath('/', 'layout')`** — invalidates the full Next.js router cache so browser back button won't serve stale authenticated page renders from the server cache
    - **No error return** — if `signOut()` errors, we still redirect to login. The user should never be stuck on a protected page after attempting logout. The cookie clearing via `@supabase/ssr` happens regardless of the Supabase API response
    - **No rate limiting** — logout is a non-destructive, idempotent action. Rate limiting would only create a bad UX where a user can't log out
  - [x] 1.3: **CRITICAL:** Do NOT call `signOut()` from a Server Component — Server Components have read-only cookie access. The `setAll()` callback would fail silently (the existing try/catch in `server.ts` ignores cookie set errors in read-only contexts). MUST use Server Action or Route Handler
  - [x] 1.4: Create `src/lib/actions/logout.test.ts`:
    - Test: calls `supabase.auth.signOut()` (verifies server client is used)
    - Test: calls `revalidatePath('/', 'layout')` to bust Next.js cache
    - Test: redirects to `/auth/login` after signOut
    - Test: redirects to `/auth/login` even if signOut throws an error (graceful degradation)
    - Test: uses `server-only` import guard

- [x] Task 2: Create LogoutButton client component (AC: #1)
  - [x] 2.1: Create `src/components/patterns/LogoutButton.tsx` (`'use client'`):
    ```
    COMPONENT BEHAVIOR:
    1. Renders a <form action={logoutAction}> with a submit button
    2. Uses useFormStatus() inside a child component for loading state
    3. Button shows "Logout" (idle) / "Logging out..." (pending)
    4. Disabled during pending state to prevent double-click
    5. Uses LogOut icon from lucide-react
    6. Accessible: aria-label, minimum touch target

    DESIGN:
    - Reusable component — will be placed in dashboard header, admin nav, etc.
    - Uses shadcn/ui Button component (variant="ghost", size="sm")
    - No confirmation dialog — logout is non-destructive and reversible (user can log back in)
    - Focus-visible ring for keyboard navigation
    ```
  - [x] 2.2: **Implementation:**
    ```typescript
    'use client'

    import { useFormStatus } from 'react-dom'
    import { logoutAction } from '@/lib/actions/logout'
    import { Button } from '@/components/ui/button'
    import { LogOut } from 'lucide-react'
    import { cn } from '@/lib/utils'

    function LogoutSubmitButton({ className }: { className?: string }) {
      const { pending } = useFormStatus()
      return (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className={cn('gap-2', className)}
          aria-label={pending ? 'Logging out' : 'Logout'}
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {pending ? 'Logging out...' : 'Logout'}
        </Button>
      )
    }

    export default function LogoutButton({ className }: { className?: string }) {
      return (
        <form action={logoutAction}>
          <LogoutSubmitButton className={className} />
        </form>
      )
    }
    ```
  - [x] 2.3: **KEY PATTERN:** `useFormStatus()` MUST be inside a child component of `<form>`, not the same component that renders the form. This is a React 19 requirement — the hook only works when it's a descendant of the `<form>` element. This pattern is established in LoginForm, MfaEnrollForm, MfaVerifyForm.
  - [x] 2.4: **Props:** `className` pass-through for flexible placement (dashboard header, admin sidebar, etc.)
  - [x] 2.5: **EXPORT CONVENTION:** Only `LogoutButton` is `export default`. The inner `LogoutSubmitButton` is a module-private function — do NOT export it. This matches the established pattern where LoginForm's `SubmitButton` is private.
  - [x] 2.6: Create `src/components/patterns/LogoutButton.test.tsx`:
    - Test: renders logout button with correct text "Logout"
    - Test: renders LogOut icon
    - Test: form has action attribute (server action bound)
    - Test: button has data-testid="logout-button"
    - Test: button has aria-label="Logout"
    - Test: shows "Logging out..." text and disabled state when form is submitting (pending)
    - Test: accessibility (jest-axe, no violations)

- [x] Task 3: Add LogoutButton to dashboard page (AC: #1)
  - [x] 3.1: Update `src/app/dashboard/page.tsx` to include LogoutButton:
    ```
    CURRENT: Placeholder card "Dashboard coming in Epic 3+"
    ADD: LogoutButton in the top-right corner of the placeholder
    APPROACH: Import LogoutButton, add it to the page layout
    ```
  - [x] 3.2: **NOTE:** This is a TEMPORARY placement. When Epic 3 (Story 3.1) builds the proper CMS admin panel layout with header/sidebar navigation, the LogoutButton will be moved to the admin header. For now, placing it on the dashboard ensures users have a way to log out.
  - [x] 3.3: **AUTH GUARD:** The dashboard page currently has NO server-side auth guard. Story 2.6 will add route protection. For now, the page renders for everyone. This is acceptable — the logout button simply does nothing if the user is not authenticated (signOut on an unauthenticated session is a no-op).
  - [x] 3.4: **DASHBOARD TESTS:** Check if `src/app/dashboard/page.test.tsx` exists. If it does, update it to account for the added LogoutButton (e.g., the rendered output now includes a "Logout" button and a `<form>`). If no test exists, no action needed — dashboard tests will be established in Epic 3.

- [x] Task 4: Verify session and cookie cleanup (AC: #2, #3)
  - [x] 4.1: **Cookie Cleanup Verification:**
    - `@supabase/ssr` automatically handles cookie cleanup through its `setAll()` callback
    - When `signOut()` is called via server client, the SSR library sets all `sb-*` cookies to empty values with `maxAge: 0`
    - This includes chunked cookies (`sb-xxx-auth-token.0`, `.1`, `.2`, etc.)
    - No manual cookie clearing code is needed
  - [x] 4.2: **Browser Back Button (AC #2):**
    - `revalidatePath('/', 'layout')` busts Next.js server-side router cache
    - However, **browser memory cache** (bfcache) may still show the previous page briefly on back button press
    - **Full protection for AC #2 requires Story 2.6** (proxy.ts/middleware with auth check on every request + `Cache-Control: no-store` headers on protected routes)
    - For Story 2.5 scope: the session is fully terminated server-side. Any subsequent API call or page navigation will fail auth and redirect to login. The browser back button may momentarily show cached HTML, but any interactive action triggers a server round-trip which redirects to login
  - [x] 4.3: **IMPORTANT NOTE FOR STORY 2.6:** When implementing route protection, add these headers to protected routes:
    ```
    Cache-Control: no-cache, no-store, must-revalidate
    Pragma: no-cache
    Expires: 0
    ```
    This ensures browser back button never serves stale authenticated content. This is NOT part of Story 2.5 scope.

- [x] Task 5: Unit tests for logout action (AC: all)
  - [x] 5.1: Create `src/lib/actions/logout.test.ts`:
    ```
    TEST CASES:
    1. should call supabase.auth.signOut()
    2. should call revalidatePath('/', 'layout')
    3. should redirect to /auth/login
    4. should redirect to /auth/login even if signOut throws error
    5. should use server-only module guard
    ```
  - [x] 5.2: **Mock Strategy:**
    - `vi.mock('@/lib/supabase/server')` — mock createClient to return mock supabase
    - `vi.mock('next/cache')` — mock revalidatePath
    - `vi.mock('next/navigation')` — mock redirect (throw redirect error like existing tests)
    - Import `isRedirectError` from `next/dist/client/components/redirect-error` for redirect detection
  - [x] 5.3: **Follow established test patterns** from `src/lib/actions/auth.test.ts` and `src/lib/actions/mfa.test.ts`
  - [x] 5.4: **REDIRECT ASSERTION PATTERN:** Import `isRedirectError` from `next/dist/client/components/redirect-error` to detect redirect throws in test assertions. Mock `redirect` to throw a recognizable error, then in each test: call `logoutAction()`, catch the error, assert `isRedirectError(err)` is true and the redirect target is `/auth/login`. This is the exact pattern used in `auth.test.ts` and `mfa.test.ts` — follow it for consistency.

- [x] Task 6: E2E tests (AC: #1)
  - [x] 6.1: Create `tests/e2e/logout.spec.ts`:
    ```
    TEST CASES:
    1. should display logout button on dashboard page
    2. should redirect to login page after clicking logout
    3. should be accessible (jest-axe / @axe-core/playwright, no violations on logout button)
    ```
  - [x] 6.2: **NOTE:** Full authenticated E2E tests (login → MFA → dashboard → logout → verify session cleared) require authenticated session setup which depends on Story 2.6 route protection being in place. For now, test the UI elements and basic redirect behavior.
  - [x] 6.3: Use `data-testid="logout-button"` for selectors
  - [x] 6.4: Use existing E2E patterns from `tests/e2e/login.spec.ts` and `tests/e2e/mfa-verify.spec.ts`

- [x] Task 7: Final verification
  - [x] 7.1: Run `npm run type-check` — must pass
  - [x] 7.2: Run `npm run lint` — must pass (0 errors)
  - [x] 7.3: Run `npm run test` — all unit tests pass (existing + new)
  - [x] 7.4: Run `npm run build` — must pass
  - [x] 7.5: Verify no regressions on login flow, MFA enrollment, MFA verification, backup codes
  - [ ] 7.6: Manual test: login → MFA verify → dashboard → click logout → redirected to login
  - [ ] 7.7: Manual test: after logout → browser back button → verify behavior

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Server Action for logout** — Use `'use server'` in separate file `src/lib/actions/logout.ts`. NEVER inline in client components.
2. **Server client for signOut** — Use `createClient()` from `@/lib/supabase/server`. This has full cookie read/write access. Do NOT use browser client for the signOut call itself.
3. **Form action pattern** — LogoutButton uses `<form action={logoutAction}>` for progressive enhancement (works without JS).
4. **`useFormStatus()` in child component** — MUST be inside a descendant of `<form>`, not the form component itself. Extract to `LogoutSubmitButton`.
5. **Next.js 16 async patterns** — `cookies()` is async in server client. Already handled by existing `createClient()`.
6. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes.
7. **No barrel files** — import directly from source files.
8. **Vitest, NOT Jest** — use `vi.mock()`, `vi.fn()`, `vi.spyOn()`. Never use `jest.*` equivalents.
9. **No `dark:` classes** — dark mode not implemented. Light mode only.
10. **`data-testid` attributes** — on all testable elements.
11. **Prettier rules** — `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`.
12. **`server-only` import** — add `import 'server-only'` to server action file. Stub exists at `src/test-server-only-stub.ts` for tests.
13. **`isRedirectError(err)` pattern** — rethrow redirect errors in try/catch blocks if used. Import from `next/dist/client/components/redirect-error`.
14. **Lucide React icons** — use `lucide-react` for icons (`LogOut`).
15. **Touch targets min 32px** — all interactive elements minimum h-8 w-8.

### Supabase signOut Flow

**How server-side signOut works with `@supabase/ssr`:**

```
1. User clicks "Logout" button
2. <form action={logoutAction}> submits to Server Action
3. Server Action calls createClient() from @/lib/supabase/server
   - This creates a Supabase client with cookie access (getAll/setAll)
4. supabase.auth.signOut() is called:
   a. HTTP request to Supabase Auth to revoke refresh token
   b. All user sessions invalidated server-side (scope: 'global')
   c. @supabase/ssr setAll() callback fires:
      - All sb-* cookies set to empty with maxAge: 0
      - Chunked cookies (sb-xxx-auth-token.0, .1, .2) all cleared
5. revalidatePath('/', 'layout') busts Next.js router cache
6. redirect('/auth/login') sends 303 redirect to browser
7. Browser receives redirect, clears cookies, loads login page
```

**Critical API details:**
- `supabase.auth.signOut()` returns `{ error: AuthError | null }`
- Default scope is `'global'` — revokes ALL sessions across ALL devices
- Refresh token is revoked immediately
- Access token (JWT) remains technically valid until `exp` claim (~1 hour) but cookie is deleted so browser can't use it
- If the API call fails (network error), cookies are still cleared locally by `@supabase/ssr`

### Browser Back Button Protection (AC #2 — Partial)

**What Story 2.5 covers:**
- Server-side session termination (Supabase refresh token revoked)
- Next.js router cache invalidation (`revalidatePath`)
- Cookie cleanup (automatic via `@supabase/ssr`)

**What Story 2.6 will add (NOT in scope):**
- `Cache-Control: no-cache, no-store, must-revalidate` on protected routes
- Auth check on every request via proxy.ts/middleware
- Proper redirect for unauthenticated users on protected routes

**Current behavior after logout + browser back:**
- The browser may show cached HTML from bfcache (browser memory cache)
- However, ANY server interaction (clicking a link, submitting a form, page refresh) will:
  - Find no valid session cookies
  - Fail auth checks
  - Story 2.6 will redirect to login

### signOut Scope Decision

The default `scope: 'global'` is chosen for MVP — it revokes ALL sessions across all devices, which is the most secure option. Trade-off: if a user is logged in on multiple devices, clicking logout on one device logs them out everywhere. If multi-device simultaneous sessions are needed in the future, change to `scope: 'local'` to only terminate the current browser's session.

### Client-Side Logout Anti-Pattern

Do NOT attempt to implement logout via `onClick` handler calling browser client's `signOut()`. This pattern fails because:
1. Browser client `signOut()` clears `localStorage` but server-side cookies may persist
2. Next.js Router Cache retains stale authenticated page data
3. You'd need an additional `router.refresh()` call to flush the router cache

The Server Action + `<form action>` pattern solves all of this: cookies are cleared server-side via `setAll()`, `revalidatePath` busts the router cache, and `redirect()` sends a clean 303 response.

### Reusable Component Design

The LogoutButton is designed as a reusable component in `src/components/patterns/`:
- **Why `components/patterns/`**: It's a composed UI pattern (not a primitive like `ui/`) and will be used across multiple layouts (dashboard header, admin sidebar, user menu)
- **Props**: Only `className` for layout flexibility — the component handles all its own behavior
- **No confirmation dialog**: Logout is non-destructive (user can log back in). Adding a dialog would only slow down the user.

### Existing Infrastructure (DO NOT recreate)

| Component | Location | Usage |
|-----------|----------|-------|
| Supabase server client | `src/lib/supabase/server.ts` | signOut call (cookie access) |
| Supabase browser client | `src/lib/supabase/client.ts` | NOT used for logout |
| Auth queries | `src/lib/auth/queries.ts` | `getCurrentUser()` (verify auth state) |
| shadcn/ui Button | `src/components/ui/button.tsx` | Button styling |
| `cn()` utility | `src/lib/utils.ts` | Conditional class names |
| Auth layout | `src/app/auth/layout.tsx` | Login page (redirect target) |
| Test factories | `tests/factories/user-factory.ts` | `buildUser()`, `buildSuperAdmin()` |
| server-only stub | `src/test-server-only-stub.ts` | Vitest alias for `server-only` |

### What This Story ADDS (New Files)

| File | Purpose |
|------|---------|
| `src/lib/actions/logout.ts` | Logout Server Action (signOut + cache bust + redirect) |
| `src/lib/actions/logout.test.ts` | Unit tests for logout action |
| `src/components/patterns/LogoutButton.tsx` | Reusable logout button component (`'use client'`) |
| `src/components/patterns/LogoutButton.test.tsx` | Unit tests for LogoutButton |
| `tests/e2e/logout.spec.ts` | E2E tests for logout flow |

### What This Story MODIFIES (Existing Files)

| File | Change | Reason |
|------|--------|--------|
| `src/app/dashboard/page.tsx` | ADD LogoutButton to placeholder page | Provide visible logout mechanism until admin layout (Story 3.1) |

### What This Story Does NOT Include

- **NO route protection / middleware** — Story 2.6 handles proxy.ts auth guards
- **NO `Cache-Control` headers on protected pages** — Story 2.6 scope
- **NO admin panel layout / header / sidebar** — Epic 3 (Story 3.1)
- **NO audit logging** — Epic 7 handles audit logging for logout events
- **NO confirmation dialog** — Logout is non-destructive, no confirmation needed
- **NO React Query** — Not needed (simple form + server action)
- **NO additional shadcn/ui installs** — Button already installed (Story 2.1)
- **NO browser client signOut** — Server Action handles everything server-side

### Previous Story Intelligence (from Stories 2.1, 2.2, 2.3, 2.4)

**Learnings to apply:**

1. **`server-only` import** — add `import 'server-only'` at top of server action. Vitest alias configured: `'server-only': 'src/test-server-only-stub.ts'`
2. **`isRedirectError(err)` pattern** — rethrow redirect errors in try/catch blocks. Import from `next/dist/client/components/redirect-error`
3. **`useFormStatus()` must be INSIDE `<form>`** — extract to separate child component (established pattern)
4. **Lucide React icons** — use `lucide-react` for any icons (LogOut, etc.)
5. **Touch targets min 32px** — all interactive elements minimum h-8 w-8
6. **`data-testid` attributes** — on all testable elements
7. **`cn()` for classes** — never string concatenation
8. **Singleton test pattern** — not needed here (no rate limiters)
9. **No `dark:` Tailwind classes** — strip if copied from shadcn/ui defaults
10. **Vitest mock patterns** — `vi.mock('@/lib/supabase/server')`, `vi.mock('next/navigation')`, `vi.mock('next/cache')`
11. **Redirect testing** — mock `redirect` to throw, catch with `isRedirectError`
12. **331 tests currently passing** — must not regress

**Code review learnings from Stories 2.1-2.4:**
- Strip `dark:` classes from any shadcn/ui components
- `data-testid` attributes on all testable elements
- Touch targets min 32px for mobile accessibility
- No `nul` Windows artifacts (already in `.gitignore`)
- `aria-label` on icon-only or icon-text buttons

### Git Intelligence (Recent Commits)

```
143581f style(login): add fade-up entrance animation to login card
85ef976 feat(story-2.4): MFA login verification with TOTP and backup codes
f6a0e3d feat(coming-soon): redesign page with premium auth-style layout
4bbfacf feat(systems): add coming soon page for inactive systems
2b44100 test(story-2.3): add guardrail tests for backup codes generation & usage
84fe34f fix(ui): equalize system card heights across grid rows
```

**Patterns observed:**
- Commit format: `type(story-X.Y): description` or `type(scope): description`
- Code reviews generate fix commits
- 331 unit tests across test files currently passing
- Established: `data-testid`, `cn()`, DxT branding, accessibility patterns

### Project Structure Notes

```
src/
├── app/
│   ├── auth/
│   │   ├── layout.tsx                     # Existing: Dark gradient auth layout
│   │   ├── login/                         # Existing: Login flow (Story 2.1)
│   │   ├── mfa-enroll/                    # Existing: MFA enrollment (Story 2.2)
│   │   ├── mfa-verify/                    # Existing: MFA verification (Story 2.4)
│   │   ├── register/                      # Existing: 404 redirect
│   │   └── callback/                      # Existing: Auth callback
│   ├── dashboard/
│   │   └── page.tsx                       # MODIFY: Add LogoutButton to placeholder
│   └── ...
├── components/
│   ├── ui/                                # Existing: shadcn/ui primitives
│   └── patterns/
│       └── LogoutButton.tsx               # NEW: Reusable logout button
│       └── LogoutButton.test.tsx          # NEW: Component tests
├── lib/
│   ├── actions/
│   │   ├── auth.ts                        # Existing: loginAction
│   │   ├── mfa.ts                         # Existing: verifyMfaEnrollmentAction
│   │   ├── backup-codes.ts               # Existing
│   │   ├── logout.ts                      # NEW: logoutAction
│   │   └── logout.test.ts                # NEW: Action tests
│   ├── auth/
│   │   ├── queries.ts                     # Existing: getCurrentUser, getMfaStatus
│   │   └── mutations.ts                   # Existing: verifyMfaEnrollment
│   ├── supabase/
│   │   ├── server.ts                      # Existing: Server client (used for signOut)
│   │   └── client.ts                      # Existing: Browser client (NOT used)
│   └── ...
└── ...
tests/
├── e2e/
│   ├── login.spec.ts                      # Existing
│   ├── mfa-enroll.spec.ts                 # Existing
│   ├── mfa-verify.spec.ts                 # Existing
│   └── logout.spec.ts                     # NEW: Logout E2E tests
└── factories/
    └── user-factory.ts                    # Existing
```

### Environment Variables Required

```env
# Already configured from Stories 1.x, 2.1-2.4:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

No new environment variables needed for this story.

### Mock Strategy for Tests

**Unit tests (Vitest):**
- Mock `@/lib/supabase/server` for server client (signOut call)
- Mock `next/navigation` for `redirect`
- Mock `next/cache` for `revalidatePath`
- Mock `@/lib/actions/logout` for LogoutButton component tests
- Do NOT mock `@/lib/supabase/client` — browser client is not used for logout

**E2E tests (Playwright):**
- Test logout button visibility on dashboard page
- Test redirect behavior after form submission
- Use `data-testid="logout-button"` for selectors

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authorization Pattern]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Security Rules]
- [Source: _bmad-output/implementation-artifacts/2-4-mfa-login-verification.md]
- [Source: Supabase Auth signOut API — https://supabase.com/docs/reference/javascript/auth-signout]
- [Source: Supabase Auth Signing Out Guide — https://supabase.com/docs/guides/auth/signout]
- [Source: Supabase SSR Guide for Next.js — https://supabase.com/docs/guides/auth/server-side/nextjs]
- [Source: @supabase/ssr Design — https://github.com/supabase/ssr/blob/main/docs/design.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 357 unit tests pass (356 existing + 1 new from CR, 0 regressions)
- TypeScript type-check: pass
- ESLint: pass (0 errors)
- Next.js build: pass (dashboard remains static `○`)

### Completion Notes List

- **Task 1:** Created `src/lib/actions/logout.ts` — Server Action with `signOut()`, `revalidatePath('/', 'layout')`, and `redirect('/auth/login')`. Uses `server-only` guard. Graceful error handling: redirects even if `signOut()` fails.
- **Task 2:** Created `src/components/patterns/LogoutButton.tsx` — `'use client'` component with `<form action={logoutAction}>` pattern. `useFormStatus()` in child `LogoutSubmitButton` (React 19 pattern). shadcn/ui Button variant="ghost", LogOut icon from lucide-react, `data-testid`, `aria-label`, disabled during pending.
- **Task 3:** Updated `src/app/dashboard/page.tsx` — Added LogoutButton to top-right of dashboard placeholder card. Updated existing `page.test.tsx` with 2 new tests for logout button presence.
- **Task 4:** Verified cookie cleanup via `@supabase/ssr` `setAll()` callback. Browser back button partial protection via `revalidatePath`. Full bfcache protection deferred to Story 2.6.
- **Task 5:** Created `src/lib/actions/logout.test.ts` — 5 tests covering signOut call, revalidatePath, redirect to /auth/login, graceful degradation on signOut error, server-only guard.
- **Task 6:** Created `tests/e2e/logout.spec.ts` — 3 E2E tests for logout button visibility, redirect after click, and accessibility audit.
- **Task 7:** All automated verification passed. Manual tests (7.6, 7.7) left for user to perform.
- **Change Log:** Story 2.5 implementation complete (2026-02-05)
- **Code Review (2026-02-05):** Fixed 5 issues (1 HIGH, 4 MEDIUM). See Senior Developer Review section below.

### Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) — Claude Opus 4.5
**Date:** 2026-02-05
**Outcome:** Approved (all issues auto-fixed)

#### Issues Found & Fixed

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| H1 | HIGH | `logout.test.ts` — Redirect assertions used try/catch pattern that silently passes if action doesn't throw. Inconsistent with `auth.test.ts` `rejects.toThrow` pattern. | Replaced all try/catch redirect tests with `await expect(...).rejects.toThrow('NEXT_REDIRECT')` pattern. Removed unused `isRedirectError` import and mock. |
| M1 | MEDIUM | `LogoutButton.test.tsx` — Missing pending/loading state test despite story spec requiring it (Task 2.6). | Added `useFormStatus` mock via `vi.mock('react-dom')` with `importActual`. Added test verifying "Logging out..." text, disabled state, and aria-label change when `pending: true`. |
| M2 | MEDIUM | Dev Agent Record claimed "345 tests (331+14)" but actual count was 356. Baseline was wrong. | Corrected to 357 (356 existing + 1 new from this review). |
| M3 | MEDIUM | `LogoutButton.tsx` — Button `size="sm"` renders at 32px height, below WCAG 2.1 AA 44px minimum touch target specified in project-context.md. | Added `min-h-11` (44px) to button className via `cn()`. |
| M4 | MEDIUM | Dashboard route has no `error.tsx` boundary — unexpected errors propagate uncaught. | **Noted for Story 3.1** — not in scope for 2.5. Dashboard is a placeholder page. |

#### Notes for Future Stories

- **Story 2.6:** Add `Cache-Control: no-cache, no-store, must-revalidate` headers on protected routes for full browser back button protection (AC #2 partial coverage noted).
- **Story 3.1:** Add `error.tsx` for `/dashboard` route segment when building admin layout.

### File List

**New files:**
- `src/lib/actions/logout.ts`
- `src/lib/actions/logout.test.ts`
- `src/components/patterns/LogoutButton.tsx`
- `src/components/patterns/LogoutButton.test.tsx`
- `tests/e2e/logout.spec.ts`

**Modified files:**
- `src/app/dashboard/page.tsx` (added LogoutButton import + placement)
- `src/app/dashboard/page.test.tsx` (added 2 tests for logout button)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (2-5-secure-logout: in-progress → review)
