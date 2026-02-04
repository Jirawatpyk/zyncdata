# Story 2.2: TOTP MFA Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a CMS user,
I want to set up Multi-Factor Authentication using my authenticator app,
So that my account is protected with a second factor of authentication.

## Acceptance Criteria

1. **Given** I have just registered or haven't set up MFA **When** I am on the MFA setup page **Then** I see a QR code that I can scan with my authenticator app (Google Authenticator, Authy, 1Password)

2. **Given** I have scanned the QR code **When** I enter a valid 6-digit TOTP code from my authenticator app **Then** MFA is enabled on my account (Supabase Auth marks the TOTP factor as "verified" internally — there is no custom `mfa_enabled` column; MFA status is determined by `supabase.auth.mfa.listFactors()`) **And** my MFA secret is encrypted at rest using platform-managed encryption

3. **Given** I enter an incorrect TOTP code during setup **When** I submit the verification form **Then** I see an error message "Invalid code. Please try again."

4. **Given** MFA setup is completed **When** I check my account **Then** MFA is mandatory and cannot be disabled by the user (admin-only)

## Tasks / Subtasks

**Dependency: Story 2.1 must be complete (login flow, auth queries, rate limiting). Confirmed done.**

- [x] Task 0: Update CSP to allow browser Supabase calls (prerequisite for Task 6)
  - [x] 0.1: Update `next.config.ts` — add `connect-src 'self' https://*.supabase.co wss://*.supabase.co;` to the Content-Security-Policy header value
  - [x] 0.2: The current CSP has NO `connect-src` directive, so it defaults to `default-src 'self'` which **blocks all browser fetch requests to external domains**. MFA enrollment calls `supabase.auth.mfa.enroll()` from the browser client, which makes a direct HTTP request to `https://[project].supabase.co` — this WILL be silently blocked without this fix
  - [x] 0.3: Verify after change: browser console shows no CSP violation errors when the MFA enrollment page loads

