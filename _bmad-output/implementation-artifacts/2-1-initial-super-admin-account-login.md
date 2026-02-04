# Story 2.1: Initial Super Admin Account & Login

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the initial Super Admin (Jiraw),
I want a seeded Super Admin account and a secure login flow,
So that I can access the CMS immediately after deployment without open registration.

## Acceptance Criteria

1. **Given** the database is seeded (from Story 1.2) **When** I check the users table **Then** an initial Super Admin account exists with a pre-configured email and temporary password **And** the password is hashed using Supabase Auth platform defaults (bcrypt-compatible)

2. **Given** I navigate to the login page **When** I enter the Super Admin email and password **Then** I am authenticated and redirected to the MFA setup page (first login requires MFA setup)

3. **Given** I enter an incorrect password **When** I submit the login form **Then** I see a generic error message "Invalid email or password" (no credential enumeration)

4. **Given** I attempt more than 5 login attempts in 15 minutes from the same IP **When** I submit another login attempt **Then** I receive a 429 "Too Many Requests" response (Upstash Redis rate limiting)

5. **Given** the login page **When** I inspect the connection **Then** all data is transmitted over HTTPS/TLS 1.3 or higher

6. **Given** there is no public registration page **When** an unauthenticated user tries to access `/register` **Then** they receive a 404 or are redirected to the login page (invitation-only model)

## Tasks / Subtasks

**Dependency: Epic 1 must be complete (all 4 stories done). Confirmed done.**

- [ ] Task 0: Install shadcn/ui form components (prerequisite for Task 6)
  - [ ] 0.1: Run `npx shadcn@latest add button input label` to install shadcn/ui Button, Input, and Label components into `src/components/ui/`
  - [ ] 0.2: Verify the components are installed at `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`
  - [ ] 0.3: These provide consistent styling (Radix UI primitives), built-in accessibility, and establish the pattern for all future forms

