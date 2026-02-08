import { describe, it, expect } from 'vitest'
import { updateHealthConfigSchema, healthHistoryQuerySchema } from './health'

describe('healthHistoryQuerySchema', () => {
  it('should apply defaults when no params provided', () => {
    const result = healthHistoryQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ limit: 20, offset: 0 })
  })

  it('should accept valid params with all fields', () => {
    const result = healthHistoryQuerySchema.safeParse({
      limit: 50,
      offset: 20,
      status: 'success',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ limit: 50, offset: 20, status: 'success' })
  })

  it('should coerce string numbers from query params', () => {
    const result = healthHistoryQuerySchema.safeParse({
      limit: '10',
      offset: '30',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ limit: 10, offset: 30 })
  })

  it('should accept boundary minimum limit (1)', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 1 })
    expect(result.success).toBe(true)
  })

  it('should accept boundary maximum limit (100)', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 100 })
    expect(result.success).toBe(true)
  })

  it('should reject limit below minimum (0)', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject limit above maximum (101)', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('should reject negative offset', () => {
    const result = healthHistoryQuerySchema.safeParse({ offset: -1 })
    expect(result.success).toBe(false)
  })

  it('should accept offset of 0', () => {
    const result = healthHistoryQuerySchema.safeParse({ offset: 0 })
    expect(result.success).toBe(true)
  })

  it('should accept status "failure"', () => {
    const result = healthHistoryQuerySchema.safeParse({ status: 'failure' })
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('failure')
  })

  it('should reject invalid status value', () => {
    const result = healthHistoryQuerySchema.safeParse({ status: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should accept omitted status (optional)', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 20, offset: 0 })
    expect(result.success).toBe(true)
    expect(result.data?.status).toBeUndefined()
  })

  it('should reject non-integer limit', () => {
    const result = healthHistoryQuerySchema.safeParse({ limit: 10.5 })
    expect(result.success).toBe(false)
  })
})

describe('updateHealthConfigSchema', () => {
  it('should accept valid values within range', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 60,
      timeoutThreshold: 10000,
      failureThreshold: 3,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkInterval: 60,
      timeoutThreshold: 10000,
      failureThreshold: 3,
    })
  })

  it('should accept all null values (reset to defaults)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    })
  })

  it('should accept boundary minimum values', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 30,
      timeoutThreshold: 1000,
      failureThreshold: 1,
    })

    expect(result.success).toBe(true)
  })

  it('should accept boundary maximum values', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 86400,
      timeoutThreshold: 60000,
      failureThreshold: 10,
    })

    expect(result.success).toBe(true)
  })

  it('should reject check_interval below minimum (29)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 29,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    expect(result.success).toBe(false)
  })

  it('should reject check_interval above maximum (86401)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 86401,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    expect(result.success).toBe(false)
  })

  it('should reject timeout_threshold below minimum (999)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: null,
      timeoutThreshold: 999,
      failureThreshold: null,
    })

    expect(result.success).toBe(false)
  })

  it('should reject timeout_threshold above maximum (60001)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: null,
      timeoutThreshold: 60001,
      failureThreshold: null,
    })

    expect(result.success).toBe(false)
  })

  it('should reject failure_threshold below minimum (0)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: 0,
    })

    expect(result.success).toBe(false)
  })

  it('should reject failure_threshold above maximum (11)', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: 11,
    })

    expect(result.success).toBe(false)
  })

  it('should reject non-integer values', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 60.5,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    expect(result.success).toBe(false)
  })

  it('should accept mixed null and non-null values', () => {
    const result = updateHealthConfigSchema.safeParse({
      checkInterval: 120,
      timeoutThreshold: null,
      failureThreshold: 5,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkInterval: 120,
      timeoutThreshold: null,
      failureThreshold: 5,
    })
  })
})
