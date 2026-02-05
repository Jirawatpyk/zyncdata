import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockEnroll = vi.fn()
const mockChallengeAndVerify = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      mfa: {
        enroll: (...args: unknown[]) => mockEnroll(...args),
        challengeAndVerify: (...args: unknown[]) => mockChallengeAndVerify(...args),
      },
    },
  }),
}))

import { enrollMfaFactor, verifyMfaEnrollment } from './mutations'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enrollMfaFactor', () => {
  it('should call supabase.auth.mfa.enroll with factorType totp', async () => {
    const mockData = {
      id: 'factor-123',
      totp: {
        qr_code: 'data:image/svg+xml;utf8,...',
        secret: 'JBSWY3DPEHPK3PXP',
        uri: 'otpauth://totp/...',
      },
    }
    mockEnroll.mockResolvedValue({ data: mockData, error: null })

    const result = await enrollMfaFactor()

    expect(mockEnroll).toHaveBeenCalledWith({ factorType: 'totp', issuer: 'zyncdata' })
    expect(result).toEqual(mockData)
  })

  it('should throw when enrollment fails', async () => {
    const error = new Error('Enrollment failed')
    mockEnroll.mockResolvedValue({ data: null, error })

    await expect(enrollMfaFactor()).rejects.toThrow('Enrollment failed')
  })
})

describe('verifyMfaEnrollment', () => {
  it('should call challengeAndVerify with correct params', async () => {
    const mockVerifyData = { user: { id: 'user-1' }, session: {} }
    mockChallengeAndVerify.mockResolvedValue({ data: mockVerifyData, error: null })

    const result = await verifyMfaEnrollment('factor-123', '123456')

    expect(mockChallengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-123',
      code: '123456',
    })
    expect(result).toEqual(mockVerifyData)
  })

  it('should throw when challengeAndVerify fails (invalid code)', async () => {
    const error = new Error('Invalid TOTP code')
    mockChallengeAndVerify.mockResolvedValue({ data: null, error })

    await expect(verifyMfaEnrollment('factor-123', '000000')).rejects.toThrow('Invalid TOTP code')
  })
})