- [ ] Task 1: Verify Super Admin seed account (AC: #1)
  - [ ] 1.1: Confirm `supabase/seed-admin.ts` creates a super admin via `supabase.auth.admin.createUser()` with `email_confirm: true` and `app_metadata: { role: 'super_admin' }` — this was created in Story 1.2
  - [ ] 1.2: Verify the seed script uses env vars `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `.env.local`
  - [ ] 1.3: Run `npx tsx supabase/seed-admin.ts` locally and verify the account exists in Supabase Auth dashboard
  - [ ] 1.4: Verify the account has `role: 'super_admin'` in `app_metadata` (this is how RBAC is enforced later)

- [ ] Task 2: Create auth validation schemas (AC: #2, #3)
  - [ ] 2.1: Create `src/lib/validations/auth.ts` with Zod login schema:
    ```typescript
    import { z } from 'zod'

    export const loginSchema = z.object({
      email: z.string().email('Valid email required'),
      password: z.string().min(1, 'Password is required'),
    })

    export type LoginFormData = z.infer<typeof loginSchema>
    ```
  - [ ] 2.2: Create `src/lib/validations/auth.test.ts` — test valid/invalid emails, empty password, edge cases

- [ ] Task 3: Create auth domain module (AC: #2, #3)
  - [ ] 3.1: Create `src/lib/auth/queries.ts` with functions:
    ```typescript
    import { createClient } from '@/lib/supabase/server'

    export async function signInWithEmail(email: string, password: string) {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    }

    export async function getMfaStatus() {
      const supabase = await createClient()
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      const { data: factors } = await supabase.auth.mfa.listFactors()

      const hasNoFactors = !factors?.totp?.length
      const needsMfaVerification = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2'

      return { hasNoFactors, needsMfaVerification, aalData, factors }
    }

    export async function getCurrentUser() {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return null
      return user
    }
    ```
  - [ ] 3.2: Create `src/lib/auth/queries.test.ts` — mock Supabase client, test success/error paths, MFA status detection
  - [ ] 3.3: Delete `src/lib/auth/.gitkeep` (replaced by real files)

- [ ] Task 4: Create rate limiting infrastructure (AC: #4)
  - [ ] 4.1: Create `src/lib/ratelimit/login.ts`:
    ```typescript
    import { Ratelimit } from '@upstash/ratelimit'
    import { Redis } from '@upstash/redis'

    export const loginRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: '@upstash/ratelimit:login',
    })
    ```
  - [ ] 4.2: Create `src/lib/ratelimit/login.test.ts` — test rate limit creation, verify config values
  - [ ] 4.3: Delete `src/lib/ratelimit/.gitkeep` (replaced by real files)

- [ ] Task 5: Create login Server Action (AC: #2, #3, #4)
  - [ ] 5.1: Create `src/lib/actions/auth.ts`:
    ```typescript
    'use server'

    import { redirect } from 'next/navigation'
    import { isRedirectError } from 'next/dist/client/components/redirect-error'
    import { loginSchema } from '@/lib/validations/auth'
    import { signInWithEmail, getMfaStatus } from '@/lib/auth/queries'
    import { loginRatelimit } from '@/lib/ratelimit/login'
    import { headers } from 'next/headers'

    export type LoginState = {
      error: string | null
      rateLimited: boolean
    }

    export async function loginAction(
      _prevState: LoginState,
      formData: FormData,
    ): Promise<LoginState> {
      // Rate limit check
      const headerStore = await headers()
      const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success } = await loginRatelimit.limit(ip)
      if (!success) {
        return { error: 'Too many login attempts. Please try again later.', rateLimited: true }
      }

      // Validate input
      const raw = { email: formData.get('email'), password: formData.get('password') }
      const parsed = loginSchema.safeParse(raw)
      if (!parsed.success) {
        return { error: parsed.error.errors[0].message, rateLimited: false }
      }

      // Attempt sign in + check MFA status
      try {
        await signInWithEmail(parsed.data.email, parsed.data.password)

        // Check MFA status after successful login
        const { hasNoFactors, needsMfaVerification } = await getMfaStatus()
        if (hasNoFactors) {
          redirect('/auth/mfa-enroll')
        } else if (needsMfaVerification) {
          redirect('/auth/mfa-verify')
        } else {
          redirect('/dashboard')
        }
      } catch (err) {
        // redirect() throws a NEXT_REDIRECT error — rethrow it
        if (isRedirectError(err)) {
          throw err
        }
        // All auth/MFA errors → generic message (no credential enumeration)
        return { error: 'Invalid email or password', rateLimited: false }
      }
    }
    ```
  - [ ] 5.2: Create `src/lib/actions/auth.test.ts` — test validation failures, rate limiting, successful login with MFA redirect, incorrect credentials
  - [ ] 5.3: **IMPORTANT:** The generic error "Invalid email or password" MUST be identical for wrong email AND wrong password — no credential enumeration
  - [ ] 5.4: **IMPORTANT:** `redirect()` from `next/navigation` throws a special error internally. The try/catch MUST rethrow `NEXT_REDIRECT` errors. Check the actual error detection pattern — in Next.js 16, use `import { isRedirectError } from 'next/dist/client/components/redirect-error'` and `if (isRedirectError(err)) throw err` as the canonical check

- [ ] Task 6: Create login page UI (AC: #2, #3, #6)
  - [ ] 6.1: Create `src/app/auth/login/page.tsx` (Server Component) — URL: `/auth/login`:
    ```typescript
    import { redirect } from 'next/navigation'
    import { getCurrentUser } from '@/lib/auth/queries'
    import LoginForm from './_components/LoginForm'

    export const metadata = {
      title: 'Login | zyncdata',
      description: 'Sign in to the zyncdata CMS',
    }

    export default async function LoginPage() {
      const user = await getCurrentUser()
      if (user) redirect('/dashboard')

      return (
        <main className="flex min-h-screen items-center justify-center bg-background">
          <LoginForm />
        </main>
      )
    }
    ```
  - [ ] 6.2: Create `src/app/auth/login/_components/LoginForm.tsx` (`'use client'`):
    - Use `useActionState()` (React 19) with `loginAction`
    - Use `useFormStatus()` for submit button loading state
    - Use shadcn/ui `<Input>`, `<Button>`, `<Label>` components (installed in Task 0)
    - Fields: email input, password input, submit button
    - Display error message from action state
    - Display rate limit message when `rateLimited: true`
    - Apply DxT branding (primary color, Nunito font inherited from root layout)
    - `focus-visible:ring-2 focus-visible:ring-dxt-primary` on all inputs
    - `aria-label` on all inputs, `aria-live="polite"` on error region
    - Keyboard: Enter submits form
    - Password visibility toggle (eye icon button) — toggles input `type` between `password` and `text`, use `aria-label` that updates to reflect current state ("Show password" / "Hide password")
  - [ ] 6.3: Create `src/app/auth/login/_components/LoginForm.test.tsx` — test render, form submission, error display, loading state, accessibility (jest-axe)
  - [ ] 6.4: Delete `src/app/(auth)/.gitkeep` (no longer needed — using `src/app/auth/` non-grouped directory instead)

- [ ] Task 7: Create auth layout (AC: #2, #6)
  - [ ] 7.1: Create `src/app/auth/layout.tsx` — minimal layout WITHOUT sidebar/navigation. All auth pages share this layout:
    ```typescript
    export default function AuthLayout({ children }: { children: React.ReactNode }) {
      return <>{children}</>
    }
    ```
  - [ ] 7.2: This layout is intentionally minimal — no header, no sidebar, just the auth content centered
  - [ ] 7.3: **IMPORTANT:** Auth pages use `src/app/auth/` (non-grouped directory, NOT `(auth)` route group). URLs will be `/auth/login`, `/auth/register`, `/auth/mfa-enroll`, `/auth/mfa-verify`. This matches the architecture's proxy pattern (`request.nextUrl.pathname.startsWith('/auth')`) and keeps all auth routes under a consistent `/auth/` URL prefix

- [ ] Task 8: Handle /auth/register route (AC: #6)
  - [ ] 8.1: Create `src/app/auth/register/page.tsx` that immediately redirects to `/auth/login`:
    ```typescript
    import { redirect } from 'next/navigation'
    export default function RegisterPage() {
      redirect('/auth/login')
    }
    ```
    Alternative: use `not-found()` to return 404 — either approach is acceptable per AC. The redirect is preferred so users understand where to go

- [ ] Task 9: Create MFA enrollment and verification stub pages (AC: #2)
  - [ ] 9.1: Create `src/app/auth/mfa-enroll/page.tsx` — stub page with message "MFA Setup coming in Story 2.2". This page is the redirect target after first login. URL: `/auth/mfa-enroll`
  - [ ] 9.2: Create `src/app/auth/mfa-verify/page.tsx` — stub page with message "MFA Verification coming in Story 2.4". This page is the redirect target when MFA is enrolled but not yet verified this session. URL: `/auth/mfa-verify`
  - [ ] 9.3: Both stubs should display cleanly with DxT branding — they are NOT just blank pages. Include a "Back to Login" link pointing to `/auth/login`

- [ ] Task 10: Create auth callback route
  - [ ] 10.1: Create `src/app/auth/callback/route.ts` — **MANDATORY** per architecture. Exchanges auth code for session:
    ```typescript
    import { NextResponse } from 'next/server'
    import { createClient } from '@/lib/supabase/server'

    export async function GET(request: Request) {
      const { searchParams, origin } = new URL(request.url)
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/dashboard'

      if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }

      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
    }
    ```
  - [ ] 10.2: This sits at `app/auth/callback/` alongside the other auth pages (login, register, mfa-enroll, mfa-verify). URL: `/auth/callback`

- [ ] Task 11: Create dashboard stub page (redirect target)
  - [ ] 11.1: Create `src/app/dashboard/page.tsx` — stub page that displays "Dashboard coming in Epic 3+". This is the redirect target after successful MFA verification
  - [ ] 11.2: This page does NOT need auth protection yet (Story 2.6 adds route protection)

- [ ] Task 12: Fix user factory role + verify Header login link
  - [ ] 12.1: Update `tests/factories/user-factory.ts` — change role type from `'super_admin' | 'admin' | 'viewer'` to `'super_admin' | 'admin' | 'user'` to match architecture RBAC matrix. Change default role from `'viewer'` to `'user'`
  - [ ] 12.2: Verify `src/components/layouts/Header.tsx` login link `href` points to `/auth/login` (the correct URL for the non-grouped auth directory). Update if it points elsewhere (e.g., `/login`)
  - [ ] 12.3: Run existing tests to confirm no regressions from factory change

- [ ] Task 13: E2E tests (AC: #2, #3, #4, #6)
  - [ ] 13.1: Create `tests/e2e/login.spec.ts`:
    - Test: login page renders with email and password fields
    - Test: successful login redirects (mock Supabase or use local instance)
    - Test: invalid credentials show error message
    - Test: `/auth/register` redirects to login page
    - Test: login page has no accessibility violations (`@axe-core/playwright`)
  - [ ] 13.2: Use `data-testid` attributes (not CSS selectors) per code review learning from 1.3

- [ ] Task 14: Final verification
  - [ ] 14.1: Run `npm run type-check` — must pass
  - [ ] 14.2: Run `npm run lint` — must pass (0 errors)
  - [ ] 14.3: Run `npm run test:run` — all unit tests pass (existing + new)
  - [ ] 14.4: Run `npm run build` — must pass
  - [ ] 14.5: Run `npm run dev` — verify login page renders at `/auth/login`
  - [ ] 14.6: Verify no regressions on landing page

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Server Components by default** — Only `LoginForm.tsx` needs `'use client'` in this story
2. **Next.js 16 async patterns** — `cookies()`, `headers()`, `params` are all `Promise`-based. Always `await` them
3. **`proxy.ts` NOT `middleware.ts`** — Next.js 16 renamed middleware to proxy. The existing `src/proxy.ts` is a placeholder. Do NOT create a `middleware.ts` — Story 2.6 will implement the full proxy with auth guards
4. **Server Actions in separate files** — `src/lib/actions/auth.ts`, NEVER inline `'use server'` in client components
5. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes
6. **No barrel files** — import directly from source files
7. **Vitest, NOT Jest** — use `vi.mock()`, `vi.fn()`, `vi.spyOn()`. Never use `jest.*` equivalents
8. **No `dark:` classes** — dark mode not implemented. Light mode only
9. **Zod v4 (classic mode)** — `package.json` has `"zod": "^4.3.6"`. The default import `from 'zod'` uses v4/classic which is backward-compatible with all v3 patterns
10. **`supabase.auth.getUser()` on server, NEVER `getSession()`** — `getSession()` reads from cookies and can be spoofed. Always use `getUser()` for server-side auth validation
11. **Generic error messages** — "Invalid email or password" for ALL auth failures. No credential enumeration
12. **Rate limiting uses IP** — Extract from `x-forwarded-for` header (Vercel provides this). Sliding window algorithm
13. **Supabase `app_metadata.role`** — Roles are stored in `app_metadata` (not `user_metadata`) because `app_metadata` cannot be modified by the user client-side
14. **`useActionState()` NOT `useFormState()`** — React 19 renamed the hook. The old name is deprecated
15. **Import path clarity** — `@/lib/utils` is the file `src/lib/utils.ts` (contains `cn()`). `@/lib/utils/transform` is `src/lib/utils/transform.ts`. These coexist
16. **Prettier rules** — `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`

### Supabase Auth MFA Flow (Critical Context for Login)

**The login flow is a multi-step process:**

```
signInWithPassword() → AAL1 session
    ├── listFactors() → no TOTP factors → redirect /auth/mfa-enroll (Story 2.2)
    ├── getAuthenticatorAssuranceLevel() → aal1→aal2 → redirect /auth/mfa-verify (Story 2.4)
    └── getAuthenticatorAssuranceLevel() → aal2→aal2 → redirect /dashboard
