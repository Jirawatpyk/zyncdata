# Auth Testing Patterns — Epic 2 Reference

**Date:** 2026-02-04
**Owner:** Murat (TEA Agent) / Dana (QA Engineer)
**Status:** Complete
**Epic 2 Prep Task:** Parallel (established before Story 2.1)

---

## Executive Summary

Risk assessment: Auth is the **highest-risk domain** in Epic 2 — every story depends on it, MFA adds complexity layers, and AAL enforcement creates state-dependent behavior. This document establishes testing patterns for:

1. Mocking Supabase Auth in unit tests (Vitest)
2. Testing MFA flows (TOTP enroll, verify, backup codes)
3. Testing Server Layout Guards (requireAuth, RBAC)
4. Auth factories for different roles and AAL levels
5. E2E auth flows (Playwright)

All patterns build on existing infrastructure from Epic 1.

---

## 1. Supabase Auth Module Mocking (Vitest)

### 1.1 Base Mock Pattern

Building on the established `vi.mock('@/lib/supabase/server')` pattern from Story 1.3/1.4:

```typescript
// src/lib/auth/__mocks__/supabase-auth.ts
// Reusable mock factory for Supabase Auth

import { vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

// ── Mock User Factory ──────────────────────────────
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-001',
    email: 'test@example.com',
    app_metadata: { role: 'user' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User
}

export function createMockAdminUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'admin-uuid-001',
    email: 'admin@example.com',
    app_metadata: { role: 'admin' },
    ...overrides,
  })
}

export function createMockSuperAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'super-admin-uuid-001',
    email: 'superadmin@example.com',
    app_metadata: { role: 'super_admin' },
    ...overrides,
  })
}

// ── Mock MFA Data ──────────────────────────────────
export function createMockTotpFactor(overrides = {}) {
  return {
    id: 'factor-uuid-001',
    type: 'totp' as const,
    friendly_name: 'My Authenticator',
    status: 'verified' as const,
    ...overrides,
  }
}

export function createMockEnrollResponse(overrides = {}) {
  return {
    id: 'factor-uuid-001',
    type: 'totp' as const,
    totp: {
      qr_code: 'data:image/svg+xml;base64,PHN2Zy...', // SVG data URL
      secret: 'JBSWY3DPEHPK3PXP',
      uri: 'otpauth://totp/ZyncData:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ZyncData',
    },
    friendly_name: 'My Authenticator',
    ...overrides,
  }
}

// ── Mock Supabase Client Builder ───────────────────
export function createMockSupabaseClient(options: {
  user?: User | null
  getUserError?: Error | null
  aalLevel?: { currentLevel: string; nextLevel: string }
  factors?: { totp: Array<ReturnType<typeof createMockTotpFactor>> }
} = {}) {
  const {
    user = createMockUser(),
    getUserError = null,
    aalLevel = { currentLevel: 'aal1', nextLevel: 'aal1' },
    factors = { totp: [] },
  } = options

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: getUserError,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: user ? { user, access_token: 'mock-token' } : null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user, session: { user, access_token: 'mock-token' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      mfa: {
        enroll: vi.fn().mockResolvedValue({
          data: createMockEnrollResponse(),
          error: null,
        }),
        challenge: vi.fn().mockResolvedValue({
          data: { id: 'challenge-uuid-001' },
          error: null,
        }),
        verify: vi.fn().mockResolvedValue({
          data: { user, session: { user, access_token: 'mock-aal2-token' } },
          error: null,
        }),
        challengeAndVerify: vi.fn().mockResolvedValue({
          data: { user, session: { user, access_token: 'mock-aal2-token' } },
          error: null,
        }),
        listFactors: vi.fn().mockResolvedValue({
          data: factors,
          error: null,
        }),
        unenroll: vi.fn().mockResolvedValue({ data: null, error: null }),
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: aalLevel,
          error: null,
        }),
      },
    },
    from: vi.fn(), // extend as needed for specific table mocks
  }
}
```

### 1.2 Usage in Unit Tests

