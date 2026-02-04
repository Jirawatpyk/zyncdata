import { describe, it, expect } from 'vitest'
import { loginSchema, mfaVerifySchema, backupCodeSchema } from './auth'

describe('loginSchema', () => {
  it('should accept valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@dxt-ai.com',
      password: 'securePassword123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@dxt-ai.com')
      expect(result.data.password).toBe('securePassword123')
    }
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Valid email required')
    }
  })

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@dxt-ai.com',
      password: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required')
    }
  })

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@dxt-ai.com',
    })
    expect(result.success).toBe(false)
  })

  it('should accept email with plus addressing', () => {
    const result = loginSchema.safeParse({
      email: 'admin+test@dxt-ai.com',
      password: 'pass',
    })
    expect(result.success).toBe(true)
  })

  it('should reject email without domain', () => {
    const result = loginSchema.safeParse({
      email: 'admin@',
      password: 'pass',
    })
    expect(result.success).toBe(false)
  })

  it('should accept single character password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@dxt-ai.com',
      password: 'a',
    })
    expect(result.success).toBe(true)
  })

  it('should strip extra properties', () => {
    const result = loginSchema.safeParse({
      email: 'admin@dxt-ai.com',
      password: 'pass',
      extra: 'field',
    })
    expect(result.success).toBe(true)
  })
})

describe('mfaVerifySchema', () => {
  it('should accept valid 6-digit code', () => {
    const result = mfaVerifySchema.safeParse({ code: '123456' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('123456')
    }
  })

  it('should accept code with all zeros', () => {
    const result = mfaVerifySchema.safeParse({ code: '000000' })
    expect(result.success).toBe(true)
  })

  it('should accept code with all nines', () => {
    const result = mfaVerifySchema.safeParse({ code: '999999' })
    expect(result.success).toBe(true)
  })

  it('should reject code shorter than 6 digits', () => {
    const result = mfaVerifySchema.safeParse({ code: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Code must be 6 digits')
    }
  })

  it('should reject code longer than 6 digits', () => {
    const result = mfaVerifySchema.safeParse({ code: '1234567' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Code must be 6 digits')
    }
  })

  it('should reject non-numeric input', () => {
    const result = mfaVerifySchema.safeParse({ code: 'abcdef' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Code must be 6 digits')
    }
  })

  it('should reject mixed alphanumeric input', () => {
    const result = mfaVerifySchema.safeParse({ code: '12ab56' })
    expect(result.success).toBe(false)
  })

  it('should reject empty string', () => {
    const result = mfaVerifySchema.safeParse({ code: '' })
    expect(result.success).toBe(false)
  })

  it('should reject missing code field', () => {
    const result = mfaVerifySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject code with spaces', () => {
    const result = mfaVerifySchema.safeParse({ code: '123 56' })
    expect(result.success).toBe(false)
  })

  it('should reject code with special characters', () => {
    const result = mfaVerifySchema.safeParse({ code: '12345!' })
    expect(result.success).toBe(false)
  })
})

describe('backupCodeSchema', () => {
  it('should accept valid 8-char hex code', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1B2C3D4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('should accept formatted code with dash ("A1B2-C3D4")', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1B2-C3D4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('should accept code with spaces', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1B2 C3D4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('should transform lowercase to uppercase', () => {
    const result = backupCodeSchema.safeParse({ code: 'a1b2c3d4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })

  it('should reject code that is too short', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1B2' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid backup code format')
    }
  })

  it('should reject code that is too long', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1B2C3D4E5' })
    expect(result.success).toBe(false)
  })

  it('should reject non-hex characters', () => {
    const result = backupCodeSchema.safeParse({ code: 'G1H2I3J4' })
    expect(result.success).toBe(false)
  })

  it('should reject empty string', () => {
    const result = backupCodeSchema.safeParse({ code: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Backup code is required')
    }
  })

  it('should reject missing code field', () => {
    const result = backupCodeSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should accept code with multiple dashes and spaces', () => {
    const result = backupCodeSchema.safeParse({ code: 'A1-B2 C3-D4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('A1B2C3D4')
    }
  })
})
