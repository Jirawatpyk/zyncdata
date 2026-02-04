import { describe, it, expect } from 'vitest'
import { ErrorCode } from '@/lib/errors/codes'
import type { ErrorCodeType } from '@/lib/errors/codes'

describe('ErrorCode', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND')
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED')
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCode.CONFLICT).toBe('CONFLICT')
  })

  it('should contain exactly 8 error codes', () => {
    expect(Object.keys(ErrorCode)).toHaveLength(8)
  })

  it('should have string values matching their keys', () => {
    for (const [key, value] of Object.entries(ErrorCode)) {
      expect(value).toBe(key)
    }
  })

  it('should support ErrorCodeType for type narrowing', () => {
    const code: ErrorCodeType = ErrorCode.UNAUTHORIZED
    expect(code).toBe('UNAUTHORIZED')
  })
})