```typescript
// src/lib/auth/guard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server client BEFORE imports
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guard'
import {
  createMockSupabaseClient,
  createMockUser,
  createMockAdminUser,
  createMockSuperAdmin,
} from './__mocks__/supabase-auth'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user and role for authenticated user', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const result = await requireAuth()

    expect(result.user.email).toBe('test@example.com')
    expect(result.role).toBe('user')
  })

  it('should redirect to /login when no user', async () => {
    const mockClient = createMockSupabaseClient({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should redirect to /login on auth error', async () => {
    const mockClient = createMockSupabaseClient({
      user: null,
      getUserError: new Error('Invalid token'),
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login')
  })

  it('should enforce minimum role — admin access for admin', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockAdminUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const result = await requireAuth('admin')
    expect(result.role).toBe('admin')
  })

  it('should redirect user role from admin-required route', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    await expect(requireAuth('admin')).rejects.toThrow('REDIRECT:/unauthorized')
    expect(redirect).toHaveBeenCalledWith('/unauthorized')
  })

  it('should allow super_admin on admin-required route', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockSuperAdmin() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const result = await requireAuth('admin')
    expect(result.role).toBe('super_admin')
  })

  it('should redirect admin from super_admin-required route', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockAdminUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    await expect(requireAuth('super_admin')).rejects.toThrow('REDIRECT:/unauthorized')
  })
})
```

### 1.3 Redirect Mock Pattern

Next.js `redirect()` throws a special error internally. For testing, we simulate this:

```typescript
// Pattern: Mock redirect to throw, then catch in test
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// Assert redirect was called
await expect(requireAuth()).rejects.toThrow('REDIRECT:/login')
expect(redirect).toHaveBeenCalledWith('/login')
```

**Why this works:** The real `redirect()` throws a `NEXT_REDIRECT` error. Our mock simulates this behavior so the guard function doesn't continue executing after redirect.

---

## 2. MFA Flow Testing Patterns

### 2.1 TOTP Enrollment (Story 2.2)

```typescript
// src/lib/auth/mfa.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createMockUser,
  createMockEnrollResponse,
  createMockTotpFactor,
} from './__mocks__/supabase-auth'

describe('MFA Enrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enroll TOTP factor and return QR code', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'My Authenticator',
      issuer: 'ZyncData',
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.totp.qr_code).toContain('data:image/svg+xml')
    expect(data!.totp.secret).toBeDefined()
    expect(data!.totp.uri).toContain('otpauth://totp/')
    expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
      factorType: 'totp',
      friendlyName: 'My Authenticator',
      issuer: 'ZyncData',
    })
  })

  it('should activate factor via challengeAndVerify', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockUser() })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: 'factor-uuid-001',
      code: '123456',
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(supabase.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-uuid-001',
      code: '123456',
    })
  })

  it('should handle invalid TOTP code', async () => {
    const mockClient = createMockSupabaseClient({ user: createMockUser() })
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid TOTP code', status: 422 },
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: 'factor-uuid-001',
      code: '000000',
    })

    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error!.message).toBe('Invalid TOTP code')
  })
})
```

### 2.2 MFA Login Verification (Story 2.4)

```typescript
describe('MFA Login Verification', () => {
  it('should detect MFA required (aal1 → aal2 needed)', async () => {
    const mockClient = createMockSupabaseClient({
      user: createMockUser(),
      aalLevel: { currentLevel: 'aal1', nextLevel: 'aal2' },
      factors: { totp: [createMockTotpFactor()] },
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    expect(data!.currentLevel).toBe('aal1')
    expect(data!.nextLevel).toBe('aal2')
    // App should show MFA verification screen
  })

  it('should detect MFA not required (no factors enrolled)', async () => {
    const mockClient = createMockSupabaseClient({
      user: createMockUser(),
      aalLevel: { currentLevel: 'aal1', nextLevel: 'aal1' },
      factors: { totp: [] },
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    expect(data!.currentLevel).toBe('aal1')
    expect(data!.nextLevel).toBe('aal1')
    // App should proceed to dashboard (no MFA needed)
  })

  it('should detect already at aal2', async () => {
    const mockClient = createMockSupabaseClient({
      user: createMockUser(),
      aalLevel: { currentLevel: 'aal2', nextLevel: 'aal2' },
      factors: { totp: [createMockTotpFactor()] },
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    const supabase = await createServerClient()
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    expect(data!.currentLevel).toBe('aal2')
    // App should proceed — user already verified
  })
})
```

### 2.3 Backup Code Testing (Story 2.3 — Custom Implementation)

