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

// ── Notification Types ────────────────────────────────────────────

export const NOTIFICATION_TYPES = ['failure', 'recovery'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const notificationSettingsSchema = z.object({
  id: z.string().uuid(),
  notificationEmails: z.array(z.string().email()),
  notifyOnFailure: z.boolean(),
  notifyOnRecovery: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export const updateNotificationSettingsSchema = z.object({
  notificationEmails: z.array(z.string().email()).min(0).max(10),
  notifyOnFailure: z.boolean(),
  notifyOnRecovery: z.boolean(),
})

export type UpdateNotificationSettings = z.infer<typeof updateNotificationSettingsSchema>

// ── Health Config Types ──────────────────────────────────────────────

export const updateHealthConfigSchema = z.object({
  checkInterval: z.number().int().min(30).max(86400).nullable(),
  timeoutThreshold: z.number().int().min(1000).max(60000).nullable(),
  failureThreshold: z.number().int().min(1).max(10).nullable(),
})

export type UpdateHealthConfig = z.infer<typeof updateHealthConfigSchema>

export interface HealthConfig {
  checkInterval: number | null
  timeoutThreshold: number | null
  failureThreshold: number | null
}

// ── Dashboard Types ────────────────────────────────────────────────

export interface SystemHealthSummary {
  id: string
  name: string
  url: string
  status: string | null
  responseTime: number | null
  lastCheckedAt: string | null
  consecutiveFailures: number
  category: string | null
  enabled: boolean
  checkInterval: number | null
  timeoutThreshold: number | null
  failureThreshold: number | null
}

export interface HealthDashboardSummary {
  total: number
  online: number
  offline: number
  unknown: number
  avgResponseTime: number | null
}

export interface HealthDashboardData {
  systems: SystemHealthSummary[]
  summary: HealthDashboardSummary
  lastUpdated: string
}
