import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetCurrentUser = vi.fn()
const mockGetMfaStatus = vi.fn()
const mockRedirect = vi.fn()

vi.mock('@/lib/auth/queries', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  getMfaStatus: (...args: unknown[]) => mockGetMfaStatus(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

vi.mock('./_components/MfaVerifyForm', () => ({
  default: () => <div data-testid="mfa-verify-form">MfaVerifyForm</div>,
}))

import MfaVerifyPage from './page'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MfaVerifyPage — guardrail edge cases', () => {
  it('[P1] should propagate error when getCurrentUser throws', async () => {
    // Given getCurrentUser rejects with an unexpected error
    mockGetCurrentUser.mockRejectedValue(new Error('Database connection failed'))

    // When the page is rendered, the error should propagate (not silently swallowed)
    await expect(MfaVerifyPage()).rejects.toThrow('Database connection failed')

    // And redirect should NOT have been called
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('[P1] should propagate error when getMfaStatus throws', async () => {
    // Given user is authenticated but getMfaStatus rejects
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockGetMfaStatus.mockRejectedValue(new Error('MFA service unavailable'))

    // When the page is rendered, the error should propagate
    await expect(MfaVerifyPage()).rejects.toThrow('MFA service unavailable')
  })

  it('[P2] should redirect to dashboard when getMfaStatus returns undefined fields', async () => {
    // Given getMfaStatus returns an object with undefined fields
    // This tests defensive behavior: { hasNoFactors: undefined, needsMfaVerification: undefined }
    // undefined is falsy, so:
    //   if (hasNoFactors) → false (skip)
    //   if (!needsMfaVerification) → true → redirect to dashboard
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: undefined,
      needsMfaVerification: undefined,
    })

    await expect(MfaVerifyPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })
})
