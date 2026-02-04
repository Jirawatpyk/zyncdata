import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()
const mockGetCurrentUser = vi.fn()
const mockRedirect = vi.fn()
const mockGenerateBackupCodes = vi.fn()
const mockHashBackupCode = vi.fn()

const mockFrom = vi.fn()
const mockDelete = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIs = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()

function createChainableMock() {
  const chain = {
    from: mockFrom,
    delete: mockDelete,
    insert: mockInsert,
    select: mockSelect,
    eq: mockEq,
    is: mockIs,
    single: mockSingle,
    update: mockUpdate,
  }
  mockFrom.mockReturnValue(chain)
  mockDelete.mockReturnValue(chain)
  mockInsert.mockReturnValue({ error: null })
  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  mockIs.mockReturnValue(chain)
  mockSingle.mockReturnValue({ data: null, error: null })
  mockUpdate.mockReturnValue(chain)
  return chain
}

vi.mock('@/lib/ratelimit/backup-codes', () => ({
  getBackupCodeRatelimit: () => ({
    limit: (...args: unknown[]) => mockLimit(...args),
  }),
}))

vi.mock('@/lib/auth/queries', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

vi.mock('@/lib/auth/backup-codes', () => ({
  generateBackupCodes: (...args: unknown[]) => mockGenerateBackupCodes(...args),
  hashBackupCode: (...args: unknown[]) => mockHashBackupCode(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (err: unknown) =>
    err instanceof Error && err.message === 'NEXT_REDIRECT',
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: mockFrom }),
}))

import { generateBackupCodesAction, verifyBackupCodeAction } from './backup-codes'
import type { VerifyBackupCodeState } from './backup-codes'

const initialVerifyState: VerifyBackupCodeState = {
  error: null,
  rateLimited: false,
  success: false,
  remainingCodes: null,
}

function buildFormData(code: string): FormData {
  const fd = new FormData()
  fd.set('code', code)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentUser.mockResolvedValue({ id: 'user-1', email: 'admin@dxt-ai.com' })
  mockLimit.mockResolvedValue({ success: true })
  createChainableMock()
  mockGenerateBackupCodes.mockReturnValue({
    plainCodes: ['A1B2C3D4', 'E5F6A7B8', '11223344', '55667788', 'AABBCCDD', 'EEFF0011', '22334455', '66778899'],
    hashedCodes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6', 'hash7', 'hash8'],
  })
  mockHashBackupCode.mockReturnValue('matched-hash')
})

describe('generateBackupCodesAction', () => {
  it('should redirect to login when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const redirectError = new Error('NEXT_REDIRECT')
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })

    await expect(generateBackupCodesAction()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should generate 8 codes on success', async () => {
    const result = await generateBackupCodesAction()

    expect(result.codes).toHaveLength(8)
    expect(result.error).toBeNull()
    expect(mockGenerateBackupCodes).toHaveBeenCalled()
  })

  it('should delete existing codes before inserting new ones', async () => {
    await generateBackupCodesAction()

    expect(mockFrom).toHaveBeenCalledWith('backup_codes')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('should return error when delete fails', async () => {
    mockEq.mockReturnValueOnce({ error: { message: 'delete failed' } })

    const result = await generateBackupCodesAction()

    expect(result.codes).toBeNull()
    expect(result.error).toBe('Failed to generate backup codes. Please try again.')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should return error when insert fails', async () => {
    mockInsert.mockReturnValue({ error: { message: 'DB error' } })

    const result = await generateBackupCodesAction()

    expect(result.codes).toBeNull()
    expect(result.error).toBe('Failed to generate backup codes. Please try again.')
  })

  it('should handle unexpected errors gracefully', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Database down'))

    const result = await generateBackupCodesAction()

    expect(result.codes).toBeNull()
    expect(result.error).toBe('An unexpected error occurred. Please try again.')
  })
})

describe('verifyBackupCodeAction', () => {
  it('should redirect to login when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const redirectError = new Error('NEXT_REDIRECT')
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })

    await expect(
      verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4')),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should return rateLimited when rate limit exceeded', async () => {
    mockLimit.mockResolvedValue({ success: false })

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    expect(result).toEqual({
      error: 'Too many attempts. Please try again later.',
      rateLimited: true,
      success: false,
      remainingCodes: null,
    })
    expect(mockLimit).toHaveBeenCalledWith('user-1')
  })

  it('should return validation error for invalid code format', async () => {
    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('XYZ'))

    expect(result.error).toBeTruthy()
    expect(result.rateLimited).toBe(false)
    expect(result.success).toBe(false)
  })

  it('should return success when valid code matches and marks as used', async () => {
    mockSingle.mockReturnValue({ data: { id: 'code-uuid-1' }, error: null })
    // Mock the count query — after update, count remaining
    const selectCallCount = { current: 0 }
    mockSelect.mockImplementation((...args: unknown[]) => {
      selectCallCount.current++
      if (selectCallCount.current > 1 && args[0] === '*') {
        // count query
        return {
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({ count: 5 }),
          }),
        }
      }
      return { eq: mockEq, is: mockIs, single: mockSingle }
    })

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
    expect(result.rateLimited).toBe(false)
  })

  it('should return error when marking code as used fails', async () => {
    mockSingle.mockReturnValue({ data: { id: 'code-uuid-1' }, error: null })

    const chain = {
      from: mockFrom,
      delete: mockDelete,
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      single: mockSingle,
      update: mockUpdate,
    }

    // .eq() calls: 1st = select user_id, 2nd = select code_hash, 3rd = update (terminal → error)
    mockEq
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce({ error: { message: 'update failed' } })

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    expect(result.success).toBe(false)
    expect(result.error).toBe('An unexpected error occurred. Please try again.')
  })

  it('should return error for already-used code', async () => {
    mockSingle.mockReturnValue({ data: null, error: { code: 'PGRST116', message: 'not found' } })

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    expect(result.error).toBe('Invalid or already used backup code')
    expect(result.success).toBe(false)
  })

  it('should return error for non-existent code', async () => {
    mockSingle.mockReturnValue({ data: null, error: { code: 'PGRST116', message: 'not found' } })

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('DEADBEEF'))

    expect(result.error).toBe('Invalid or already used backup code')
    expect(result.success).toBe(false)
  })

  it('should handle unexpected errors gracefully', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Database down'))

    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    expect(result).toEqual({
      error: 'An unexpected error occurred. Please try again.',
      rateLimited: false,
      success: false,
      remainingCodes: null,
    })
  })
})