- [x] Task 1: Add MFA validation schema (AC: #2, #3)
  - [x] 1.1: Add to `src/lib/validations/auth.ts` a new Zod schema:
    ```typescript
    export const mfaVerifySchema = z.object({
      code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be 6 digits'),
    })

    export type MfaVerifyFormData = z.infer<typeof mfaVerifySchema>
    ```
  - [x] 1.2: Add tests in `src/lib/validations/auth.test.ts` — test valid 6-digit codes, invalid lengths, non-numeric input, empty input

- [x]Task 2: Add MFA enrollment mutations to auth domain module (AC: #1, #2, #3)
  - [x]2.1: Create `src/lib/auth/mutations.ts` (new file — mutations separate from queries per architecture):
    ```typescript
    import { createClient } from '@/lib/supabase/client'

    export async function enrollMfaFactor() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })
      if (error) throw error
      return data // { id: string, totp: { qr_code: string, secret: string, uri: string } }
    }

    export async function verifyMfaEnrollment(factorId: string, code: string) {
      const supabase = createClient()
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyError) throw verifyError
      return data
    }
    ```
  - [x]2.2: **CRITICAL:** These use the **browser client** (`@/lib/supabase/client`), NOT the server client. MFA enroll/challenge/verify MUST run client-side because the Supabase Auth session (JWT) is in the browser. The server client reads from cookies which may not have the AAL1 session context needed for MFA enrollment
  - [x]2.3: Create `src/lib/auth/mutations.test.ts` — mock Supabase browser client, test enroll success/error, challenge+verify success/error

- [x]Task 3: Create MFA rate limiting (AC: #3)
  - [x]3.1: Create `src/lib/ratelimit/mfa.ts`:
    ```typescript
    import { Ratelimit } from '@upstash/ratelimit'
    import { Redis } from '@upstash/redis'

    let mfaRatelimitInstance: Ratelimit | null = null

    export function getMfaRatelimit(): Ratelimit {
      if (!mfaRatelimitInstance) {
        mfaRatelimitInstance = new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(3, '5 m'),
          prefix: '@upstash/ratelimit:mfa',
        })
      }
      return mfaRatelimitInstance
    }
    ```
  - [x]3.2: Uses **lazy initialization** pattern (same as `getLoginRatelimit()` from Story 2.1)
  - [x]3.3: Rate limit: 3 attempts per 5 minutes per user (architecture spec)
  - [x]3.4: Create `src/lib/ratelimit/mfa.test.ts` — test lazy initialization, verify config values

- [x]Task 4: Create MFA enrollment Server Action (AC: #2, #3)
  - [x]4.1: Create `src/lib/actions/mfa.ts`:
    ```typescript
    'use server'

    import { redirect } from 'next/navigation'
    import { isRedirectError } from 'next/dist/client/components/redirect-error'
    import { mfaVerifySchema } from '@/lib/validations/auth'
    import { getMfaRatelimit } from '@/lib/ratelimit/mfa'
    import { getCurrentUser } from '@/lib/auth/queries'

    export type MfaEnrollState = {
      error: string | null
      rateLimited: boolean
    }

    export async function verifyMfaEnrollmentAction(
      _prevState: MfaEnrollState,
      formData: FormData,
    ): Promise<MfaEnrollState> {
      // Auth check — user must be logged in (AAL1)
      const user = await getCurrentUser()
      if (!user) {
        redirect('/auth/login')
      }

      // Rate limit by user ID (not IP — per architecture spec)
      const { success } = await getMfaRatelimit().limit(user.id)
      if (!success) {
        return { error: 'Too many attempts. Please try again later.', rateLimited: true }
      }

      // Validate TOTP code format
      const raw = { code: formData.get('code') }
      const parsed = mfaVerifySchema.safeParse(raw)
      if (!parsed.success) {
        return { error: parsed.error.issues[0].message, rateLimited: false }
      }

      // Server action validates code format + enforces rate limiting.
      // Client component calls this FIRST, then calls verifyMfaEnrollment()
      // client-side only if this returns { error: null }.
      return { error: null, rateLimited: false }
    }
    ```
  - [x]4.2: **DESIGN DECISION:** The client component calls this server action FIRST (rate limit + validation), then calls `verifyMfaEnrollment()` client-side via the browser Supabase client. This keeps rate limiting server-side (harder to bypass) while MFA operations stay client-side (required by Supabase Auth)
  - [x]4.3: Create `src/lib/actions/mfa.test.ts` — test auth check redirect, rate limiting, validation

- [x]Task 5: Replace MFA enrollment stub page with real implementation (AC: #1, #2, #3, #4)
  - [x]5.1: Replace `src/app/auth/mfa-enroll/page.tsx` (Server Component):
    ```typescript
    import { redirect } from 'next/navigation'
    import { getCurrentUser, getMfaStatus } from '@/lib/auth/queries'
    import MfaEnrollForm from './_components/MfaEnrollForm'

    export const metadata = {
      title: 'MFA Setup | zyncdata',
      description: 'Set up multi-factor authentication for your account',
    }

    export default async function MfaEnrollPage() {
      // Must be logged in (AAL1) to enroll MFA
      const user = await getCurrentUser()
      if (!user) redirect('/auth/login')

      // If MFA already enrolled, redirect to verify or dashboard
      const { hasNoFactors, needsMfaVerification } = await getMfaStatus()
      if (!hasNoFactors && needsMfaVerification) redirect('/auth/mfa-verify')
      if (!hasNoFactors && !needsMfaVerification) redirect('/dashboard')

      return (
        <main className="flex min-h-screen items-center justify-center">
          <MfaEnrollForm />
        </main>
      )
    }
    ```
  - [x]5.2: **IMPORTANT:** Server-side guard checks: (1) user must be authenticated, (2) user must NOT already have MFA enrolled. Prevents re-enrollment or accessing enroll page when already set up
  - [x]5.3: **DELETE** existing `src/app/auth/mfa-enroll/page.test.tsx` — this tests the synchronous stub component and will break with the new async RSC. The new page has server-side redirects and requires different test patterns (mock `@/lib/auth/queries`, test redirect behavior). New page tests are covered in Task 10

- [x]Task 6: Create MFA enrollment client component (AC: #1, #2, #3)
  - [x]6.1: Create `src/app/auth/mfa-enroll/_components/MfaEnrollForm.tsx` (`'use client'`):
    - **Step 1: QR Code Display**
      - On mount (`useEffect`), call `enrollMfaFactor()` from `@/lib/auth/mutations`
      - Display the returned QR code SVG (`data.totp.qr_code`) as a plain `<img>` tag — **Exception to `next/image` rule:** `next/image` does not support SVG data URLs without explicit loader config; use plain `<img>` with explicit `width={200} height={200}` and meaningful `alt` text
      - Show a "Can't scan?" toggle that reveals the TOTP secret (`data.totp.secret`) as plain text in a monospaced font (`font-mono`) for manual entry into authenticator apps. Make text selectable/copyable
      - Store `factorId` (`data.id`) in component state
      - **Enrollment failure handling:** If `enrollMfaFactor()` throws (network error, Supabase down), display an error message ("Failed to set up MFA. Please try again.") with a "Try again" button that re-calls `enrollMfaFactor()`. Do NOT leave the user on a blank page
    - **Step 2: Code Verification**
      - 6-digit input field for TOTP code
      - On submit: (1) call `verifyMfaEnrollmentAction()` server action first for rate limit + validation check, (2) if server action returns `{ error: null }`, then call `verifyMfaEnrollment(factorId, code)` client-side
      - On success: redirect to `/dashboard` via `router.push('/dashboard')` (Story 2.3 will adjust this to show backup codes when implemented)
      - On error from server action: display rate limit or validation error
      - On error from client-side verify: display "Invalid code. Please try again."
    - **UI requirements:**
      - Use shadcn/ui `<Input>`, `<Button>`, `<Label>` components
      - DxT branding (primary color, consistent with LoginForm styling)
      - `focus-visible:ring-2 focus-visible:ring-dxt-primary` on input
      - `aria-label` on all interactive elements
      - `aria-live="polite"` on error region
      - `data-testid` attributes on all testable elements
      - Loading states: spinner during enrollment, disabled button during verification
      - `inputMode="numeric"` and `pattern="[0-9]*"` on TOTP input for mobile keyboards
      - `autoComplete="one-time-code"` on TOTP input
      - `maxLength={6}` on TOTP input
    - **Rate limiting integration:**
      - Call `verifyMfaEnrollmentAction()` server action BEFORE calling `verifyMfaEnrollment()`. Server action returns `{ error, rateLimited }` — if `error` is not null, display error and do NOT call the client-side verify
      - Display rate limit message with amber styling when `rateLimited: true` (same pattern as LoginForm)
  - [x]6.2: Create `src/app/auth/mfa-enroll/_components/MfaEnrollForm.test.tsx`:
    - Test: renders QR code after enrollment
    - Test: shows error and retry button when enrollment fails
    - Test: shows secret text when "Can't scan?" is clicked
    - Test: submits verification code
    - Test: displays error on invalid code
    - Test: displays loading state during enrollment
    - Test: displays loading state during verification
    - Test: accessibility (jest-axe)
    - Mock `@/lib/auth/mutations` at module level

- [x]Task 7: Handle post-enrollment redirect (AC: #2, #4)
  - [x]7.1: After successful MFA verification during enrollment, the user's session upgrades from AAL1 to AAL2. Use `router.push('/dashboard')` from `next/navigation` to redirect
  - [x]7.2: **IMPORTANT:** After `supabase.auth.mfa.verify()` succeeds, Supabase automatically upgrades the session to AAL2. No additional API call needed
  - [x]7.3: Redirect target is `/dashboard`. Story 2.3 (backup codes) will later change this to show backup codes before dashboard. Story 2.6 (route protection) will add middleware auth checks on `/dashboard`

- [x]Task 8: Update auth queries for MFA page guards (AC: #4)
  - [x]8.1: Verify `getCurrentUser()` in `src/lib/auth/queries.ts` works correctly for MFA enrollment page guard. It uses `supabase.auth.getUser()` which returns the user even at AAL1 — this is correct behavior
  - [x]8.2: Verify `getMfaStatus()` correctly detects enrolled vs not-enrolled state. Already confirmed working from Story 2.1

- [x]Task 9: Update login flow for MFA enrollment redirect (AC: #2)
  - [x]9.1: Verify the existing `loginAction` in `src/lib/actions/auth.ts` correctly redirects to `/auth/mfa-enroll` when `hasNoFactors` is true. **Already implemented in Story 2.1 — no changes needed**
  - [x]9.2: Verify the flow: Login -> AAL1 session -> check MFA -> no factors -> redirect `/auth/mfa-enroll` -> enroll + verify -> AAL2 -> redirect `/dashboard`

- [x]Task 10: Unit tests for MFA enrollment (AC: #1, #2, #3)
  - [x]10.1: Ensure test coverage for:
    - `enrollMfaFactor()` — success returns factorId + QR code, error throws
    - `verifyMfaEnrollment()` — success (challenge + verify), invalid code error, challenge error
    - `mfaVerifySchema` — valid/invalid codes
    - `verifyMfaEnrollmentAction` — rate limiting, validation, auth redirect
    - `MfaEnrollForm` — QR display, code entry, error display, loading states, accessibility
    - `MfaEnrollPage` — redirects (not logged in, already enrolled, needs verify)

- [x]Task 11: E2E tests (AC: #1, #2, #3)
  - [x]11.1: Create `tests/e2e/mfa-enroll.spec.ts`:
    - Test: MFA enrollment page renders with QR code area
    - Test: code input accepts 6 digits
    - Test: unauthenticated user redirected to login
    - Test: accessibility (no violations via `@axe-core/playwright`)
  - [x]11.2: Use `data-testid` attributes (established pattern from Story 2.1)
  - [x]11.3: E2E tests may need mock Supabase MFA responses since real TOTP enrollment requires an authenticator app

- [x]Task 12: Final verification
  - [x]12.1: Run `npm run type-check` — must pass
  - [x]12.2: Run `npm run lint` — must pass (0 errors)
  - [x]12.3: Run `npm run test:run` — all unit tests pass (existing + new)
  - [x]12.4: Run `npm run build` — must pass
  - [x]12.5: Run `npm run dev` — verify MFA enrollment page renders at `/auth/mfa-enroll`
  - [x]12.6: Verify no regressions on login flow or landing page

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Server Components by default** — Only `MfaEnrollForm.tsx` needs `'use client'` in this story
2. **Next.js 16 async patterns** — `cookies()`, `headers()`, `params` are all `Promise`-based. Always `await` them
3. **Browser client for MFA operations** — `enrollMfaFactor()` and `verifyMfaEnrollment()` use `createClient()` from `@/lib/supabase/client` (browser client). Supabase MFA APIs operate on the browser session
4. **Server client for page guards** — `getCurrentUser()` and `getMfaStatus()` use `createClient()` from `@/lib/supabase/server` (server client). Page-level auth checks run server-side
5. **Mutations in separate file** — `src/lib/auth/mutations.ts` for write operations, `src/lib/auth/queries.ts` for read operations (per architecture: `src/lib/{domain}/queries.ts` for reads, `src/lib/{domain}/mutations.ts` for writes)
6. **Server Actions in separate files** — `src/lib/actions/mfa.ts`, NEVER inline `'use server'` in client components
7. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes
8. **No barrel files** — import directly from source files
9. **Vitest, NOT Jest** — use `vi.mock()`, `vi.fn()`, `vi.spyOn()`. Never use `jest.*` equivalents
10. **No `dark:` classes** — dark mode not implemented. Light mode only
11. **Zod v4 (classic mode)** — `package.json` has `"zod": "^4.3.6"`. `.issues` not `.errors` for error access
12. **`data-testid` attributes** — on all testable elements (established in Story 2.1)
13. **Prettier rules** — `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`
14. **Lazy rate limiter initialization** — use factory function pattern (same as `getLoginRatelimit()`)
15. **`useActionState()` NOT `useFormState()`** — React 19 renamed the hook

### Supabase Auth MFA Enrollment Flow (Critical)

**The enrollment flow is a 3-step process running CLIENT-SIDE:**

```
1. supabase.auth.mfa.enroll({ factorType: 'totp' })
   → Returns { id: factorId, totp: { qr_code: svgDataUrl, secret: string, uri: string } }
   → QR code is an SVG data URL ready for <img src={qr_code} />

2. supabase.auth.mfa.challenge({ factorId })
   → Returns { id: challengeId }
   → Prepares the server to accept a verification code

3. supabase.auth.mfa.verify({ factorId, challengeId, code })
   → Verifies the 6-digit TOTP code
   → On success: session upgrades from AAL1 to AAL2 automatically
   → On error: throw error with message (display to user)
```

**Key Supabase MFA behaviors:**
- `enroll()` returns an SVG data URL for the QR code — NOT a base64 image. Render with `<img src={qrCode} />`
- `enroll()` also returns `secret` (plain text) for manual entry into authenticator apps
- `challenge()` + `verify()` must be called in sequence — challenge creates a one-time verification window
- After successful `verify()`, the JWT is upgraded to AAL2 — Supabase handles this automatically
- TOTP codes are valid for 30-second intervals with 1-interval clock skew tolerance
- `enroll()` creates a factor in "unverified" state — only becomes "verified" after successful `verify()`
- If user navigates away before verifying, the unverified factor is cleaned up on next `enroll()` call
- All MFA operations use the current session token — must be called from the browser where the session lives

### Rate Limiting Configuration

**Per architecture spec:**
- MFA verification: 3 requests per 5 minutes per **user** (not IP)
- Uses Upstash Redis sliding window
- Key: user ID (from `getCurrentUser()`)

### Existing Infrastructure (DO NOT recreate)

| Component | Location | Usage |
|-----------|----------|-------|
| Supabase server client | `src/lib/supabase/server.ts` | Page guards (`getCurrentUser`, `getMfaStatus`) |
| Supabase browser client | `src/lib/supabase/client.ts` | MFA operations (`enroll`, `challenge`, `verify`) |
| Auth queries | `src/lib/auth/queries.ts` | `getCurrentUser()`, `getMfaStatus()` |
| Login action | `src/lib/actions/auth.ts` | Already redirects to `/auth/mfa-enroll` |
| Auth validation | `src/lib/validations/auth.ts` | `loginSchema` (extend with `mfaVerifySchema`) |
| Rate limit (login) | `src/lib/ratelimit/login.ts` | Pattern reference for lazy init |
| Error codes | `src/lib/errors/codes.ts` | Reuse existing error codes |
| shadcn/ui components | `src/components/ui/` | Button, Input, Label (installed in 2.1) |
| Auth layout | `src/app/auth/layout.tsx` | Dark gradient with ambient orbs |
| Test factories | `tests/factories/user-factory.ts` | `buildUser`, `buildSuperAdmin` |

### What This Story ADDS (New Files)

| File | Purpose |
|------|---------|
| `src/lib/auth/mutations.ts` | `enrollMfaFactor`, `verifyMfaEnrollment` |
| `src/lib/auth/mutations.test.ts` | MFA mutation tests |
| `src/lib/ratelimit/mfa.ts` | MFA rate limiter (3/5min per user) |
| `src/lib/ratelimit/mfa.test.ts` | Rate limiter tests |
| `src/lib/actions/mfa.ts` | `verifyMfaEnrollmentAction` server action |
| `src/lib/actions/mfa.test.ts` | Server action tests |
| `src/app/auth/mfa-enroll/_components/MfaEnrollForm.tsx` | MFA enrollment form (`'use client'`) |
| `src/app/auth/mfa-enroll/_components/MfaEnrollForm.test.tsx` | Form tests + accessibility |
| `tests/e2e/mfa-enroll.spec.ts` | E2E tests |

### What This Story MODIFIES (Existing Files)

| File | Change | Reason |
|------|--------|--------|
| `next.config.ts` | **ADD** `connect-src` to CSP | Browser Supabase client needs to reach `*.supabase.co` |
| `src/app/auth/mfa-enroll/page.tsx` | **REPLACE** stub with real implementation | MFA enrollment page |
| `src/app/auth/mfa-enroll/page.test.tsx` | **DELETE** | Stub tests incompatible with new async RSC page |
| `src/lib/validations/auth.ts` | **ADD** `mfaVerifySchema` + type | TOTP code validation |
| `src/lib/validations/auth.test.ts` | **ADD** MFA schema tests | Test coverage for new schema |

### What This Story Does NOT Include

- **NO backup codes** — Story 2.3 handles backup code generation after MFA enrollment
- **NO MFA verification on login** — Story 2.4 handles MFA login verification flow
- **NO logout** — Story 2.5 handles secure logout
- **NO route protection** — Story 2.6 handles middleware/proxy auth enforcement
- **NO MFA disable/admin management** — MFA is mandatory, cannot be disabled by user
- **NO audit logging** — Epic 7 handles audit logging
- **NO React Query** — Not needed for MFA enrollment (simple client state + mutations)
- **NO additional shadcn/ui installs** — Button, Input, Label already installed in Story 2.1

### Previous Story Intelligence (from Story 2.1)

**Learnings to apply:**

1. **Zod v4 uses `.issues` not `.errors`** — updated in `loginAction`, apply same pattern in `mfaAction`
2. **`isRedirectError(err)` pattern** — rethrow redirect errors in try/catch blocks. Import from `next/dist/client/components/redirect-error`
3. **Lazy rate limiter initialization** — `getLoginRatelimit()` uses lazy singleton. Apply same pattern for `getMfaRatelimit()`
4. **`useActionState()` for form state** — React 19 pattern, NOT `useFormState()`
5. **`useFormStatus()` must be INSIDE `<form>`** — extract to separate `SubmitButton` child component
6. **Lucide React icons** — use `lucide-react` for icons (Eye, EyeOff already used in LoginForm)
7. **Touch targets min 32px** — password toggle was increased to h-8 w-8 in code review. Apply same sizing
8. **Generic error messages** — no information leakage about MFA state or enrollment
9. **Open redirect prevention** — already handled in auth callback (Story 2.1)
10. **`@testing-library/user-event`** — installed in Story 2.1, available for tests

**Code review learnings from Story 2.1:**
- Strip `dark:` classes from any shadcn/ui components
- Lazy initialization for rate limiters (not module-level)
- `data-testid` attributes on all testable elements
- Touch targets min 32px for mobile accessibility

### Git Intelligence (Recent Commits)

```
350be1b feat(story-2.1): initial super admin account & login
43021b2 docs(epic-2-prep): complete all preparation tasks for Epic 2
0a5855e test(story-1.4): add 18 guardrail tests via TEA automate workflow
3c8eae2 fix(story-1.2): update TINEDY and ENEOS URLs to zyncdata.app domain
70eb2c8 feat(story-1.4): testing infrastructure, error boundaries & shared utilities
```

**Patterns observed:**
- Commit format: `type(story-X.Y): description`
- Code reviews generate fix commits
- 160 unit tests across test files currently passing
- Established: `data-testid`, `cn()`, DxT branding, accessibility patterns

### Project Structure After This Story

```
src/
├── app/
│   ├── auth/
│   │   ├── layout.tsx                     # Existing: Dark gradient auth layout
│   │   ├── login/
│   │   │   ├── page.tsx                   # Existing
│   │   │   └── _components/
│   │   │       ├── LoginForm.tsx          # Existing
│   │   │       └── LoginForm.test.tsx     # Existing
│   │   ├── mfa-enroll/
│   │   │   ├── page.tsx                   # MODIFIED: Real enrollment page (RSC)
│   │   │   └── _components/
│   │   │       ├── MfaEnrollForm.tsx      # NEW: MFA enrollment form ('use client')
│   │   │       └── MfaEnrollForm.test.tsx # NEW: Form tests
│   │   ├── mfa-verify/
│   │   │   └── page.tsx                   # Existing: Stub (Story 2.4)
│   │   ├── register/
│   │   │   └── page.tsx                   # Existing: Redirect to login
│   │   └── callback/
│   │       └── route.ts                   # Existing
│   ├── dashboard/
│   │   └── page.tsx                       # Existing: Stub
│   └── ...
├── lib/
│   ├── auth/
│   │   ├── queries.ts                     # Existing: signInWithEmail, getMfaStatus, getCurrentUser
│   │   ├── queries.test.ts                # Existing
│   │   ├── mutations.ts                   # NEW: enrollMfaFactor, verifyMfaEnrollment
│   │   └── mutations.test.ts              # NEW
│   ├── actions/
│   │   ├── auth.ts                        # Existing: loginAction
│   │   ├── auth.test.ts                   # Existing
│   │   ├── mfa.ts                         # NEW: verifyMfaEnrollmentAction
│   │   └── mfa.test.ts                    # NEW
│   ├── ratelimit/
│   │   ├── login.ts                       # Existing
│   │   ├── login.test.ts                  # Existing
│   │   ├── mfa.ts                         # NEW: getMfaRatelimit (3/5min per user)
│   │   └── mfa.test.ts                    # NEW
│   ├── validations/
│   │   ├── auth.ts                        # MODIFIED: Added mfaVerifySchema
│   │   └── auth.test.ts                   # MODIFIED: Added MFA schema tests
│   └── ...
└── proxy.ts                               # Existing: Placeholder (Story 2.6)
```

### Latest Technology Notes

**Supabase Auth MFA API (@supabase/supabase-js):**
- `mfa.enroll({ factorType: 'totp' })` → returns `{ id, totp: { qr_code, secret, uri } }`
- `qr_code` is an SVG data URL — render directly in `<img src={...} />`
- `secret` is the TOTP secret for manual entry
- `mfa.challenge({ factorId })` → returns `{ id: challengeId }`
- `mfa.verify({ factorId, challengeId, code })` → verifies code, upgrades session to AAL2
- Codes valid for 30-second intervals, 1-interval clock skew tolerance
- Unverified factors are cleaned up on next `enroll()` call

**QR Code Display:**
- Supabase returns an SVG data URL string (NOT raw SVG markup)
- Use: `<img src={qrCode} alt="Scan this QR code with your authenticator app" width={200} height={200} />`
- **Exception to `next/image` rule:** `next/image` does not support SVG data URLs without explicit loader configuration. Use plain `<img>` tag for the QR code only. This is the ONLY place in the codebase where `<img>` is acceptable
- Provide meaningful `alt` text for accessibility

**CSP Configuration (CRITICAL — Task 0):**
- The current `next.config.ts` CSP has NO `connect-src` directive — it defaults to `default-src 'self'`
- This blocks ALL browser fetch requests to external domains including `*.supabase.co`
- MFA enrollment calls `supabase.auth.mfa.enroll()` from the browser — this is a direct HTTP request to the Supabase API
- MUST add `connect-src 'self' https://*.supabase.co wss://*.supabase.co;` to the CSP header
- Without this fix, MFA enrollment will **silently fail** with no visible error (only a CSP violation in browser console)

**Client vs Server for MFA:**
- **Client-side (browser client):** `enroll()`, `challenge()`, `verify()` — these need the browser session
- **Server-side (server client):** `getCurrentUser()`, `getMfaStatus()`, `getAuthenticatorAssuranceLevel()`, `listFactors()` — these read JWT from cookies

### Environment Variables Required

```env
# Already configured from Stories 1.x and 2.1:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

No new environment variables needed for this story.

### Mock Strategy for Tests

**Unit tests (Vitest):**
- Mock `@/lib/supabase/client` for MFA mutation tests: `vi.mock('@/lib/supabase/client')`
- Mock `@/lib/supabase/server` for page guard tests: `vi.mock('@/lib/supabase/server')`
- Mock `@/lib/auth/mutations` for component tests: `vi.mock('@/lib/auth/mutations')`
- Mock `@upstash/ratelimit` and `@upstash/redis` for rate limiter tests
- Mock `next/navigation` for redirect tests: `vi.mock('next/navigation')`

**E2E tests (Playwright):**
- MFA enrollment requires real Supabase or mock API responses
- Consider mocking at network level (`page.route()`) for MFA API calls
- Use `data-testid` attributes for selectors

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rate Limiting Implementation]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Security Rules]
- [Source: _bmad-output/implementation-artifacts/2-1-initial-super-admin-account-login.md]
- [Source: Supabase Auth MFA TOTP Documentation — https://supabase.com/docs/guides/auth/auth-mfa]
- [Source: Supabase Auth MFA API — supabase.auth.mfa.enroll, challenge, verify]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed pre-existing login page test timeout: `src/app/auth/login/page.test.tsx` — redirect mock wasn't throwing, causing `await LoginPage()` to hang. Fixed by making mock redirect throw `NEXT_REDIRECT` (consistent with MFA page test pattern).

### Completion Notes List

- Task 0: Added `connect-src 'self' https://*.supabase.co wss://*.supabase.co;` to CSP in `next.config.ts` — required for browser Supabase client MFA API calls.
- Task 1: Added `mfaVerifySchema` Zod schema validating 6-digit numeric codes. 11 new test cases covering valid codes, invalid lengths, non-numeric, empty, special characters.
- Task 2: Created `src/lib/auth/mutations.ts` with `enrollMfaFactor()` and `verifyMfaEnrollment()` using browser Supabase client. 5 tests covering success/error paths for enroll, challenge, and verify.
- Task 3: Created `src/lib/ratelimit/mfa.ts` with lazy-init `getMfaRatelimit()` — 3 requests/5 min per user. Pattern matches `getLoginRatelimit()`. 3 tests.
- Task 4: Created `src/lib/actions/mfa.ts` server action with auth check, rate limiting by user ID, Zod validation. Returns `{ error, rateLimited }` for client consumption. 8 tests covering auth redirect, rate limiting, validation, success path.
- Task 5: Replaced stub `page.tsx` with async RSC — server-side guards redirect unauthenticated users to login, already-enrolled users to mfa-verify/dashboard. Deleted old stub test.
- Task 6: Created `MfaEnrollForm` client component with QR code display via `<img>`, "Can't scan?" secret toggle, 6-digit TOTP input (numeric keyboard, autocomplete), error/loading states, rate limit error styling, retry on enrollment failure. 10 tests including accessibility audit.
- Task 7: Post-enrollment redirect via `router.push('/dashboard')` after successful `verifyMfaEnrollment()`.
- Tasks 8-9: Verified `getCurrentUser()`, `getMfaStatus()`, and `loginAction` redirect chain — all working correctly from Story 2.1. No changes needed.
- Task 10: Created new page tests for async RSC (5 tests: redirect to login, redirect to mfa-verify, redirect to dashboard, render form when no factors, metadata export).
- Task 11: Created E2E tests with unauthenticated redirect test, accessibility audit, and mock-based authenticated flow test.
- Task 12: All verifications pass — `type-check` clean, `lint` clean, 222 unit tests passing (29 files), `build` succeeds.

### Change Log

- 2026-02-04: Story 2.2 implemented — TOTP MFA enrollment flow (CSP, validation, mutations, rate limiting, server action, page, form component, E2E tests)
- 2026-02-04: Fixed pre-existing login page test timeout (redirect mock pattern)
- 2026-02-04: **Code Review fixes** — H1: fixed act() warnings in MfaEnrollForm test; H2: added ref-based race condition guard to enrollment retry; H3: rewrote misleading E2E test; H4: documented enrollment rate limiting (Supabase built-in); M3: replaced factorId non-null assertion with null guard; M4: added singleton test for rate limiter; M5: added form submission happy path + client verify error tests; L2: added aria-describedby linking error to input; L3: changed secret text to `<output>` element; M2: deleted `nul` Windows artifact, added to .gitignore

### File List

**New Files:**
- `src/lib/auth/mutations.ts` — MFA enrollment/verification mutations (browser client)
- `src/lib/auth/mutations.test.ts` — Mutation unit tests
- `src/lib/ratelimit/mfa.ts` — MFA rate limiter (3/5min per user, lazy init)
- `src/lib/ratelimit/mfa.test.ts` — Rate limiter tests
- `src/lib/actions/mfa.ts` — MFA verification server action
- `src/lib/actions/mfa.test.ts` — Server action tests
- `src/app/auth/mfa-enroll/_components/MfaEnrollForm.tsx` — MFA enrollment form (client component)
- `src/app/auth/mfa-enroll/_components/MfaEnrollForm.test.tsx` — Form tests + accessibility
- `tests/e2e/mfa-enroll.spec.ts` — E2E tests

**Modified Files:**
- `next.config.ts` — Added `connect-src` to CSP for Supabase browser calls
- `src/lib/validations/auth.ts` — Added `mfaVerifySchema` and `MfaVerifyFormData` type
- `src/lib/validations/auth.test.ts` — Added 11 MFA schema test cases
- `src/app/auth/mfa-enroll/page.tsx` — Replaced stub with async RSC (auth guards + MfaEnrollForm)
- `src/app/auth/mfa-enroll/page.test.tsx` — Replaced stub tests with async RSC tests
- `src/app/auth/login/page.test.tsx` — Fixed redirect mock pattern (pre-existing timeout bug)
- `.gitignore` — Added `nul` to Windows artifacts section

**Files created by other workflows (not part of this story scope):**
- `src/app/auth/callback/route.test.ts`
- `src/app/auth/mfa-verify/page.test.tsx`
- `src/app/auth/register/page.test.tsx`
- `src/app/dashboard/page.test.tsx`
- `tests/e2e/auth-guardrails.spec.ts`
