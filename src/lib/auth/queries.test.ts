import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInWithEmail, getMfaStatus, getCurrentUser } from './queries'

const mockSignInWithPassword = vi.fn()
const mockGetAuthenticatorAssuranceLevel = vi.fn()
const mockListFactors = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        mfa: {
          getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
          listFactors: mockListFactors,
        },
        getUser: mockGetUser,
      },
    }),
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signInWithEmail', () => {
  it('should return data on successful login', async () => {
    const mockData = { user: { id: 'u1', email: 'admin@dxt-ai.com' }, session: { access_token: 'tok' } }
    mockSignInWithPassword.mockResolvedValue({ data: mockData, error: null })

    const result = await signInWithEmail('admin@dxt-ai.com', 'password123')
    expect(result).toEqual(mockData)
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'admin@dxt-ai.com',
      password: 'password123',
    })
  })

  it('should throw error on failed login', async () => {
    const authError = new Error('Invalid login credentials')
    mockSignInWithPassword.mockResolvedValue({ data: null, error: authError })

    await expect(signInWithEmail('bad@email.com', 'wrong')).rejects.toThrow(
      'Invalid login credentials',
    )
  })
})

describe('getMfaStatus', () => {
  it('should detect no MFA factors enrolled (aal1 -> aal1)', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    })
    mockListFactors.mockResolvedValue({
      data: { totp: [], phone: [], all: [] },
      error: null,
    })

    const result = await getMfaStatus()
    expect(result.hasNoFactors).toBe(true)
    expect(result.needsMfaVerification).toBe(false)
  })

  it('should detect MFA enrolled but needs verification (aal1 -> aal2)', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    })
    mockListFactors.mockResolvedValue({
      data: { totp: [{ id: 'f1', type: 'totp' }], phone: [], all: [] },
      error: null,
    })

    const result = await getMfaStatus()
    expect(result.hasNoFactors).toBe(false)
    expect(result.needsMfaVerification).toBe(true)
  })

  it('should detect MFA fully verified (aal2 -> aal2)', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    })
    mockListFactors.mockResolvedValue({
      data: { totp: [{ id: 'f1', type: 'totp' }], phone: [], all: [] },
      error: null,
    })

    const result = await getMfaStatus()
    expect(result.hasNoFactors).toBe(false)
    expect(result.needsMfaVerification).toBe(false)
  })

  it('should handle null factors data', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    })
    mockListFactors.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await getMfaStatus()
    expect(result.hasNoFactors).toBe(true)
  })
})

describe('getCurrentUser', () => {
  it('should return user when authenticated', async () => {
    const mockUser = { id: 'u1', email: 'admin@dxt-ai.com', app_metadata: { role: 'super_admin' } }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const result = await getCurrentUser()
    expect(result).toEqual(mockUser)
  })

  it('should return null when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await getCurrentUser()
    expect(result).toBeNull()
  })

  it('should return null on error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Session expired'),
    })

    const result = await getCurrentUser()
    expect(result).toBeNull()
  })
})
