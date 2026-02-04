import { describe, it, expect } from 'vitest'
import {
  WebSocketEventType,
  healthUpdatePayloadSchema,
  systemEventPayloadSchema,
  contentPublishedPayloadSchema,
} from '@/lib/websocket/events'

describe('WebSocketEventType', () => {
  it('should have all expected event types', () => {
    expect(WebSocketEventType.HEALTH_UPDATE).toBe('health:update')
    expect(WebSocketEventType.SYSTEM_CREATED).toBe('system:created')
    expect(WebSocketEventType.SYSTEM_UPDATED).toBe('system:updated')
    expect(WebSocketEventType.SYSTEM_DELETED).toBe('system:deleted')
    expect(WebSocketEventType.CONTENT_PUBLISHED).toBe('content:published')
  })

  it('should contain exactly 5 event types', () => {
    expect(Object.keys(WebSocketEventType)).toHaveLength(5)
  })
})

describe('healthUpdatePayloadSchema', () => {
  const validPayload = {
    systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    status: 'online',
    responseTime: 150,
    checkedAt: '2024-01-01T00:00:00Z',
  }

  it('should validate a correct payload', () => {
    const result = healthUpdatePayloadSchema.parse(validPayload)
    expect(result).toEqual(validPayload)
  })

  it('should accept null responseTime', () => {
    const result = healthUpdatePayloadSchema.parse({ ...validPayload, responseTime: null })
    expect(result.responseTime).toBeNull()
  })

  it('should accept offline status', () => {
    const result = healthUpdatePayloadSchema.parse({ ...validPayload, status: 'offline' })
    expect(result.status).toBe('offline')
  })

  it('should reject invalid UUID', () => {
    expect(() =>
      healthUpdatePayloadSchema.parse({ ...validPayload, systemId: 'not-a-uuid' }),
    ).toThrow()
  })

  it('should reject invalid status', () => {
    expect(() =>
      healthUpdatePayloadSchema.parse({ ...validPayload, status: 'degraded' }),
    ).toThrow()
  })

  it('should reject negative responseTime', () => {
    expect(() =>
      healthUpdatePayloadSchema.parse({ ...validPayload, responseTime: -1 }),
    ).toThrow()
  })

  it('should reject missing fields', () => {
    expect(() => healthUpdatePayloadSchema.parse({})).toThrow()
  })

  it('should reject invalid datetime', () => {
    expect(() =>
      healthUpdatePayloadSchema.parse({ ...validPayload, checkedAt: 'not-a-date' }),
    ).toThrow()
  })

  it('should accept responseTime of 0 (nonnegative boundary)', () => {
    const result = healthUpdatePayloadSchema.parse({
      ...validPayload,
      responseTime: 0,
    })
    expect(result.responseTime).toBe(0)
  })
})

describe('systemEventPayloadSchema', () => {
  const validPayload = {
    systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'TINEDY',
    action: 'created',
  }

  it('should validate a correct payload', () => {
    const result = systemEventPayloadSchema.parse(validPayload)
    expect(result).toEqual(validPayload)
  })

  it('should accept all valid actions', () => {
    for (const action of ['created', 'updated', 'deleted'] as const) {
      const result = systemEventPayloadSchema.parse({ ...validPayload, action })
      expect(result.action).toBe(action)
    }
  })

  it('should reject invalid action', () => {
    expect(() =>
      systemEventPayloadSchema.parse({ ...validPayload, action: 'archived' }),
    ).toThrow()
  })

  it('should reject missing fields', () => {
    expect(() => systemEventPayloadSchema.parse({})).toThrow()
  })

  it('should accept empty string for name (no minLength constraint)', () => {
    const result = systemEventPayloadSchema.parse({
      ...validPayload,
      name: '',
    })
    expect(result.name).toBe('')
  })
})

describe('contentPublishedPayloadSchema', () => {
  const validPayload = {
    sections: ['hero', 'intro'],
    publishedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    publishedAt: '2024-01-01T00:00:00Z',
  }

  it('should validate a correct payload', () => {
    const result = contentPublishedPayloadSchema.parse(validPayload)
    expect(result).toEqual(validPayload)
  })

  it('should accept empty sections array', () => {
    const result = contentPublishedPayloadSchema.parse({ ...validPayload, sections: [] })
    expect(result.sections).toEqual([])
  })

  it('should reject invalid UUID for publishedBy', () => {
    expect(() =>
      contentPublishedPayloadSchema.parse({ ...validPayload, publishedBy: 'not-uuid' }),
    ).toThrow()
  })

  it('should reject missing fields', () => {
    expect(() => contentPublishedPayloadSchema.parse({})).toThrow()
  })

  it('should reject non-string in sections array', () => {
    expect(() =>
      contentPublishedPayloadSchema.parse({ ...validPayload, sections: [123] }),
    ).toThrow()
  })
})
