import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()
const mockGetCurrentUser = vi.fn()
const mockRedirect = vi.fn()

vi.mock('@/lib/ratelimit/mfa', () => ({
  getMfaRatelimit: () => ({
    limit: (...args: unknown[]) => mockLimit(...args),
  }),
}))

vi.mock('@/lib/auth/queries', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (err: unknown) =>
    err instanceof Error && err.message === 'NEXT_REDIRECT',
}))

import { verifyMfaEnrollmentAction } from './mfa'
import type { MfaEnrollState } from './mfa'

const initialState: MfaEnrollState = { error: null, rateLimited: false }

function buildFormData(code: string): FormData {
  const fd = new FormData()
  fd.set('code', code)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentUser.mockResolvedValue({ id: 'user-1', email: 'admin@dxt-ai.com' })
  mockLimit.mockResolvedValue({ success: true })
})

describe('verifyMfaEnrollmentAction', () => {
  describe('auth check', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)
      const redirectError = new Error('NEXT_REDIRECT')
      mockRedirect.mockImplementation(() => {
        throw redirectError
      })

      await expect(
        verifyMfaEnrollmentAction(initialState, buildFormData('123456')),
      ).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('rate limiting', () => {
    it('should return rate limited error when limit exceeded', async () => {
      mockLimit.mockResolvedValue({ success: false })

      const result = await verifyMfaEnrollmentAction(initialState, buildFormData('123456'))

      expect(result).toEqual({
        error: 'Too many attempts. Please try again later.',
        rateLimited: true,
      })
      expect(mockLimit).toHaveBeenCalledWith('user-1')
    })

    it('should rate limit by user ID', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-42', email: 'test@dxt-ai.com' })
      mockLimit.mockResolvedValue({ success: true })

      await verifyMfaEnrollmentAction(initialState, buildFormData('123456'))

      expect(mockLimit).toHaveBeenCalledWith('user-42')
    })
  })

  describe('validation', () => {
    it('should return error for non-numeric code', async () => {
      const result = await verifyMfaEnrollmentAction(initialState, buildFormData('abcdef'))

      expect(result.error).toBe('Code must be 6 digits')
      expect(result.rateLimited).toBe(false)
    })

    it('should return error for short code', async () => {
      const result = await verifyMfaEnrollmentAction(initialState, buildFormData('123'))

      expect(result.error).toBe('Code must be 6 digits')
      expect(result.rateLimited).toBe(false)
    })

    it('should return error for empty code', async () => {
      const result = await verifyMfaEnrollmentAction(initialState, buildFormData(''))

      expect(result.error).toBeTruthy()
      expect(result.rateLimited).toBe(false)
    })
  })

  describe('successful validation', () => {
    it('should return null error for valid 6-digit code', async () => {
      const result = await verifyMfaEnrollmentAction(initialState, buildFormData('123456'))

      expect(result).toEqual({ error: null, rateLimited: false })
    })

    it('should not call rate limit before auth check', async () => {
      mockGetCurrentUser.mockResolvedValue(null)
      const redirectError = new Error('NEXT_REDIRECT')
      mockRedirect.mockImplementation(() => {
        throw redirectError
      })

      await expect(
        verifyMfaEnrollmentAction(initialState, buildFormData('123456')),
      ).rejects.toThrow('NEXT_REDIRECT')

      expect(mockLimit).not.toHaveBeenCalled()
    })
  })

  describe('unexpected error handling', () => {
    it('[P0] should return unexpected error when getCurrentUser throws a non-redirect error', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Database connection error'))

      const result = await verifyMfaEnrollmentAction(
        initialState,
        buildFormData('123456'),
      )

      expect(result).toEqual({
        error: 'An unexpected error occurred. Please try again.',
        rateLimited: false,
      })
    })
  })

  describe('rate limit before validation ordering', () => {
    it('[P1] should return rate limit error without reaching validation even with invalid code', async () => {
      mockLimit.mockResolvedValue({ success: false })

      const result = await verifyMfaEnrollmentAction(
        initialState,
        buildFormData('not-a-number'),
      )

      expect(result).toEqual({
        error: 'Too many attempts. Please try again later.',
        rateLimited: true,
      })
    })
  })
})