```typescript
// src/lib/auth/backup-codes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, createMockUser } from './__mocks__/supabase-auth'

// Pattern for testing custom backup codes implementation
describe('Backup Codes', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockSupabaseClient({ user: createMockUser() })

    // Mock the backup_codes table operations
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'code-uuid-001' },
              error: null,
            }),
          }),
        }),
      }),
    })
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockClient.from = vi.fn((table: string) => {
      if (table === 'backup_codes') {
        return {
          delete: mockDelete,
          insert: mockInsert,
          select: mockSelect,
          update: mockUpdate,
        }
      }
      return {}
    }) as any

    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)
  })

  it('should generate exactly 8 backup codes', async () => {
    // Import the function under test (after mocks are set up)
    const { generateBackupCodes } = await import('@/lib/auth/backup-codes')

    const result = await generateBackupCodes()

    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(8)
    // Each code should be 8 characters uppercase hex
    result.data!.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]{8}$/)
    })
  })

  it('should delete old codes before inserting new ones', async () => {
    const { generateBackupCodes } = await import('@/lib/auth/backup-codes')

    await generateBackupCodes()

    // Verify delete was called before insert
    expect(mockClient.from).toHaveBeenCalledWith('backup_codes')
  })

  it('should return error when not authenticated', async () => {
    const unauthClient = createMockSupabaseClient({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(unauthClient as any)

    const { generateBackupCodes } = await import('@/lib/auth/backup-codes')
    const result = await generateBackupCodes()

    expect(result.data).toBeNull()
    expect(result.error).toBe('Not authenticated')
  })
})
```

---

## 3. Server Layout Guard Testing

### 3.1 Testing Admin Layout (RSC Pattern)

Follows the established RSC testing pattern from Story 1.3 — call component as async function:

```typescript
// src/app/admin/layout.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: vi.fn(),
}))

import { requireAuth } from '@/lib/auth/guard'
import AdminLayout from '@/app/admin/layout'

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when user has admin role', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com' } as any,
      role: 'admin',
    })

    const jsx = await AdminLayout({ children: <div>Admin Content</div> })
    // JSX should contain the children
    expect(jsx).toBeDefined()
    expect(requireAuth).toHaveBeenCalledWith('admin')
  })

  it('should call requireAuth with admin minimum role', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: 'sa-1' } as any,
      role: 'super_admin',
    })

    await AdminLayout({ children: <div>Content</div> })

    expect(requireAuth).toHaveBeenCalledWith('admin')
  })
})
```

### 3.2 Testing MFA-Protected Layout

```typescript
// src/app/(auth)/mfa/layout.test.tsx
describe('MFA Verification Layout', () => {
  it('should redirect to /login if no user', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('REDIRECT:/login'))

    await expect(MfaLayout({ children: <div /> })).rejects.toThrow('REDIRECT:/login')
  })

  it('should redirect to /dashboard if already at aal2', async () => {
    // Mock: user exists, AAL already at aal2
    vi.mocked(requireAuth).mockResolvedValue({
      user: createMockUser() as any,
      role: 'admin',
    })

    // Mock AAL check
    const mockClient = createMockSupabaseClient({
      aalLevel: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })
    vi.mocked(createServerClient).mockResolvedValue(mockClient as any)

    // Should redirect since already verified
    await expect(MfaLayout({ children: <div /> })).rejects.toThrow('REDIRECT:/dashboard')
  })
})
```

---

## 4. Auth Factories (Extend Existing)

### 4.1 Extend User Factory with Auth Fields

The existing `tests/factories/user-factory.ts` needs auth-specific extensions:

```typescript
// tests/factories/auth-factory.ts
// Extends existing user-factory.ts with auth-specific builders

import { faker } from '@faker-js/faker'
import { buildUser, buildAdminUser, buildSuperAdmin } from './user-factory'

// ── Auth State Builders ────────────────────────────

export type AuthState = {
  isAuthenticated: boolean
  user: ReturnType<typeof buildUser> | null
  aalLevel: 'aal1' | 'aal2'
  hasMfaEnrolled: boolean
  factorId: string | null
}

export function buildAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    isAuthenticated: true,
    user: buildUser(),
    aalLevel: 'aal1',
    hasMfaEnrolled: false,
    factorId: null,
    ...overrides,
  }
}

export function buildMfaAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return buildAuthState({
    aalLevel: 'aal2',
    hasMfaEnrolled: true,
    factorId: faker.string.uuid(),
    ...overrides,
  })
}

export function buildUnauthenticatedState(): AuthState {
  return {
    isAuthenticated: false,
    user: null,
    aalLevel: 'aal1',
    hasMfaEnrolled: false,
    factorId: null,
  }
}

// ── Backup Code Builder ────────────────────────────

export function buildBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    faker.string.hexadecimal({ length: 8, casing: 'upper', prefix: '' })
  )
}

// ── Login Credentials Builder ──────────────────────

export type LoginCredentials = {
  email: string
  password: string
}

export function buildLoginCredentials(overrides: Partial<LoginCredentials> = {}): LoginCredentials {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  }
}

export function buildSuperAdminCredentials(): LoginCredentials {
  return {
    email: 'superadmin@dxt-portal.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'test-password-123',
  }
}
```

