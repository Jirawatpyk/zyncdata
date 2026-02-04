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

import { verifyBackupCodeAction } from './backup-codes'
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
    plainCodes: [
      'A1B2C3D4',
      'E5F6A7B8',
      '11223344',
      '55667788',
      'AABBCCDD',
      'EEFF0011',
      '22334455',
      '66778899',
    ],
    hashedCodes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6', 'hash7', 'hash8'],
  })
  mockHashBackupCode.mockReturnValue('matched-hash')
})

describe('verifyBackupCodeAction — guardrail security tests', () => {
  it('[P0] should not allow User B to verify User A backup code', async () => {
    // Given user-2 is authenticated but the backup code belongs to user-1
    mockGetCurrentUser.mockResolvedValue({ id: 'user-2', email: 'user2@dxt-ai.com' })

    // The select query for user-2 + code_hash returns no match (code belongs to user-1)
    mockSingle.mockReturnValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    // When user-2 attempts to verify user-1's backup code
    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    // Then the action should reject with "Invalid or already used backup code"
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid or already used backup code')
    expect(result.remainingCodes).toBeNull()

    // And the query should have been scoped to user-2's ID
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-2')
  })

  it('[P1] should handle concurrent verify of same code (second attempt fails)', async () => {
    // Given the first call successfully finds and marks the code as used
    mockSingle.mockReturnValueOnce({ data: { id: 'code-uuid-1' }, error: null })

    // First call mock: update succeeds, count returns 7
    const selectCallCount = { current: 0 }
    mockSelect.mockImplementation((...args: unknown[]) => {
      selectCallCount.current++
      if (selectCallCount.current > 1 && args[0] === '*') {
        return {
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({ count: 7 }),
          }),
        }
      }
      return { eq: mockEq, is: mockIs, single: mockSingle }
    })

    const firstResult = await verifyBackupCodeAction(
      initialVerifyState,
      buildFormData('A1B2C3D4'),
    )

    // Then the first call should succeed
    expect(firstResult.success).toBe(true)

    // Given for the second concurrent call, the code is already used (single returns null)
    // Reset mocks for second call
    createChainableMock()
    mockSingle.mockReturnValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    // When the second call tries to verify the same code
    const secondResult = await verifyBackupCodeAction(
      initialVerifyState,
      buildFormData('A1B2C3D4'),
    )

    // Then the second call should fail with "Invalid or already used backup code"
    expect(secondResult.success).toBe(false)
    expect(secondResult.error).toBe('Invalid or already used backup code')
  })

  it('[P1] should return correct remainingCodes count after successful verify', async () => {
    // Given a valid backup code exists for user-1
    mockSingle.mockReturnValue({ data: { id: 'code-uuid-1' }, error: null })

    // And after marking one code as used, 5 remain
    const selectCallCount = { current: 0 }
    mockSelect.mockImplementation((...args: unknown[]) => {
      selectCallCount.current++
      if (selectCallCount.current > 1 && args[0] === '*') {
        // count query — returns exact count of 5
        return {
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({ count: 5 }),
          }),
        }
      }
      return { eq: mockEq, is: mockIs, single: mockSingle }
    })

    // When the user verifies a valid backup code
    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('A1B2C3D4'))

    // Then remainingCodes should be exactly 5
    expect(result.success).toBe(true)
    expect(result.remainingCodes).toBe(5)
    expect(result.error).toBeNull()
  })

  it('[P2] should handle missing code field in formData', async () => {
    // Given a FormData without the 'code' key
    const emptyFormData = new FormData()

    // When the action is called with empty formData
    const result = await verifyBackupCodeAction(initialVerifyState, emptyFormData)

    // Then it should return a validation error (backupCodeSchema rejects missing code)
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.rateLimited).toBe(false)
    expect(result.remainingCodes).toBeNull()
  })

  it('[P2] should handle verify when user has zero backup codes', async () => {
    // Given the user has no backup codes at all (single returns null/error)
    mockSingle.mockReturnValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    // When the user attempts to verify a code
    const result = await verifyBackupCodeAction(initialVerifyState, buildFormData('AABBCCDD'))

    // Then it should return "Invalid or already used backup code"
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid or already used backup code')
    expect(result.remainingCodes).toBeNull()
    expect(result.rateLimited).toBe(false)
  })
})
