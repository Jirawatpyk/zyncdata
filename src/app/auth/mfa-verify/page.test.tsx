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

import MfaVerifyPage, { metadata } from './page'
import { render, screen } from '@testing-library/react'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MfaVerifyPage', () => {
  it('should redirect to /auth/login if not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    await expect(MfaVerifyPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should redirect to /auth/mfa-enroll if no MFA factors', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: true,
      needsMfaVerification: false,
    })

    await expect(MfaVerifyPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/mfa-enroll')
  })

  it('should redirect to /admin if already aal2', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: false,
      needsMfaVerification: false,
    })

    await expect(MfaVerifyPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })

  it('should render MfaVerifyForm when MFA verification needed', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockGetMfaStatus.mockResolvedValue({
      hasNoFactors: false,
      needsMfaVerification: true,
    })

    const result = await MfaVerifyPage()
    render(result)

    expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
  })

  it('should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Verify Identity - zyncdata',
    })
  })
})