```

**Key Supabase Auth behavior:**
- `signInWithPassword()` ALWAYS returns AAL1 session, even if MFA is enrolled
- After successful login, you MUST check MFA status explicitly
- `mfa.getAuthenticatorAssuranceLevel()` is a local operation (no API call) — reads from JWT
- `mfa.listFactors()` lists all enrolled TOTP factors
- The `aal` claim in the JWT determines what the user can access

**AAL State Matrix:**

| `currentLevel` | `nextLevel` | Meaning |
|---|---|---|
| `aal1` | `aal1` | User has NO MFA factors enrolled |
| `aal1` | `aal2` | User HAS MFA enrolled, needs verification |
| `aal2` | `aal2` | MFA verified — full access |

### Rate Limiting Configuration

**Per architecture spec:**
- Login: 5 requests / 15 minutes / IP (sliding window)
- MFA verification: 3 requests / 5 minutes / user (Story 2.4)
- API routes: 100 requests / minute / user (Story 2.6)
- Public endpoints: 20 requests / minute / IP (Story 2.6)

**Upstash Redis is REQUIRED.** Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**For local development without Redis:** The rate limiter will fail if Redis env vars are missing. Options:
1. Set up a free Upstash Redis instance (recommended)
2. Create a mock/bypass for local dev (if needed, wrap creation in try/catch)

### Existing Infrastructure Already in Place

The following is **already configured** from Stories 1.1-1.4. Do NOT recreate:

| Component | Status | Location |
|-----------|--------|----------|
| Supabase server client | Done | `src/lib/supabase/server.ts` (async cookies pattern) |
| Supabase browser client | Done | `src/lib/supabase/client.ts` |
| Super Admin seed script | Done | `supabase/seed-admin.ts` (uses `auth.admin.createUser()`) |
| Error codes | Done | `src/lib/errors/codes.ts` (UNAUTHORIZED, RATE_LIMIT_EXCEEDED) |
| API types | Done | `src/lib/api/types.ts` (`ApiResponse<T>`) |
| API client | Done | `src/lib/api/client.ts` (apiGet, apiPost) |
| Test factories | Done | `tests/factories/user-factory.ts` (buildUser, buildSuperAdmin) |
| Error boundary | Done | `src/app/error.tsx` + `src/app/global-error.tsx` |
| DxT design tokens | Done | `src/app/globals.css` (@theme block) |
| Vitest config | Done | `vitest.config.ts` (coverage thresholds) |
| Playwright config | Done | `playwright.config.ts` |
| Pre-commit hooks | Done | `.husky/pre-commit` |
| proxy.ts placeholder | Done | `src/proxy.ts` (returns NextResponse.next()) |
| `.gitkeep` placeholders | Done | `src/lib/auth/`, `src/lib/ratelimit/`, `src/app/(auth)/` (will be deleted and replaced by `src/app/auth/`) |

### What This Story ADDS (New Files)

| File | Purpose |
|------|---------|
| `src/lib/validations/auth.ts` | Login form Zod schema |
| `src/lib/validations/auth.test.ts` | Schema validation tests |
| `src/lib/auth/queries.ts` | `signInWithEmail`, `getMfaStatus`, `getCurrentUser` |
| `src/lib/auth/queries.test.ts` | Auth query tests with mocked Supabase |
| `src/lib/ratelimit/login.ts` | Login rate limiter (Upstash Redis) |
| `src/lib/ratelimit/login.test.ts` | Rate limiter config tests |
| `src/lib/actions/auth.ts` | `loginAction` Server Action |
| `src/lib/actions/auth.test.ts` | Server Action tests |
| `src/app/auth/layout.tsx` | Minimal auth layout (no sidebar) |
| `src/app/auth/login/page.tsx` | Login page (Server Component) |
| `src/app/auth/login/_components/LoginForm.tsx` | Login form (Client Component) |
| `src/app/auth/login/_components/LoginForm.test.tsx` | Form tests + accessibility |
| `src/app/auth/register/page.tsx` | Redirect to login (invitation-only) |
| `src/app/auth/mfa-enroll/page.tsx` | MFA enrollment stub (Story 2.2) |
| `src/app/auth/mfa-verify/page.tsx` | MFA verification stub (Story 2.4) |
| `src/app/auth/callback/route.ts` | Auth callback route (code exchange) |
| `src/app/dashboard/page.tsx` | Dashboard stub page |
| `tests/e2e/login.spec.ts` | Login E2E tests |

### What This Story MODIFIES (Existing Files)

| File | Change | Reason |
|------|--------|--------|
| `src/lib/auth/.gitkeep` | **DELETE** | Replaced by real files |
| `src/lib/ratelimit/.gitkeep` | **DELETE** | Replaced by real files |
| `src/app/(auth)/.gitkeep` | **DELETE** | Replaced by `src/app/auth/` non-grouped directory |

### What This Story Does NOT Include

- **NO middleware/proxy auth enforcement** — Story 2.6 implements route protection
- **NO MFA enrollment flow** — Story 2.2 handles TOTP setup
- **NO MFA verification flow** — Story 2.4 handles MFA login verification
- **NO backup codes** — Story 2.3 handles backup code generation
- **NO logout** — Story 2.5 handles secure logout
- **NO RBAC enforcement** — Story 2.6 handles route protection and role checks
- **NO session management beyond Supabase defaults** — Session expiry/refresh handled by Supabase SSR cookie management
- **NO React Query** — Not in admin routes yet, not needed for login
- **NO dashboard implementation** — Just a stub redirect target
- **NO additional CSP rules** — CSP and security headers already exist in `next.config.ts` (from Story 1.1). Story 2.6 will tighten CSP rules for auth-specific needs. **Note for Story 2.2:** When implementing client-side MFA enrollment, `connect-src` in CSP may need updating to allow direct Supabase API calls from the browser
- **NO audit logging** — Epic 7 handles audit logging

### Previous Story Intelligence (from Story 1.4)

**Learnings to apply:**
- `cookies()` is async in Next.js 16 — the Supabase server client already handles this correctly in `src/lib/supabase/server.ts`
- `as const` for constant objects — already established pattern
- All new interactive elements need `focus-visible:ring-2` — apply to all form inputs
- Use `data-testid` attributes for E2E tests (not CSS selectors) — learned from Story 1.3 code review
- Import from `'zod'` uses v4/classic mode — all v3 patterns work identically
- `src/lib/utils.ts` (file) contains `cn()`. `src/lib/utils/transform.ts` is in `utils/` directory. These coexist

**Code review learnings from Epic 1:**
- Watch for snake_case leaks in Zod schemas
- Always verify schemas are `.parse()`d at runtime
- All interactive elements need focus indicators (`focus-visible:ring-2`)
- E2E tests must use `data-testid` attributes
- `apiPost` guards body/Content-Type when body is undefined

### Git Intelligence (Recent Commits)

```
0a5855e test(story-1.4): add 18 guardrail tests via TEA automate workflow
3c8eae2 fix(story-1.2): update TINEDY and ENEOS URLs to zyncdata.app domain
70eb2c8 feat(story-1.4): testing infrastructure, error boundaries & shared utilities
47a84a2 feat(story-1.3): add ambient floating animation to hero orbs
7290ad7 fix(story-1.3): remove inconsistent underline from systems heading
```

**Patterns observed:**
- Commit format: `type(story-X.Y): description`
- Code reviews generate fix commits
- Size-limit: JS < 200KB (increased for Sentry SDK)
- 96 unit tests across 13 test files currently passing

### Project Structure After This Story

```
src/
├── app/
│   ├── auth/                              # Auth directory (public, no sidebar) — URLs: /auth/*
│   │   ├── layout.tsx                     # NEW: Minimal auth layout
│   │   ├── login/
│   │   │   ├── page.tsx                   # NEW: Login page (RSC) — URL: /auth/login
│   │   │   └── _components/
│   │   │       ├── LoginForm.tsx          # NEW: Login form ('use client')
│   │   │       └── LoginForm.test.tsx     # NEW: Form tests
│   │   ├── register/
│   │   │   └── page.tsx                   # NEW: Redirect to login — URL: /auth/register
│   │   ├── mfa-enroll/
│   │   │   └── page.tsx                   # NEW: MFA enrollment stub — URL: /auth/mfa-enroll
│   │   ├── mfa-verify/
│   │   │   └── page.tsx                   # NEW: MFA verification stub — URL: /auth/mfa-verify
│   │   └── callback/
│   │       └── route.ts                   # NEW: Auth callback (code exchange) — URL: /auth/callback
│   ├── dashboard/
│   │   └── page.tsx                     # NEW: Dashboard stub
│   ├── error.tsx                        # Existing
│   ├── global-error.tsx                 # Existing
│   ├── layout.tsx                       # Existing (root)
│   └── page.tsx                         # Existing (landing page)
├── lib/
│   ├── auth/
│   │   ├── queries.ts                   # NEW: signInWithEmail, getMfaStatus, getCurrentUser
│   │   └── queries.test.ts              # NEW: Auth query tests
│   ├── actions/
│   │   ├── auth.ts                      # NEW: loginAction Server Action
│   │   └── auth.test.ts                 # NEW: Action tests
│   ├── ratelimit/
│   │   ├── login.ts                     # NEW: Login rate limiter
│   │   └── login.test.ts               # NEW: Rate limiter tests
│   ├── validations/
│   │   ├── auth.ts                      # NEW: loginSchema
│   │   ├── auth.test.ts                 # NEW: Validation tests
│   │   ├── system.ts                    # Existing
│   │   └── content.ts                   # Existing
│   ├── api/                             # Existing (client.ts, types.ts)
│   ├── errors/                          # Existing (codes.ts)
│   ├── supabase/                        # Existing (server.ts, client.ts)
│   ├── utils/                           # Existing (transform.ts)
│   ├── utils.ts                         # Existing (cn())
│   ├── websocket/                       # Existing (events.ts)
│   ├── systems/                         # Existing
│   ├── content/                         # Existing
│   ├── health/                          # Empty (.gitkeep) — Epic 5
│   └── hooks/                           # Empty (.gitkeep) — future
└── proxy.ts                             # Existing (placeholder — Story 2.6)
```

### Latest Technology Notes

**Supabase Auth (@supabase/supabase-js v2.94.0):**
- `signInWithPassword()` always returns AAL1 session — MFA is checked separately
- `mfa.getAuthenticatorAssuranceLevel()` is a local JWT read (no API call)
- `mfa.listFactors()` returns `{ totp: Factor[], phone: Factor[], all: Factor[] }`
- `mfa.challengeAndVerify()` combines challenge + verify in one call (TOTP only)
- After `mfa.verify()`, other sessions for the user are logged out
- TOTP codes valid for 30-second intervals with 1-interval clock skew tolerance

**Supabase SSR (@supabase/ssr v0.8.0):**
- `createServerClient()` with cookie handlers for server-side
- `createBrowserClient()` for client-side (singleton by default)
- `cookies()` is async in Next.js 16 — already handled in existing `server.ts`
- `getUser()` validates JWT against Supabase Auth server — use this on server
- `getSession()` reads from cookies without validation — NEVER use on server

**Upstash Ratelimit (@upstash/ratelimit v2.0.8):**
- `Ratelimit.slidingWindow(tokens, window)` — recommended for login endpoints
- Returns `{ success, limit, remaining, reset, pending }`
- `pending` is a Promise for analytics — can be ignored in MVP. **Note:** `@vercel/functions` is NOT installed, so `waitUntil(pending)` cannot be used. Simply ignore the `pending` promise; it resolves on its own and does not block the response
- `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Free tier: 10,000 requests/day (sufficient for MVP)

