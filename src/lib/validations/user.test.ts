import { describe, it, expect } from 'vitest'
import { createUserSchema, ASSIGNABLE_ROLES, ROLE_LABELS } from './user'

describe('createUserSchema', () => {
  it('should accept valid email and admin role', () => {
    const result = createUserSchema.safeParse({ email: 'test@dxt.com', role: 'admin' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@dxt.com')
      expect(result.data.role).toBe('admin')
    }
  })

  it('should accept valid email and user role', () => {
    const result = createUserSchema.safeParse({ email: 'user@dxt.com', role: 'user' })
    expect(result.success).toBe(true)
  })

  it('should reject empty email', () => {
    const result = createUserSchema.safeParse({ email: '', role: 'admin' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email is required')
    }
  })

  it('should reject invalid email format', () => {
    const result = createUserSchema.safeParse({ email: 'not-an-email', role: 'admin' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Valid email address required')
    }
  })

  it('should reject email exceeding 255 characters', () => {
    const longEmail = `${'a'.repeat(250)}@b.com`
    const result = createUserSchema.safeParse({ email: longEmail, role: 'admin' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email must be 255 characters or less')
    }
  })

  it('should reject super_admin role', () => {
    const result = createUserSchema.safeParse({ email: 'test@dxt.com', role: 'super_admin' })
    expect(result.success).toBe(false)
  })

  it('should reject missing role', () => {
    const result = createUserSchema.safeParse({ email: 'test@dxt.com' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid role value', () => {
    const result = createUserSchema.safeParse({ email: 'test@dxt.com', role: 'manager' })
    expect(result.success).toBe(false)
  })

  it('should reject missing email and role', () => {
    const result = createUserSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('ASSIGNABLE_ROLES', () => {
  it('should contain admin and user only', () => {
    expect(ASSIGNABLE_ROLES).toEqual(['admin', 'user'])
  })

  it('should not contain super_admin', () => {
    expect(ASSIGNABLE_ROLES).not.toContain('super_admin')
  })
})

describe('ROLE_LABELS', () => {
  it('should have labels for all assignable roles', () => {
    for (const role of ASSIGNABLE_ROLES) {
      expect(ROLE_LABELS[role]).toBeDefined()
      expect(typeof ROLE_LABELS[role]).toBe('string')
    }
  })
})
