import { z } from 'zod'

export const WebSocketEventType = {
  HEALTH_UPDATE: 'health:update',
  SYSTEM_CREATED: 'system:created',
  SYSTEM_UPDATED: 'system:updated',
  SYSTEM_DELETED: 'system:deleted',
  CONTENT_PUBLISHED: 'content:published',
} as const

export type WebSocketEventTypeValue =
  (typeof WebSocketEventType)[keyof typeof WebSocketEventType]

export const healthUpdatePayloadSchema = z.object({
  systemId: z.string().uuid(),
  status: z.enum(['online', 'offline']),
  responseTime: z.number().nonnegative().nullable(),
  checkedAt: z.string().datetime(),
})

export const systemEventPayloadSchema = z.object({
  systemId: z.string().uuid(),
  name: z.string(),
  action: z.enum(['created', 'updated', 'deleted']),
})

export const contentPublishedPayloadSchema = z.object({
  sections: z.array(z.string()),
  publishedBy: z.string().uuid(),
  publishedAt: z.string().datetime(),
})

export type HealthUpdatePayload = z.infer<typeof healthUpdatePayloadSchema>
export type SystemEventPayload = z.infer<typeof systemEventPayloadSchema>
export type ContentPublishedPayload = z.infer<typeof contentPublishedPayloadSchema>
