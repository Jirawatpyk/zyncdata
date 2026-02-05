import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { requireAuth, requireApiAuth, hasMinimumRole, isAuthError } from './guard'
import type { AuthResult, Role } from './guard'

const mockGetUser = vi.fn()
const mockGetAuthenticatorAssuranceLevel = vi.fn()
const mockListFactors = vi.fn()
const mockRedirect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        mfa: {
          getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
          listFactors: mockListFactors,
        },
      },
    }),
  ),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

function buildMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: { role: 'user' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Default: user has a verified TOTP factor
function mockVerifiedFactors() {
  mockListFactors.mockResolvedValue({
    data: { totp: [{ id: 'factor-1', status: 'verified' }] },
  })
}

// User has no MFA factors enrolled
function mockNoFactors() {
  mockListFactors.mockResolvedValue({ data: { totp: [] } })
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })
    mockVerifiedFactors()
  })

  it('should return user and role when authenticated (AAL2 complete)', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireAuth()

    expect(result.user).toEqual(mockUser)
    expect(result.role).toBe('admin')
  })

  it('should redirect to /auth/login when not authenticated (getUser returns null)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should redirect to /auth/login when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Session expired'),
    })

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should redirect to /auth/mfa-verify when user is at AAL1 (MFA not yet verified)', async () => {
    const mockUser = buildMockUser()
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    })

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-verify')
  })

  it('should redirect to /auth/mfa-enroll when user has no verified factors', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    })
    mockNoFactors()

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-enroll')
  })

  it('should allow access when user is at AAL2 (MFA verified)', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'super_admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireAuth()

    expect(result.user).toEqual(mockUser)
    expect(result.role).toBe('super_admin')
  })

  it('should redirect to /unauthorized when role is below minimum (user tries admin route)', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'user' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    await expect(requireAuth('admin')).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/unauthorized')
  })

  it('should allow access when role meets minimum (admin on admin route)', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireAuth('admin')

    expect(result.user).toEqual(mockUser)
    expect(result.role).toBe('admin')
  })

  it('should allow access when role exceeds minimum (super_admin on admin route)', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'super_admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireAuth('admin')

    expect(result.user).toEqual(mockUser)
    expect(result.role).toBe('super_admin')
  })

  it('should default role to user when app_metadata.role is missing', async () => {
    const mockUser = buildMockUser({ app_metadata: {} })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireAuth()

    expect(result.role).toBe('user')
  })
})

describe('hasMinimumRole', () => {
  it('should return true when role meets minimum', () => {
    expect(hasMinimumRole('admin', 'admin')).toBe(true)
  })

  it('should return true when role exceeds minimum', () => {
    expect(hasMinimumRole('super_admin', 'admin')).toBe(true)
  })

  it('should return false when role is below minimum', () => {
    expect(hasMinimumRole('user', 'admin')).toBe(false)
  })

  it('should return true for super_admin on any minimum', () => {
    expect(hasMinimumRole('super_admin', 'user')).toBe(true)
    expect(hasMinimumRole('super_admin', 'admin')).toBe(true)
    expect(hasMinimumRole('super_admin', 'super_admin')).toBe(true)
  })

  it('should return true for user on user minimum', () => {
    expect(hasMinimumRole('user', 'user')).toBe(true)
  })

  it('should return false for user on admin minimum', () => {
    expect(hasMinimumRole('user', 'admin')).toBe(false)
  })

  it('should handle unknown role as having no hierarchy level', () => {
    // Runtime safety: app_metadata.role could contain unexpected values
    // An unknown role should NOT pass any minimum role check
    const unknownRole = 'moderator' as Role
    expect(hasMinimumRole(unknownRole, 'user')).toBe(false)
  })
})

describe('requireApiAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifiedFactors()
  })

  it('should return AuthResult when authenticated with sufficient role', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireApiAuth('admin')

    expect(isAuthError(result)).toBe(false)
    const authResult = result as AuthResult
    expect(authResult.user).toEqual(mockUser)
    expect(authResult.role).toBe('admin')
  })

  it('should return 401 NextResponse when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await requireApiAuth()

    expect(isAuthError(result)).toBe(true)
    const response = result as NextResponse
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 401 NextResponse when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Session expired'),
    })

    const result = await requireApiAuth()

    expect(isAuthError(result)).toBe(true)
    const response = result as NextResponse
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 403 NextResponse when user is at AAL1 (MFA not yet verified)', async () => {
    const mockUser = buildMockUser()
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    })

    const result = await requireApiAuth()

    expect(isAuthError(result)).toBe(true)
    const response = result as NextResponse
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error.message).toBe('MFA verification required')
  })

  it('should return 403 NextResponse when user has no verified factors', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'admin' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    })
    mockNoFactors()

    const result = await requireApiAuth()

    expect(isAuthError(result)).toBe(true)
    const response = result as NextResponse
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error.message).toBe('MFA enrollment required')
  })

  it('should return 403 NextResponse when role is insufficient', async () => {
    const mockUser = buildMockUser({ app_metadata: { role: 'user' } })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireApiAuth('admin')

    expect(isAuthError(result)).toBe(true)
    const response = result as NextResponse
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should return AuthResult with default user role when app_metadata.role is missing', async () => {
    const mockUser = buildMockUser({ app_metadata: {} })
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    })

    const result = await requireApiAuth()

    expect(isAuthError(result)).toBe(false)
    const authResult = result as AuthResult
    expect(authResult.role).toBe('user')
  })
})

describe('isAuthError', () => {
  it('should return true for NextResponse', () => {
    const response = NextResponse.json({ error: 'test' }, { status: 401 })
    expect(isAuthError(response)).toBe(true)
  })

  it('should return false for AuthResult', () => {
    const authResult: AuthResult = {
      user: buildMockUser() as AuthResult['user'],
      role: 'user',
    }
    expect(isAuthError(authResult)).toBe(false)
  })
})
