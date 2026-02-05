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

vi.mock('./_components/MfaEnrollForm', () => ({
  default: () => <div data-testid="mfa-enroll-form">MfaEnrollForm</div>,
}))

import MfaEnrollPage, { metadata } from './page'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MfaEnrollPage', () => {
  it('should redirect to login when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    await expect(MfaEnrollPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should redirect to mfa-verify when MFA is enrolled but needs verification', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: false,
      needsMfaVerification: true,
    })

    await expect(MfaEnrollPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-verify')
  })

  it('should redirect to dashboard when MFA is fully verified', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: false,
      needsMfaVerification: false,
    })

    await expect(MfaEnrollPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })

  it('should render MfaEnrollForm when user is authenticated with no factors', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: true,
      needsMfaVerification: false,
    })

    const result = await MfaEnrollPage()
    expect(result).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'MFA Setup | zyncdata',
      description: 'Set up multi-factor authentication for your account',
    })
  })
})
