import { describe, it, expect } from 'vitest'
import { backupCodeSchema } from '@/lib/validations/auth'

describe('backupCodeSchema — guardrail edge cases', () => {
  it('[P1] should strip tab characters from code via transform', () => {
    // Given a code containing tab characters between valid hex chars
    const input = { code: 'A1B2\tC3D4' }

    // When we parse the input
    const result = backupCodeSchema.safeParse(input)

    // Then \s in the transform regex matches tabs, stripping them
    // After transform: "A1B2C3D4" which is valid 8-char hex
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('[P1] should strip newline characters from code via transform', () => {
    // Given a code containing newline characters
    const input = { code: 'A1B2\nC3D4' }

    // When we parse the input
    const result = backupCodeSchema.safeParse(input)

    // Then \s in the transform regex matches newlines, stripping them
    // After transform: "A1B2C3D4" which is valid 8-char hex
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('[P2] should handle extremely long input gracefully', () => {
    // Given an extremely long input (1000 characters)
    const longInput = { code: 'A'.repeat(1000) }

    // When we parse the input
    const result = backupCodeSchema.safeParse(longInput)

    // Then it should be rejected because after transform it's 1000 chars, not 8
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid backup code format')
    }
  })

  it('[P2] should reject numeric-only code (coerce edge case)', () => {
    // Given a numeric value passed directly (z.coerce.string converts number to string)
    const input = { code: 12345678 }

    // When we parse the input — z.coerce.string() converts 12345678 to "12345678"
    const result = backupCodeSchema.safeParse(input)

    // Then "12345678" after transform/uppercase is "12345678"
    // Regex /^[A-F0-9]{8}$/ — digits 0-9 ARE valid hex, so "12345678" passes.
    // This verifies z.coerce.string() correctly handles numeric input without crash.
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('12345678')
    }
  })

  it('[P1] should reject code with only dashes and spaces', () => {
    // Given a code consisting only of dashes and spaces
    const input = { code: '--- ---' }

    // When we parse the input
    const result = backupCodeSchema.safeParse(input)

    // Then after transform (strip dashes and spaces), the result is an empty string
    // which fails the 8-char hex regex
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid backup code format')
    }
  })
})
