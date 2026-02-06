import { createServiceClient } from '@/lib/supabase/service'
import {
  healthCheckSchema,
  HEALTH_CHECK_SELECT,
  type HealthCheck,
  type HealthCheckResult,
} from '@/lib/validations/health'
import { toCamelCase } from '@/lib/utils/transform'
import { checkSystemHealth } from '@/lib/health/check'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type HealthCheckInsert = Database['public']['Tables']['health_checks']['Insert']

export async function recordHealthCheck(result: HealthCheckResult): Promise<HealthCheck> {
  const supabase = createServiceClient()

  const insertData: HealthCheckInsert = {
    system_id: result.systemId,
    status: result.status,
    response_time: result.responseTime,
    error_message: result.errorMessage,
    checked_at: result.checkedAt,
  }

  const { data, error } = await supabase
    .from('health_checks')
    .insert(insertData)
    .select(HEALTH_CHECK_SELECT)
    .single()

  if (error) throw error

  return healthCheckSchema.parse(toCamelCase<HealthCheck>(data))
}

export async function updateSystemHealthStatus(
  systemId: string,
  status: string | null,
  responseTime: number | null,
): Promise<void> {
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = {
    response_time: responseTime,
    last_checked_at: new Date().toISOString(),
  }

  // Only update status when explicitly provided (on failure, status is null = don't change)
  if (status !== null) {
    updateData.status = status
  }

  const { error } = await supabase.from('systems').update(updateData).eq('id', systemId)

  if (error) throw error
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  const supabase = createServiceClient()

  const { data: systems, error } = await supabase
    .from('systems')
    .select('id, url')
    .eq('enabled', true)
    .is('deleted_at', null)

  if (error) throw error
  if (!systems || systems.length === 0) return []

  const results = await Promise.allSettled(
    systems.map((system) => checkSystemHealth({ id: system.id, url: system.url })),
  )

  const healthResults: HealthCheckResult[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const checkResult = result.value

      try {
        await recordHealthCheck(checkResult)

        if (checkResult.status === 'success') {
          await updateSystemHealthStatus(checkResult.systemId, 'online', checkResult.responseTime)
        } else {
          // On failure: update last_checked_at but do NOT change status (Story 5.2 handles offline)
          await updateSystemHealthStatus(checkResult.systemId, null, null)
        }
      } catch (dbError) {
        console.error(
          `[health-check] Failed to record result for system ${checkResult.systemId}:`,
          dbError,
        )
      }

      healthResults.push(checkResult)
    } else {
      console.warn('[health-check] Unexpected rejection:', result.reason)
    }
  }

  revalidatePath('/')

  return healthResults
}
