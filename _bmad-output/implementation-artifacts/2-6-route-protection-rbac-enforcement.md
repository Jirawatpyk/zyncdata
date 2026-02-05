# Story 2.6: Route Protection & RBAC Enforcement

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system administrator,
I want role-based access control enforced on all protected routes,
So that users can only access features appropriate to their role.

## Acceptance Criteria

1. **Given** I am not authenticated **When** I try to access any `/dashboard` or `/admin` route **Then** I am redirected to the login page via Next.js proxy

2. **Given** I am authenticated with the "User" role **When** I try to access `/admin` routes **Then** I am redirected to an unauthorized page

3. **Given** I am authenticated with the "Admin" role **When** I access CMS management routes **Then** I can access system management, content editing, and analytics **And** I cannot access user management or audit logs

4. **Given** I am authenticated with the "Super Admin" role **When** I access any protected route **Then** I have full access to all features

5. **Given** any API endpoint is called **When** the request is processed **Then** user permissions are validated against the RBAC matrix before executing the operation

6. **Given** security headers are configured **When** any page is served **Then** responses include CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy headers

## Tasks / Subtasks

**Dependency: Stories 2.1-2.5 must be complete. All confirmed done.**

- [x] Task 1: Create Supabase proxy client (AC: #1)
  - [x] 1.1: Create `src/lib/supabase/proxy.ts`:
    ```typescript
    import { createServerClient } from '@supabase/ssr'
    import { NextResponse } from 'next/server'
    import type { NextRequest } from 'next/server'

    export async function updateSession(request: NextRequest) {
      let supabaseResponse = NextResponse.next({ request })

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value),
              )
              supabaseResponse = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options),
              )
            },
          },
        },
      )

      // CRITICAL: Use getUser(), NOT getSession()
      // getUser() validates JWT via Supabase Auth server
      // getSession() reads from cookie and can be spoofed
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Public routes that don't require authentication
      const publicPaths = ['/', '/auth', '/coming-soon']
      const isPublicPath = publicPaths.some(
        (path) =>
          request.nextUrl.pathname === path ||
          request.nextUrl.pathname.startsWith(`${path}/`),
      )

      if (!user && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      // Add Cache-Control headers for protected routes
      // Prevents browser back button showing cached authenticated pages after logout
      if (!isPublicPath && user) {
        supabaseResponse.headers.set(
          'Cache-Control',
          'no-cache, no-store, must-revalidate',
        )
        supabaseResponse.headers.set('Pragma', 'no-cache')
        supabaseResponse.headers.set('Expires', '0')
      }

      // MUST return supabaseResponse — contains refreshed cookies
      return supabaseResponse
    }
    ```
  - [x] 1.2: **DESIGN DECISIONS:**
    - **Separate `proxy.ts` client** — uses `NextRequest`/`NextResponse` cookie API (different from server client which uses `next/headers` cookies). These are incompatible patterns — cannot share a single factory.
    - **`getUser()` not `getSession()`** — `getSession()` reads from cookies which can be spoofed. `getUser()` validates the JWT against the Supabase Auth server. This is the #1 security gotcha.
    - **Public path allowlist** — `/`, `/auth/*`, `/coming-soon` are public. Everything else requires authentication.
    - **Cache-Control headers** — `no-cache, no-store, must-revalidate` prevents browser bfcache from showing stale authenticated pages after logout (completes Story 2.5 AC#2 partial protection).
    - **Always return `supabaseResponse`** — This response contains refreshed session cookies. If you return a different response, browser and server cookies desync — silent auth failures.
  - [x] 1.3: Create `src/lib/supabase/proxy.test.ts`:
    - Test: redirects unauthenticated user from `/dashboard` to `/auth/login`
    - Test: redirects unauthenticated user from `/admin/systems` to `/auth/login`
    - Test: allows unauthenticated user to access `/` (public)
    - Test: allows unauthenticated user to access `/auth/login` (public)
    - Test: allows unauthenticated user to access `/coming-soon` (public)
    - Test: allows authenticated user to access `/dashboard`
    - Test: sets Cache-Control headers on protected routes for authenticated users
    - Test: does NOT set Cache-Control headers on public routes
    - Test: returns supabaseResponse with cookies intact

- [x] Task 2: Update proxy.ts with session management (AC: #1)
  - [x] 2.1: Update `src/proxy.ts`:
    ```typescript
    import { updateSession } from '@/lib/supabase/proxy'
    import type { NextRequest } from 'next/server'

    export async function proxy(request: NextRequest) {
      return await updateSession(request)
    }

    export const config = {
      matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      ],
    }
    ```
  - [x] 2.2: **KEY CHANGE:** Replace the TODO placeholder with actual `updateSession()` call. Add `sitemap.xml` and `robots.txt` to matcher exclusions.
  - [x] 2.3: **RUNTIME NOTE:** `proxy.ts` in Next.js 16 runs Node.js runtime only (not Edge). This is fine — Upstash Redis works in Node.js. No `export const runtime = 'edge'` needed.

- [x] Task 3: Create auth guard with RBAC (AC: #2, #3, #4, #5)
  - [x] 3.1: Create `src/lib/auth/guard.ts`:
    ```typescript
    import { redirect } from 'next/navigation'
    import { createClient } from '@/lib/supabase/server'
    import type { User } from '@supabase/supabase-js'

    export type Role = 'super_admin' | 'admin' | 'user'

    export interface AuthResult {
      user: User
      role: Role
    }

    const ROLE_HIERARCHY: Record<Role, number> = {
      user: 1,
      admin: 2,
      super_admin: 3,
    }

    /**
     * Server-side auth guard for layout components.
     * Validates user authentication and optionally enforces minimum role.
     *
     * @param minimumRole - Minimum role required to access the route
     * @returns AuthResult with user and role
     * @throws Redirects to /auth/login if not authenticated
     * @throws Redirects to /unauthorized if insufficient role
     */
    export async function requireAuth(minimumRole?: Role): Promise<AuthResult> {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        redirect('/auth/login')
      }

      // Verify MFA is complete (AAL2) — prevents bypassing MFA by navigating directly
      // A user at AAL1 (password only, MFA not verified) should not access protected routes
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        redirect('/auth/mfa-verify')
      }

      const role = (user.app_metadata?.role as Role) ?? 'user'

      if (minimumRole && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minimumRole]) {
        redirect('/unauthorized')
      }

      return { user, role }
    }

    /**
     * Check if a role meets the minimum requirement without redirecting.
     * Useful for conditional UI rendering in Server Components.
     */
    export function hasMinimumRole(currentRole: Role, minimumRole: Role): boolean {
      return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minimumRole]
    }
    ```
  - [x] 3.2: **DESIGN DECISIONS:**
    - **`requireAuth()` uses `redirect()`** from `next/navigation` — throws a redirect error that Next.js handles. No explicit return needed for the error path.
    - **MFA AAL2 enforcement** — after checking `getUser()`, the guard also checks `getAuthenticatorAssuranceLevel()`. If user is at AAL1 (password done, MFA pending), they're redirected to `/auth/mfa-verify`. This prevents bypassing MFA by manually navigating to `/dashboard` after password-only login. Uses the same `getMfaStatus()` pattern from `src/lib/auth/queries.ts`.
    - **Role stored in `app_metadata.role`** — set by Supabase Admin API during user creation. Regular users cannot modify `app_metadata`.
    - **Fallback to `'user'` role** — if `app_metadata.role` is missing, default to lowest privilege.
    - **`hasMinimumRole()` utility** — for conditional rendering without redirect (e.g., show/hide admin-only buttons within shared components).
    - **Type exported** — `Role` and `AuthResult` types exported for use across the app.
    - **Request-level caching** — child pages that also need `{ user, role }` can call `requireAuth()` again cheaply. Supabase `getUser()` responses are deduplicated by Next.js `React.cache()` within the same request. No double-fetch overhead.
  - [x] 3.3: Create `src/lib/auth/guard.test.ts`:
    - Test: returns user and role when authenticated (AAL2 complete)
    - Test: redirects to `/auth/login` when not authenticated (getUser returns null)
    - Test: redirects to `/auth/login` when getUser returns error
    - Test: redirects to `/auth/mfa-verify` when user is at AAL1 (MFA not yet verified)
    - Test: allows access when user is at AAL2 (MFA verified)
    - Test: redirects to `/unauthorized` when role is below minimum (user tries admin route)
    - Test: allows access when role meets minimum (admin on admin route)
    - Test: allows access when role exceeds minimum (super_admin on admin route)
    - Test: defaults role to 'user' when app_metadata.role is missing
    - Test: `hasMinimumRole()` returns correct boolean for all role combinations
    - Mock strategy: `vi.mock('@/lib/supabase/server')`, `vi.mock('next/navigation')`

- [x] Task 4: Create unauthorized page (AC: #2)
  - [x] 4.1: Create `src/app/unauthorized/page.tsx`:
    ```
    COMPONENT BEHAVIOR:
    1. Server Component (no 'use client')
    2. Displays "Access Denied" heading
    3. Shows message: "You don't have permission to access this page."
    4. Provides TWO navigation links (via next/link):
       a. "Go to Dashboard" — for authenticated users redirected due to insufficient role
       b. "Go to Login" — fallback for users whose session may have expired
    5. Uses DxT branding and existing auth layout style
    6. Metadata: title "Unauthorized | zyncdata"

    DESIGN:
    - Simple, clean layout matching auth pages
    - ShieldAlert icon from lucide-react
    - Centered card layout
    - Accessible: proper heading hierarchy, link semantics
    - Dashboard link is primary action, Login link is secondary/muted
    ```
  - [x] 4.2: Create `src/app/unauthorized/page.test.tsx`:
    - Test: renders "Access Denied" heading
    - Test: renders permission message
    - Test: renders link to dashboard
    - Test: renders link to login page
    - Test: accessibility (jest-axe, no violations)

- [x] Task 5: Add auth guard to dashboard layout (AC: #1)
  - [x] 5.1: Create `src/app/dashboard/layout.tsx`:
    ```typescript
    import { requireAuth } from '@/lib/auth/guard'

    export default async function DashboardLayout({
      children,
    }: {
      children: React.ReactNode
    }) {
      // Any authenticated user can access dashboard
      await requireAuth()

      return <>{children}</>
    }
    ```
  - [x] 5.2: **NOTE:** Dashboard requires any authenticated user (no minimum role). The `requireAuth()` call without arguments validates authentication only.
  - [x] 5.3: Create `src/app/dashboard/layout.test.tsx`:
    - Test: calls requireAuth() without role parameter
    - Test: renders children when authenticated
    - Mock: `vi.mock('@/lib/auth/guard')`

- [x] Task 6: Add auth guard to admin layout (AC: #2, #3, #4)
  - [x] 6.1: Create `src/app/admin/layout.tsx`:
    ```typescript
    import { requireAuth } from '@/lib/auth/guard'

    export default async function AdminLayout({
      children,
    }: {
      children: React.ReactNode
    }) {
      // Admin or Super Admin can access admin panel
      await requireAuth('admin')

      return <>{children}</>
    }
    ```
  - [x] 6.2: **NOTE:** This enforces `admin` minimum role. Users with `user` role are redirected to `/unauthorized`. When Epic 3 builds the proper admin panel layout with sidebar/header, this guard will be preserved in the layout.
  - [x] 6.3: Create `src/app/admin/layout.test.tsx`:
    - Test: calls requireAuth('admin')
    - Test: renders children when role is admin
    - Test: renders children when role is super_admin
    - Mock: `vi.mock('@/lib/auth/guard')`

- [x] Task 7: Create placeholder admin pages for RBAC testing (AC: #3, #4)
  - [x] 7.1: Create `src/app/admin/page.tsx` (placeholder admin dashboard):
    ```
    Server Component. Shows "Admin Panel" heading.
    Placeholder text: "Admin features coming in Epic 3+"
    Includes LogoutButton for navigation.
    Metadata: title "Admin | zyncdata"
    ```
  - [x] 7.2: **NOTE:** Super Admin-only routes (`/admin/users`, `/admin/audit`) will get their own nested layouts with `requireAuth('super_admin')` when those features are built in Epic 6 and Epic 7 respectively. For now, the `/admin` layout with `requireAuth('admin')` is sufficient.
  - [x] 7.3: Create `src/app/admin/page.test.tsx`:
    - Test: renders admin panel heading
    - Test: renders LogoutButton
    - Test: accessibility (jest-axe, no violations)

- [x] Task 8: Tighten CSP headers (AC: #6)
  - [x] 8.1: Update `next.config.ts` security headers:
    ```
    CHANGES:
    1. Remove the "SECURITY ROADMAP: Tighten in Story 2.6" comment
    2. Add frame-ancestors 'none' (replaces X-Frame-Options in modern browsers)
    3. Add object-src 'none'
    4. Add base-uri 'self'
    5. Add form-action 'self'
    6. Keep unsafe-eval and unsafe-inline for Next.js compatibility (required for dev mode and production RSC)
    7. Add Permissions-Policy header to restrict unused browser features
    ```
  - [x] 8.2: **CRITICAL:** Do NOT remove `unsafe-eval` and `unsafe-inline` from script-src. Next.js requires these for:
    - `unsafe-eval`: Development mode hot reload
    - `unsafe-inline`: React Server Components runtime inline scripts
    - Removing them will break the app in production.
  - [x] 8.3: Add `Permissions-Policy` header:
    ```
    camera=(), microphone=(), geolocation=(), interest-cohort=()
    ```
    This disables unused browser features for security hardening.

- [x] Task 9: Create `requireApiAuth` guard for API routes (AC: #5)
  - [x] 9.1: Add to `src/lib/auth/guard.ts`:
    ```typescript
    import { NextResponse } from 'next/server'
    import { ErrorCode } from '@/lib/errors/codes'

    /**
     * API route auth guard. Returns user/role or error response.
     * Unlike requireAuth(), this does NOT redirect — returns JSON error.
     *
     * @param minimumRole - Minimum role required
     * @returns AuthResult or NextResponse with error
     */
    export async function requireApiAuth(
      minimumRole?: Role,
    ): Promise<AuthResult | NextResponse> {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json(
          { data: null, error: { message: 'Unauthorized', code: ErrorCode.UNAUTHORIZED } },
          { status: 401 },
        )
      }

      const role = (user.app_metadata?.role as Role) ?? 'user'

      if (minimumRole && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minimumRole]) {
        return NextResponse.json(
          { data: null, error: { message: 'Forbidden', code: ErrorCode.FORBIDDEN } },
          { status: 403 },
        )
      }

      return { user, role }
    }

    /**
     * Type guard to check if requireApiAuth result is an error response.
     */
    export function isAuthError(
      result: AuthResult | NextResponse,
    ): result is NextResponse {
      return result instanceof NextResponse
    }
    ```
  - [x] 9.2: **DESIGN DECISIONS:**
    - **Returns `NextResponse` instead of redirecting** — API routes should return JSON errors, not HTML redirects.
    - **Standard `{ data, error }` format** — consistent with project `ApiResponse<T>` type from `@/lib/api/types.ts`.
    - **401 vs 403** — 401 for not authenticated, 403 for authenticated but insufficient role.
    - **`isAuthError()` type guard** — provides clean TypeScript narrowing in API route handlers.
    - **`ErrorCode` import** — uses `ErrorCode.UNAUTHORIZED` and `ErrorCode.FORBIDDEN` from `@/lib/errors/codes.ts` (both already exist in the codebase — do NOT duplicate).
  - [x] 9.3: **VERIFY** `FORBIDDEN` already exists in `src/lib/errors/codes.ts` (added in an earlier story). Do NOT add it again. Just confirm it's present.
  - [x] 9.4: Create tests for `requireApiAuth` and `isAuthError` in `src/lib/auth/guard.test.ts`:
    - Test: returns AuthResult when authenticated with sufficient role
    - Test: returns 401 NextResponse when not authenticated
    - Test: returns 403 NextResponse when role is insufficient
    - Test: `isAuthError()` correctly identifies NextResponse vs AuthResult

- [x] Task 10: Unit tests for all components (AC: all)
  - [x] 10.1: Ensure all test files created in previous tasks pass
  - [x] 10.2: Run `npm run type-check` — must pass
  - [x] 10.3: Run `npm run lint` — must pass (0 errors)
  - [x] 10.4: Run `npm run test` — all unit tests pass (existing + new)
  - [x] 10.5: Run `npm run build` — must pass
  - [x] 10.6: Verify no regressions on login flow, MFA enrollment, MFA verification, backup codes, logout

- [x] Task 11: E2E tests (AC: #1, #2)
  - [x] 11.1: Create `tests/e2e/route-protection.spec.ts`:
    ```
    TEST CASES:
    1. should redirect unauthenticated user from /dashboard to /auth/login
    2. should redirect unauthenticated user from /admin to /auth/login
    3. should allow unauthenticated user to access / (landing page)
    4. should allow unauthenticated user to access /auth/login
    5. should display unauthorized page content
    6. should be accessible (axe audit on unauthorized page)
    ```
  - [x] 11.2: Use `data-testid` attributes for selectors
  - [x] 11.3: Use existing E2E patterns from `tests/e2e/login.spec.ts` and `tests/e2e/logout.spec.ts`

- [x] Task 12: Final verification
  - [x] 12.1: Run `npm run type-check` — must pass
  - [x] 12.2: Run `npm run lint` — must pass (0 errors)
  - [x] 12.3: Run `npm run test` — all tests pass (365 existing + new)
  - [x] 12.4: Run `npm run build` — must pass
  - [x] 12.5: Verify no regressions on all Epic 2 stories (2.1-2.5)
  - [x] 12.6: Manual test: unauthenticated → /dashboard → redirected to /auth/login
  - [x] 12.7: Manual test: login → dashboard → verify access works
  - [x] 12.8: Manual test: attempt /admin as user role → verify unauthorized page

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Layered defense pattern** — 3 layers: proxy.ts (session refresh + optimistic redirect) → Server Layout Guards (real auth + RBAC via `requireAuth()`) → RLS policies (database). All 3 layers are required.
2. **`getUser()` not `getSession()`** — `getSession()` reads from cookies which can be spoofed. `getUser()` validates JWT via Supabase Auth server. This is the #1 security gotcha. CVE-2025-29927 was caused by trusting middleware-level session data.
3. **proxy.ts runs Node.js runtime** — Next.js 16 changed middleware to proxy. Node.js only (no Edge Runtime option). This is fine for our use case.
4. **Separate Supabase proxy client** — `src/lib/supabase/proxy.ts` uses `NextRequest`/`NextResponse` cookie API. This is incompatible with the server client which uses `next/headers` cookies. Cannot share a single factory. 3 client files → now 3 + 1 proxy = 4 total Supabase client factories:
   - `server.ts` — RSC, Route Handlers, Server Actions
   - `client.ts` — Client Components (browser)
   - `proxy.ts` — proxy.ts session management (NEW)
5. **Server Actions in separate files** — `src/lib/actions/*.ts`. Never inline `'use server'` in client components.
6. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes.
7. **No barrel files** — import directly from source files.
8. **Vitest, NOT Jest** — use `vi.mock()`, `vi.fn()`, `vi.spyOn()`. Never use `jest.*` equivalents.
9. **No `dark:` classes** — dark mode not implemented. Light mode only.
10. **`data-testid` attributes** — on all testable elements.
11. **Prettier rules** — `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`.
12. **`server-only` import** — add `import 'server-only'` to guard.ts. Stub exists at `src/test-server-only-stub.ts` for tests.
13. **`isRedirectError(err)` pattern** — for testing redirect throws. Import from `next/dist/client/components/redirect-error`.
14. **Lucide React icons** — use `lucide-react` for icons (`ShieldAlert` for unauthorized page).
15. **Touch targets min 44px** — all interactive elements minimum `min-h-11`.
16. **Conventional commits** — `feat(story-2.6): route protection with RBAC enforcement`.

### Layered Defense Architecture

```
Request Flow:

Browser → proxy.ts (Layer 1) → Server Layout Guard (Layer 2) → RLS (Layer 3) → Data

Layer 1: proxy.ts
├── Runs on EVERY request (except static assets)
├── Refreshes Supabase session cookies (keeps session alive)
├── Redirects unauthenticated users from protected routes → /auth/login
├── Sets Cache-Control headers on protected routes (no-store)
├── Does NOT check roles (optimistic auth check only)
└── MUST return supabaseResponse with refreshed cookies

Layer 2: Server Layout Guards (requireAuth)
├── Runs in layout.tsx Server Components
├── Validates authentication via getUser() (real JWT validation)
├── Enforces MFA completion (AAL2) — redirects AAL1 users to /auth/mfa-verify
├── Checks role against minimum requirement
├── Redirects insufficient role → /unauthorized
├── Returns { user, role } for child components
├── Child pages can call requireAuth() again — getUser() is deduplicated per request
└── This is where REAL security enforcement happens

Layer 3: RLS Policies (existing)
├── Database-level access control
├── Enforced on every Supabase query
├── Cannot be bypassed by application code
├── Roles checked via auth.jwt() -> 'app_metadata' ->> 'role'
└── Final line of defense
```

### RBAC Route Matrix

| Route Pattern | Min Role | Guard Location | Notes |
|---------------|----------|----------------|-------|
| `/` | Public | None | Landing page |
| `/auth/*` | Public | None | Auth flow pages |
| `/coming-soon` | Public | None | Placeholder |
| `/unauthorized` | Public | None | Access denied page |
| `/dashboard` | `user` | `app/dashboard/layout.tsx` | Any authenticated user |
| `/admin/*` | `admin` | `app/admin/layout.tsx` | Admin or Super Admin |
| `/admin/users/*` | `super_admin` | Future (Epic 6) | Super Admin only |
| `/admin/audit/*` | `super_admin` | Future (Epic 7) | Super Admin only |

### Role Hierarchy

```
super_admin (3) > admin (2) > user (1)

super_admin: Full access to everything
admin:       System management, content editing, analytics, health monitoring
user:        Dashboard (health monitoring view only)
```

Role is stored in `user.app_metadata.role` (set by Supabase Admin API). Regular users cannot modify `app_metadata` — this is a Supabase security guarantee.

### Supabase Client Pattern (4 Files)

| File | Used By | Cookie API |
|------|---------|------------|
| `src/lib/supabase/server.ts` | RSC, Route Handlers, Server Actions | `next/headers` cookies() |
| `src/lib/supabase/client.ts` | Client Components (browser) | Browser cookies (automatic) |
| `src/lib/supabase/proxy.ts` | proxy.ts (NEW) | `NextRequest`/`NextResponse` cookies |
| N/A (deprecated) | ~~middleware.ts~~ | N/A — proxy.ts replaces middleware |

**CRITICAL:** The proxy client MUST use `NextRequest.cookies.getAll()` / `NextResponse.cookies.set()` — not `next/headers` cookies(). These are different APIs. Mixing them causes silent auth failures.

### Cache-Control for Browser Back Button (Completing Story 2.5 AC#2)

Story 2.5 noted that browser back button could show cached authenticated pages after logout. The fix requires two pieces:

1. **`revalidatePath('/', 'layout')`** — already done in logout action (Story 2.5)
2. **`Cache-Control: no-cache, no-store, must-revalidate`** — added by proxy.ts on all protected routes (THIS STORY)

Together, these ensure:
- Next.js router cache is busted on logout
- Browser HTTP cache never stores protected pages
- Browser bfcache cannot serve stale authenticated content

### CSP Header Updates

**Current state (permissive):**
```
default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...
```

**After this story (tightened):**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

**New additions:**
- `frame-ancestors 'none'` — modern CSP equivalent of X-Frame-Options: DENY
- `object-src 'none'` — prevents Flash/Java plugin exploitation
- `base-uri 'self'` — prevents base tag injection attacks
- `form-action 'self'` — prevents form data exfiltration to external domains

**New header:**
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` — disables unused browser features

**NOT changed:**
- `unsafe-eval` remains (required for Next.js dev mode)
- `unsafe-inline` remains (required for RSC inline scripts)
- These can be tightened further with nonces in a future security hardening story

### Existing Infrastructure (DO NOT recreate)

| Component | Location | Usage |
|-----------|----------|-------|
| Supabase server client | `src/lib/supabase/server.ts` | Auth validation in guards |
| Supabase browser client | `src/lib/supabase/client.ts` | NOT used in this story |
| Auth queries | `src/lib/auth/queries.ts` | `getCurrentUser()` (existing) |
| Logout action | `src/lib/actions/logout.ts` | Already uses revalidatePath |
| LogoutButton | `src/components/patterns/LogoutButton.tsx` | Reuse in admin placeholder |
| Error codes | `src/lib/errors/codes.ts` | Add FORBIDDEN code |
| shadcn/ui Button | `src/components/ui/button.tsx` | Button styling |
| `cn()` utility | `src/lib/utils.ts` | Conditional class names |
| Test factories | `tests/factories/user-factory.ts` | `buildUser()`, `buildSuperAdmin()` |
| server-only stub | `src/test-server-only-stub.ts` | Vitest alias for `server-only` |
| Research doc | `_bmad-output/implementation-artifacts/research-nextjs16-proxy-route-protection.md` | Reference for patterns |
| next.config.ts | `next.config.ts` | Security headers (modify) |
| proxy.ts | `src/proxy.ts` | Placeholder (modify) |
| RLS policies | `supabase/migrations/20260204000003_create_rls_policies.sql` | Existing DB-level guards |

### What This Story ADDS (New Files)

| File | Purpose |
|------|---------|
| `src/lib/supabase/proxy.ts` | Proxy-specific Supabase client with session refresh |
| `src/lib/supabase/proxy.test.ts` | Tests for proxy session management |
| `src/lib/auth/guard.ts` | RBAC guard (`requireAuth`, `requireApiAuth`, `hasMinimumRole`) |
| `src/lib/auth/guard.test.ts` | Tests for auth guard |
| `src/app/unauthorized/page.tsx` | Unauthorized access denied page |
| `src/app/unauthorized/page.test.tsx` | Tests for unauthorized page |
| `src/app/dashboard/layout.tsx` | Dashboard layout with auth guard |
| `src/app/dashboard/layout.test.tsx` | Tests for dashboard layout guard |
| `src/app/admin/layout.tsx` | Admin layout with RBAC guard (admin+) |
| `src/app/admin/layout.test.tsx` | Tests for admin layout guard |
| `src/app/admin/page.tsx` | Placeholder admin dashboard page |
| `src/app/admin/page.test.tsx` | Tests for admin placeholder |
| `tests/e2e/route-protection.spec.ts` | E2E tests for route protection |

### What This Story MODIFIES (Existing Files)

| File | Change | Reason |
|------|--------|--------|
| `src/proxy.ts` | Replace TODO with `updateSession()` call | Enable proxy auth enforcement |
| `next.config.ts` | Tighten CSP headers, add Permissions-Policy | Security hardening (AC #6) |

**Note:** `src/lib/errors/codes.ts` already contains `FORBIDDEN` — no modification needed.

### What This Story Does NOT Include

- **NO rate limiting in proxy.ts** — Rate limiting already exists in login/MFA actions via Upstash Redis. Adding proxy-level rate limiting is an optimization for later.
- **NO admin panel UI** — Epic 3 (Story 3.1) builds the proper admin panel layout. This story only adds the auth guard layout.
- **NO user management routes** — Epic 6 will create `/admin/users` with `requireAuth('super_admin')`.
- **NO audit log routes** — Epic 7 will create `/admin/audit` with `requireAuth('super_admin')`.
- **NO React Query** — Not needed (no data fetching complexity).
- **NO additional shadcn/ui installs** — Uses existing Button, lucide-react icons.
- **NO nonce-based CSP** — Would require custom Document/RootLayout changes. Deferred to security hardening story.
- **NO session timeout UI** — Session expiry is handled by Supabase Auth (24h default). No countdown timer or warning dialog in MVP.

### Previous Story Intelligence (from Stories 2.1-2.5)

**Learnings to apply:**

1. **`server-only` import** — add `import 'server-only'` at top of guard.ts. Vitest alias configured: `'server-only': 'src/test-server-only-stub.ts'`
2. **`isRedirectError(err)` pattern** — rethrow redirect errors in try/catch blocks. Import from `next/dist/client/components/redirect-error`
3. **`useFormStatus()` must be INSIDE `<form>`** — established pattern, not needed in this story (no forms)
4. **Lucide React icons** — use `lucide-react` for any icons (ShieldAlert for unauthorized page)
5. **Touch targets min 44px** — all interactive elements minimum `min-h-11`
6. **`data-testid` attributes** — on all testable elements
7. **`cn()` for classes** — never string concatenation
8. **No `dark:` Tailwind classes** — strip if copied from shadcn/ui defaults
9. **Vitest mock patterns** — `vi.mock('@/lib/supabase/server')`, `vi.mock('next/navigation')`, `vi.mock('next/cache')`
10. **Redirect testing** — use `await expect(...).rejects.toThrow('NEXT_REDIRECT')` pattern (established in Story 2.5 code review fix H1)
11. **365 tests currently passing** — must not regress
12. **Code review findings** — always check for `dark:` classes, missing `data-testid`, missing touch targets

**Code review learnings from Stories 2.1-2.5:**
- Strip `dark:` classes from any shadcn/ui components
- `data-testid` attributes on all testable elements
- Touch targets min 44px (min-h-11) for mobile accessibility
- Use `await expect(...).rejects.toThrow('NEXT_REDIRECT')` for redirect tests (not try/catch)
- `aria-label` on icon-only or icon-text buttons
- Test pending/loading states for form buttons

### Git Intelligence (Recent Commits)

```
a6c1e0d feat(story-2.5): secure logout with server action and code review fixes
f91c29b fix(story-2.4): code review fixes for MFA login verification
143581f style(login): add fade-up entrance animation to login card
85ef976 feat(story-2.4): MFA login verification with TOTP and backup codes
f6a0e3d feat(coming-soon): redesign page with premium auth-style layout
```

**Patterns observed:**
- Commit format: `feat(story-X.Y): description` for story commits
- Code reviews generate `fix(story-X.Y):` follow-up commits
- 365 unit tests across 44 test files currently passing
- Established: `data-testid`, `cn()`, DxT branding, accessibility patterns, `server-only` guards

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
│   │   ├── layout.tsx                     # NEW: Auth guard (requireAuth())
│   │   ├── page.tsx                       # Existing: Placeholder with LogoutButton
│   │   └── page.test.tsx                  # Existing
│   ├── admin/
│   │   ├── layout.tsx                     # NEW: RBAC guard (requireAuth('admin'))
│   │   ├── layout.test.tsx               # NEW
│   │   ├── page.tsx                       # NEW: Placeholder admin page
│   │   ├── page.test.tsx                 # NEW
│   │   └── _components/                   # Existing: Empty folder
│   ├── unauthorized/
│   │   ├── page.tsx                       # NEW: Access denied page
│   │   └── page.test.tsx                 # NEW
│   └── ...
├── lib/
│   ├── auth/
│   │   ├── queries.ts                     # Existing: getCurrentUser, getMfaStatus
│   │   ├── mutations.ts                   # Existing: verifyMfaEnrollment
│   │   ├── guard.ts                       # NEW: requireAuth, requireApiAuth, hasMinimumRole
│   │   └── guard.test.ts                 # NEW
│   ├── supabase/
│   │   ├── server.ts                      # Existing: Server client
│   │   ├── client.ts                      # Existing: Browser client
│   │   ├── proxy.ts                       # NEW: Proxy client (session refresh)
│   │   └── proxy.test.ts                # NEW
│   ├── errors/
│   │   └── codes.ts                       # MODIFY: Add FORBIDDEN code
│   └── ...
├── proxy.ts                               # MODIFY: Add updateSession() call
└── ...
tests/
├── e2e/
│   ├── login.spec.ts                      # Existing
│   ├── mfa-enroll.spec.ts                 # Existing
│   ├── mfa-verify.spec.ts                 # Existing
│   ├── logout.spec.ts                     # Existing
│   └── route-protection.spec.ts          # NEW
└── factories/
    └── user-factory.ts                    # Existing
```

### Environment Variables Required

```env
# Already configured from Stories 1.x, 2.1-2.5:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

No new environment variables needed for this story.

### Mock Strategy for Tests

**Unit tests (Vitest):**
- Mock `@/lib/supabase/server` for auth guard tests (getUser call)
- Mock `next/navigation` for `redirect` in guard tests
- Mock `@/lib/auth/guard` for layout tests (requireAuth call)
- Mock `@supabase/ssr` `createServerClient` for proxy client tests
- Use `vi.mock()` with `importActual` where needed

**E2E tests (Playwright):**
- Test redirect behavior for unauthenticated access
- Test unauthorized page rendering
- Use `data-testid` attributes for selectors
- Accessibility audit on unauthorized page

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authorization Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Hardening]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Security Rules]
- [Source: _bmad-output/implementation-artifacts/research-nextjs16-proxy-route-protection.md]
- [Source: _bmad-output/implementation-artifacts/2-5-secure-logout.md]
- [Source: Supabase Server-Side Auth for Next.js — https://supabase.com/docs/guides/auth/server-side/nextjs]
- [Source: Next.js 16 proxy.ts API — https://nextjs.org/docs/app/api-reference/file-conventions/proxy]
- [Source: CVE-2025-29927 Middleware Bypass — NIST NVD]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript type error in guard.test.ts: `User` type requires `user_metadata`, `aud`, `created_at` fields. Fixed by adding these to mock user builder.
- ESLint warning: unused `url` parameter in mockRedirect. Fixed by removing parameter name.

### Completion Notes List

- Task 1: Created `src/lib/supabase/proxy.ts` with `updateSession()` for proxy-level session management. Validates JWT via `getUser()`, redirects unauthenticated users from protected routes, sets Cache-Control headers on protected routes. Added `/unauthorized` to public paths. 10 tests pass.
- Task 2: Updated `src/proxy.ts` to call `updateSession()`. Added `sitemap.xml` and `robots.txt` to matcher exclusions.
- Task 3: Created `src/lib/auth/guard.ts` with `requireAuth()` (layout guard with MFA AAL2 enforcement), `hasMinimumRole()` utility, `requireApiAuth()` (API route guard returning JSON errors), and `isAuthError()` type guard. 21 tests pass.
- Task 4: Created `src/app/unauthorized/page.tsx` with Access Denied UI, ShieldAlert icon, dashboard/login links. 6 tests including accessibility audit pass.
- Task 5: Created `src/app/dashboard/layout.tsx` with `requireAuth()` guard (any authenticated user). 2 tests pass.
- Task 6: Created `src/app/admin/layout.tsx` with `requireAuth('admin')` guard. 3 tests pass.
- Task 7: Created `src/app/admin/page.tsx` placeholder with LogoutButton. 5 tests including accessibility audit pass.
- Task 8: Tightened CSP in `next.config.ts`: added `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Added `Permissions-Policy` header. Removed roadmap comment.
- Task 9: `requireApiAuth` and `isAuthError` implemented in Task 3 guard.ts. Verified `FORBIDDEN` exists in `codes.ts`. 4 additional tests in guard.test.ts.
- Task 10: All 412 tests pass (365 existing + 47 new). type-check clean, lint clean, build succeeds.
- Task 11: Created `tests/e2e/route-protection.spec.ts` with 6 E2E test cases for redirect behavior and unauthorized page rendering including accessibility audit.
- Task 12: Final verification — `type-check`, `lint`, `test` (412 pass), `build` all pass. No regressions.

**Code Review Fixes (CR 2-6):**
- H1: Added MFA AAL2 enforcement to `requireApiAuth()` — returns 403 for AAL1 users (security fix)
- H2: Added `https://*.ingest.sentry.io` to CSP connect-src (Sentry runtime fix)
- H3: Added 3 new tests: getUser error case, AAL1 rejection, unknown role handling (24 tests now)
- M1: Added `data-testid="admin-heading"` to admin page h1
- M2: Added `aria-label` to unauthorized page links
- M3: Added `.claude/settings.local.json` to `.gitignore`
- L2: Added edge case test for unknown role in hasMinimumRole
- Final: 415 tests pass (50 test files), type-check clean, lint clean, build succeeds

### Change Log

- 2026-02-05: Story 2.6 implementation complete — route protection, RBAC enforcement, CSP hardening
- 2026-02-05: Code review fixes — MFA AAL2 enforcement in requireApiAuth, Sentry CSP connect-src, aria-labels, data-testid, gitignore

### File List

**New Files:**
- `src/lib/supabase/proxy.ts` — Proxy Supabase client with session refresh
- `src/lib/supabase/proxy.test.ts` — Tests for proxy session management (10 tests)
- `src/lib/auth/guard.ts` — RBAC guard (requireAuth, requireApiAuth with MFA AAL2, hasMinimumRole, isAuthError)
- `src/lib/auth/guard.test.ts` — Tests for auth guard (24 tests)
- `src/app/unauthorized/page.tsx` — Access Denied page with aria-labels
- `src/app/unauthorized/page.test.tsx` — Tests for unauthorized page (6 tests)
- `src/app/dashboard/layout.tsx` — Dashboard layout with auth guard
- `src/app/dashboard/layout.test.tsx` — Tests for dashboard layout (2 tests)
- `src/app/admin/layout.tsx` — Admin layout with RBAC guard (admin+)
- `src/app/admin/layout.test.tsx` — Tests for admin layout (3 tests)
- `src/app/admin/page.tsx` — Placeholder admin page with data-testid on heading
- `src/app/admin/page.test.tsx` — Tests for admin page (5 tests)
- `tests/e2e/route-protection.spec.ts` — E2E tests for route protection (6 tests)

**Modified Files:**
- `src/proxy.ts` — Replaced TODO with updateSession() call, updated matcher
- `next.config.ts` — Tightened CSP headers, added Permissions-Policy, Sentry connect-src
- `.gitignore` — Added .claude/settings.local.json
