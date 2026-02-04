import { describe, it, expect } from 'vitest'
import { generateBackupCodes, hashBackupCode, formatBackupCodeForDisplay } from './backup-codes'

describe('generateBackupCodes', () => {
  it('should generate exactly 8 codes', () => {
    const { plainCodes, hashedCodes } = generateBackupCodes()
    expect(plainCodes).toHaveLength(8)
    expect(hashedCodes).toHaveLength(8)
  })

  it('should generate 8-character uppercase hex codes', () => {
    const { plainCodes } = generateBackupCodes()
    for (const code of plainCodes) {
      expect(code).toMatch(/^[A-F0-9]{8}$/)
    }
  })

  it('should generate SHA-256 hex hashes (64 characters)', () => {
    const { hashedCodes } = generateBackupCodes()
    for (const hash of hashedCodes) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    }
  })

  it('should generate unique codes within a batch', () => {
    const { plainCodes } = generateBackupCodes()
    const uniqueCodes = new Set(plainCodes)
    expect(uniqueCodes.size).toBe(plainCodes.length)
  })

  it('should produce matching hashes for plain codes', () => {
    const { plainCodes, hashedCodes } = generateBackupCodes()
    for (let i = 0; i < plainCodes.length; i++) {
      expect(hashedCodes[i]).toBe(hashBackupCode(plainCodes[i]))
    }
  })
})

describe('hashBackupCode', () => {
  it('should return a 64-character hex string', () => {
    const hash = hashBackupCode('A1B2C3D4')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should be deterministic', () => {
    const hash1 = hashBackupCode('A1B2C3D4')
    const hash2 = hashBackupCode('A1B2C3D4')
    expect(hash1).toBe(hash2)
  })

  it('should be case-insensitive (uppercases input)', () => {
    const hashLower = hashBackupCode('a1b2c3d4')
    const hashUpper = hashBackupCode('A1B2C3D4')
    expect(hashLower).toBe(hashUpper)
  })

  it('should produce different hashes for different codes', () => {
    const hash1 = hashBackupCode('A1B2C3D4')
    const hash2 = hashBackupCode('E5F6A7B8')
    expect(hash1).not.toBe(hash2)
  })
})

describe('formatBackupCodeForDisplay', () => {
  it('should format code with dash in the middle', () => {
    expect(formatBackupCodeForDisplay('A1B2C3D4')).toBe('A1B2-C3D4')
  })

  it('should handle lowercase input', () => {
    expect(formatBackupCodeForDisplay('a1b2c3d4')).toBe('a1b2-c3d4')
  })
})