---

## 5. E2E Auth Patterns (Playwright)

### 5.1 Extend Existing Fixtures

Build on `tests/support/fixtures/merged-fixtures.ts`:

```typescript
// tests/support/fixtures/auth-fixtures.ts
import { test as base, type Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page         // existing — basic auth
  adminPage: Page                 // new — admin role
  superAdminPage: Page            // new — super admin role
  mfaVerifiedPage: Page           // new — aal2 session
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page, {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    })
    await use(page)
  },

  adminPage: async ({ page }, use) => {
    await loginViaUI(page, {
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    })
    await use(page)
  },

  superAdminPage: async ({ page }, use) => {
    await loginViaUI(page, {
      email: process.env.TEST_SUPER_ADMIN_EMAIL!,
      password: process.env.TEST_SUPER_ADMIN_PASSWORD!,
    })
    // If MFA is enrolled, will need to verify
    // This is handled by the MFA verification helper below
    await use(page)
  },

  mfaVerifiedPage: async ({ page }, use) => {
    await loginViaUI(page, {
      email: process.env.TEST_MFA_USER_EMAIL!,
      password: process.env.TEST_MFA_USER_PASSWORD!,
    })
    // After login, should be on MFA verification page
    await verifyMfaViaUI(page, process.env.TEST_MFA_TOTP_SECRET!)
    await use(page)
  },
})

// ── Helpers ────────────────────────────────────────

async function loginViaUI(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/login')
  await page.getByTestId('email-input').fill(credentials.email)
  await page.getByTestId('password-input').fill(credentials.password)
  await page.getByTestId('login-submit').click()
  // Wait for either dashboard or MFA page
  await page.waitForURL(/\/(dashboard|mfa)/)
}

async function verifyMfaViaUI(page: Page, totpSecret: string) {
  // Generate TOTP code from secret (use otplib or similar)
  // For E2E: use a test TOTP secret and generate code dynamically
  const { authenticator } = await import('otplib')
  const code = authenticator.generate(totpSecret)

  await page.getByTestId('mfa-code-input').fill(code)
  await page.getByTestId('mfa-verify-submit').click()
  await page.waitForURL('/dashboard/**')
}
```

### 5.2 E2E Test Examples

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '../../support/fixtures/auth-fixtures'

