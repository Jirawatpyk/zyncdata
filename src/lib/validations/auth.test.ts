import { describe, it, expect } from 'vitest'
import { loginSchema } from './auth'

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
