import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockEnroll = vi.fn()
const mockChallenge = vi.fn()
const mockVerify = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      mfa: {
        enroll: (...args: unknown[]) => mockEnroll(...args),
        challenge: (...args: unknown[]) => mockChallenge(...args),
        verify: (...args: unknown[]) => mockVerify(...args),
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

    expect(mockEnroll).toHaveBeenCalledWith({ factorType: 'totp' })
    expect(result).toEqual(mockData)
  })

  it('should throw when enrollment fails', async () => {
    const error = new Error('Enrollment failed')
    mockEnroll.mockResolvedValue({ data: null, error })

    await expect(enrollMfaFactor()).rejects.toThrow('Enrollment failed')
  })
})

describe('verifyMfaEnrollment', () => {
  it('should challenge then verify with correct params', async () => {
    mockChallenge.mockResolvedValue({
      data: { id: 'challenge-456' },
      error: null,
    })
    const mockVerifyData = { user: { id: 'user-1' }, session: {} }
    mockVerify.mockResolvedValue({ data: mockVerifyData, error: null })

    const result = await verifyMfaEnrollment('factor-123', '123456')

    expect(mockChallenge).toHaveBeenCalledWith({ factorId: 'factor-123' })
    expect(mockVerify).toHaveBeenCalledWith({
      factorId: 'factor-123',
      challengeId: 'challenge-456',
      code: '123456',
    })
    expect(result).toEqual(mockVerifyData)
  })

  it('should throw when challenge fails', async () => {
    const error = new Error('Challenge failed')
    mockChallenge.mockResolvedValue({ data: null, error })

    await expect(verifyMfaEnrollment('factor-123', '123456')).rejects.toThrow('Challenge failed')
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('should throw when verify fails (invalid code)', async () => {
    mockChallenge.mockResolvedValue({
      data: { id: 'challenge-456' },
      error: null,
    })
    const error = new Error('Invalid TOTP code')
    mockVerify.mockResolvedValue({ data: null, error })

    await expect(verifyMfaEnrollment('factor-123', '000000')).rejects.toThrow('Invalid TOTP code')
  })
})