test.describe('Login Flow', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('should login successfully and redirect to dashboard', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('wrong@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('login-submit').click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})

// tests/e2e/auth/rbac.spec.ts
test.describe('RBAC Enforcement', () => {
  test('admin can access /admin', async ({ adminPage }) => {
    await adminPage.goto('/admin')
    await expect(adminPage).toHaveURL('/admin')
  })

  test('regular user cannot access /admin', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin')
    await expect(authenticatedPage).toHaveURL('/unauthorized')
  })

  test('admin cannot access /admin/users (super_admin only)', async ({ adminPage }) => {
    await adminPage.goto('/admin/users')
    await expect(adminPage).toHaveURL('/unauthorized')
  })

  test('super_admin can access /admin/users', async ({ superAdminPage }) => {
    await superAdminPage.goto('/admin/users')
    await expect(superAdminPage).toHaveURL('/admin/users')
  })
})

// tests/e2e/auth/mfa.spec.ts
test.describe('MFA Flow', () => {
  test('should require MFA verification after login', async ({ page }) => {
    // Login as user with MFA enrolled
    await page.goto('/login')
    await page.getByTestId('email-input').fill(process.env.TEST_MFA_USER_EMAIL!)
    await page.getByTestId('password-input').fill(process.env.TEST_MFA_USER_PASSWORD!)
    await page.getByTestId('login-submit').click()

    // Should redirect to MFA verification
    await expect(page).toHaveURL('/mfa/verify')
    await expect(page.getByTestId('mfa-code-input')).toBeVisible()
  })

  test('should proceed to dashboard after MFA verification', async ({ mfaVerifiedPage }) => {
    await expect(mfaVerifiedPage).toHaveURL(/\/dashboard/)
  })
})
```

### 5.3 TOTP Code Generation for E2E

For E2E tests that need real TOTP codes:

```bash
npm install --save-dev otplib
```

```typescript
// tests/support/helpers/totp-helper.ts
import { authenticator } from 'otplib'

export function generateTotpCode(secret: string): string {
  return authenticator.generate(secret)
}

export function verifyTotpCode(secret: string, code: string): boolean {
  return authenticator.verify({ token: code, secret })
}
```

**E2E env vars needed:**
```bash
# .env.test
TEST_USER_EMAIL=testuser@dxt-portal.com
TEST_USER_PASSWORD=...
TEST_ADMIN_EMAIL=testadmin@dxt-portal.com
TEST_ADMIN_PASSWORD=...
TEST_SUPER_ADMIN_EMAIL=superadmin@dxt-portal.com
TEST_SUPER_ADMIN_PASSWORD=...
TEST_MFA_USER_EMAIL=mfauser@dxt-portal.com
TEST_MFA_USER_PASSWORD=...
TEST_MFA_TOTP_SECRET=JBSWY3DPEHPK3PXP  # Known test TOTP secret
```

---

## 6. Testing Decision Matrix

| What to Test | Level | Tool | Mock Strategy |
|---|---|---|---|
| `requireAuth()` guard logic | Unit | Vitest | Mock `createServerClient` |
| RBAC role hierarchy | Unit | Vitest | Mock `createServerClient` + user roles |
| MFA enroll/verify logic | Unit | Vitest | Mock `supabase.auth.mfa.*` |
| Backup code generation | Unit | Vitest | Mock `createServerClient` + from() |
| Backup code verification | Unit | Vitest | Mock `createServerClient` + from() |
| AAL level detection | Unit | Vitest | Mock `getAuthenticatorAssuranceLevel` |
| Server Layout Guards | Unit | Vitest | Mock `requireAuth` |
| Login Server Action | Unit | Vitest | Mock `createServerClient` + redirect |
| Login page UI | E2E | Playwright | Real Supabase (test user) |
| MFA enrollment UI | E2E | Playwright | Real Supabase + otplib |
| MFA verification UI | E2E | Playwright | Real Supabase + test TOTP secret |
| RBAC route protection | E2E | Playwright | Real Supabase (multiple test users) |
| Session expiry handling | E2E | Playwright | Real Supabase + cookie manipulation |

---

## 7. Key Principles

1. **Unit tests mock Supabase entirely** — no network calls, fast, deterministic
2. **E2E tests use real Supabase** — test actual auth flows against test environment
3. **Never mock `redirect()` as no-op** — it must throw to prevent code after redirect from executing
4. **Test all AAL states** — `aal1` (no MFA), `aal1→aal2` (MFA required), `aal2` (verified)
5. **Test all role permutations** — user, admin, super_admin for each protected route
6. **Backup codes need custom mocking** — Supabase has no built-in support
7. **Use `getUser()` assertions, never `getSession()`** — verify tests don't rely on insecure patterns

---

## 8. File Organization

```
src/
└── lib/auth/
    ├── __mocks__/
    │   └── supabase-auth.ts        # Shared mock factories (Section 1.1)
    ├── guard.ts                     # requireAuth implementation
    ├── guard.test.ts                # Guard unit tests (Section 1.2)
    ├── backup-codes.ts              # Backup codes implementation
    └── backup-codes.test.ts         # Backup codes unit tests (Section 2.3)

tests/
├── factories/
│   ├── user-factory.ts              # Existing (Epic 1)
│   ├── system-factory.ts            # Existing (Epic 1)
│   └── auth-factory.ts              # NEW: Auth state builders (Section 4)
├── support/
│   ├── fixtures/
│   │   ├── merged-fixtures.ts       # Existing (Epic 1)
│   │   └── auth-fixtures.ts         # NEW: Role-specific fixtures (Section 5.1)
│   └── helpers/
│       ├── auth-helper.ts           # Existing (Epic 1)
│       ├── api-helper.ts            # Existing (Epic 1)
│       └── totp-helper.ts           # NEW: TOTP code generation (Section 5.3)
└── e2e/
    └── auth/
        ├── login.spec.ts            # Login E2E tests
        ├── mfa.spec.ts              # MFA flow E2E tests
        └── rbac.spec.ts             # RBAC enforcement E2E tests
```

---

## Sources

- Project: existing test patterns from Stories 1.1-1.4
- TEA Knowledge Base: auth-session, fixture-architecture, data-factories, component-tdd
- Supabase MFA API research: `research-supabase-mfa-api.md`
- Next.js 16 proxy.ts research: `research-nextjs16-proxy-route-protection.md`
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
