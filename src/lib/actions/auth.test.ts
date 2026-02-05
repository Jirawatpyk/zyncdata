import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginAction } from './auth'
import type { LoginState } from './auth'

// Mock dependencies
const mockLimit = vi.fn()
const mockSignInWithEmail = vi.fn()
const mockGetMfaStatus = vi.fn()
const mockRedirect = vi.fn()
const mockHeaders = vi.fn()

vi.mock('@/lib/ratelimit/login', () => ({
  getLoginRatelimit: () => ({
    limit: (...args: unknown[]) => mockLimit(...args),
  }),
}))

vi.mock('@/lib/auth/queries', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  getMfaStatus: (...args: unknown[]) => mockGetMfaStatus(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (err: unknown) =>
    err instanceof Error && err.message === 'NEXT_REDIRECT',
}))

function buildFormData(email: string, password: string): FormData {
  const fd = new FormData()
  fd.set('email', email)
  fd.set('password', password)
  return fd
}

const initialState: LoginState = { error: null, rateLimited: false }

beforeEach(() => {
  vi.clearAllMocks()
  mockHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '1.2.3.4' }))
  mockLimit.mockResolvedValue({ success: true })
})

describe('loginAction', () => {
  describe('rate limiting', () => {
    it('should return rate limited error when limit exceeded', async () => {
      mockLimit.mockResolvedValue({ success: false })

      const result = await loginAction(initialState, buildFormData('admin@dxt-ai.com', 'pass'))

      expect(result).toEqual({
        error: 'Too many login attempts. Please try again later.',
        rateLimited: true,
      })
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
    })

    it('should extract IP from x-forwarded-for header', async () => {
      mockLimit.mockResolvedValue({ success: false })
      mockHeaders.mockResolvedValue(new Headers({ 'x-forwarded-for': '10.0.0.1, 172.16.0.1' }))

      await loginAction(initialState, buildFormData('admin@dxt-ai.com', 'pass'))

      expect(mockLimit).toHaveBeenCalledWith('10.0.0.1')
    })

    it('should use 127.0.0.1 when no x-forwarded-for header', async () => {
      mockLimit.mockResolvedValue({ success: false })
      mockHeaders.mockResolvedValue(new Headers())

      await loginAction(initialState, buildFormData('admin@dxt-ai.com', 'pass'))

      expect(mockLimit).toHaveBeenCalledWith('127.0.0.1')
    })
  })

  describe('validation', () => {
    it('should return error for invalid email', async () => {
      const result = await loginAction(initialState, buildFormData('not-email', 'pass'))

      expect(result.error).toBe('Valid email required')
      expect(result.rateLimited).toBe(false)
      expect(mockSignInWithEmail).not.toHaveBeenCalled()
    })

    it('should return error for empty password', async () => {
      const result = await loginAction(initialState, buildFormData('admin@dxt-ai.com', ''))

      expect(result.error).toBe('Password is required')
      expect(result.rateLimited).toBe(false)
      expect(mockSignInWithEmail).not.toHaveBeenCalled()
    })
  })

  describe('successful login', () => {
    it('should redirect to mfa-enroll when no factors enrolled', async () => {
      mockSignInWithEmail.mockResolvedValue({
        user: { id: 'u1' },
        session: { access_token: 'tok' },
      })
      mockGetMfaStatus.mockResolvedValue({
        hasNoFactors: true,
        needsMfaVerification: false,
      })
      const redirectError = new Error('NEXT_REDIRECT')
      mockRedirect.mockImplementation(() => {
        throw redirectError
      })

      await expect(
        loginAction(initialState, buildFormData('admin@dxt-ai.com', 'password123')),
      ).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-enroll')
    })

    it('should redirect to mfa-verify when MFA needs verification', async () => {
      mockSignInWithEmail.mockResolvedValue({
        user: { id: 'u1' },
        session: { access_token: 'tok' },
      })
      mockGetMfaStatus.mockResolvedValue({
        hasNoFactors: false,
        needsMfaVerification: true,
      })
      const redirectError = new Error('NEXT_REDIRECT')
      mockRedirect.mockImplementation(() => {
        throw redirectError
      })

      await expect(
        loginAction(initialState, buildFormData('admin@dxt-ai.com', 'password123')),
      ).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-verify')
    })

    it('should redirect to admin when MFA fully verified', async () => {
      mockSignInWithEmail.mockResolvedValue({
        user: { id: 'u1' },
        session: { access_token: 'tok' },
      })
      mockGetMfaStatus.mockResolvedValue({
        hasNoFactors: false,
        needsMfaVerification: false,
      })
      const redirectError = new Error('NEXT_REDIRECT')
      mockRedirect.mockImplementation(() => {
        throw redirectError
      })

      await expect(
        loginAction(initialState, buildFormData('admin@dxt-ai.com', 'password123')),
      ).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/admin')
    })
  })

  describe('authentication failure', () => {
    it('should return generic error on wrong password (no credential enumeration)', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid login credentials'))

      const result = await loginAction(
        initialState,
        buildFormData('admin@dxt-ai.com', 'wrongpass'),
      )

      expect(result).toEqual({
        error: 'Invalid email or password',
        rateLimited: false,
      })
    })

    it('should return generic error on wrong email (no credential enumeration)', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid login credentials'))

      const result = await loginAction(
        initialState,
        buildFormData('nonexistent@dxt-ai.com', 'password'),
      )

      expect(result).toEqual({
        error: 'Invalid email or password',
        rateLimited: false,
      })
    })

    it('should return generic error when getMfaStatus fails after successful login', async () => {
      mockSignInWithEmail.mockResolvedValue({
        user: { id: 'u1' },
        session: { access_token: 'tok' },
      })
      mockGetMfaStatus.mockRejectedValue(new Error('MFA service unavailable'))

      const result = await loginAction(
        initialState,
        buildFormData('admin@dxt-ai.com', 'password123'),
      )

      expect(result).toEqual({
        error: 'Invalid email or password',
        rateLimited: false,
      })
    })

    it('should return same error for wrong email and wrong password', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid login credentials'))

      const wrongEmail = await loginAction(
        initialState,
        buildFormData('wrong@dxt-ai.com', 'password'),
      )
      const wrongPass = await loginAction(
        initialState,
        buildFormData('admin@dxt-ai.com', 'wrong'),
      )

      expect(wrongEmail.error).toBe(wrongPass.error)
      expect(wrongEmail.error).toBe('Invalid email or password')
    })
  })
})
