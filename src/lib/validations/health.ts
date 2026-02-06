import { z } from 'zod'

export const HEALTH_CHECK_SELECT = 'id, system_id, status, response_time, error_message, checked_at'

export const HEALTH_CHECK_STATUSES = ['success', 'failure'] as const
export type HealthCheckStatus = (typeof HEALTH_CHECK_STATUSES)[number]

export const healthCheckSchema = z.object({
  id: z.string().uuid(),
  systemId: z.string().uuid(),
  status: z.enum(HEALTH_CHECK_STATUSES),
  responseTime: z.number().int().nonnegative().nullable(),
  errorMessage: z.string().nullable(),
  checkedAt: z.string(),
})

export type HealthCheck = z.infer<typeof healthCheckSchema>

export const healthCheckResultSchema = z.object({
  systemId: z.string().uuid(),
  status: z.enum(HEALTH_CHECK_STATUSES),
  responseTime: z.number().int().nonnegative().nullable(),
  errorMessage: z.string().nullable(),
  checkedAt: z.string(),
})

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>