**React 19 Form Patterns:**
- `useActionState(action, initialState)` replaces deprecated `useFormState`
- `useFormStatus()` provides `{ pending }` for submit button states
- `useFormStatus` must be called from a component INSIDE the `<form>` element

### Environment Variables Required

```env
# Already configured from Epic 1:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...

# Required NEW for this story:
UPSTASH_REDIS_REST_URL=...        # For rate limiting
UPSTASH_REDIS_REST_TOKEN=...      # For rate limiting

# Already in .env.local from Story 1.2:
SEED_ADMIN_EMAIL=admin@dxt-ai.com
SEED_ADMIN_PASSWORD=changeme123!
```

### Mock Strategy for Tests

**Unit tests (Vitest):**
- Mock `@/lib/supabase/server` at module level: `vi.mock('@/lib/supabase/server')`
- Mock Supabase client methods: `auth.signInWithPassword`, `auth.mfa.*`, `auth.getUser`
- Mock Upstash: `vi.mock('@upstash/ratelimit')` and `vi.mock('@upstash/redis')`
- Mock `next/navigation`: `vi.mock('next/navigation')` for `redirect()`
- Mock `next/headers`: `vi.mock('next/headers')` for `headers()`

**E2E tests (Playwright):**
- Option A: Use local Supabase instance (`supabase start`) with seeded admin
- Option B: Mock API responses at network level
- Use `data-testid` attributes for selectors

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authorization Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rate Limiting Implementation]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Testing Rules]
- [Source: _bmad-output/project-context.md#Security Rules]
- [Source: _bmad-output/implementation-artifacts/1-4-testing-infrastructure-error-boundaries-shared-utilities.md]
- [Source: Supabase Auth MFA Documentation — https://supabase.com/docs/guides/auth/auth-mfa]
- [Source: Supabase SSR Guide — https://supabase.com/docs/guides/auth/server-side/creating-a-client]
- [Source: Upstash Ratelimit — https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
