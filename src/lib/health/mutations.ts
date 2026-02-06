import { createServiceClient } from '@/lib/supabase/service'
import {
  healthCheckSchema,
  HEALTH_CHECK_SELECT,
  type HealthCheck,
  type HealthCheckResult,
} from '@/lib/validations/health'
import { toCamelCase } from '@/lib/utils/transform'
import { checkSystemHealthWithRetry } from '@/lib/health/check'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type HealthCheckInsert = Database['public']['Tables']['health_checks']['Insert']
type ServiceClient = ReturnType<typeof createServiceClient>

export const DEFAULT_FAILURE_THRESHOLD = 3

export async function recordHealthCheck(
  result: HealthCheckResult,
  client?: ServiceClient,
): Promise<HealthCheck> {
  const supabase = client ?? createServiceClient()

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
  client?: ServiceClient,
): Promise<void> {
  const supabase = client ?? createServiceClient()

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

/**
 * Increment consecutive_failures counter using read-then-write.
 * Non-atomic — safe only because cron is the single writer (no concurrent writers).
 * @returns New failure count after increment
 */
export async function incrementConsecutiveFailures(
  systemId: string,
  client?: ServiceClient,
): Promise<number> {
  const supabase = client ?? createServiceClient()

  const { data: system, error: readError } = await supabase
    .from('systems')
    .select('consecutive_failures')
    .eq('id', systemId)
    .single()

  if (readError) throw readError

  const newCount = (system?.consecutive_failures ?? 0) + 1

  const { error: updateError } = await supabase
    .from('systems')
    .update({ consecutive_failures: newCount })
    .eq('id', systemId)

  if (updateError) throw updateError

  return newCount
}

export async function resetConsecutiveFailures(
  systemId: string,
  client?: ServiceClient,
): Promise<void> {
  const supabase = client ?? createServiceClient()

  const { error } = await supabase
    .from('systems')
    .update({ consecutive_failures: 0 })
    .eq('id', systemId)

  if (error) throw error
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  const supabase = createServiceClient()

  const { data: systems, error } = await supabase
    .from('systems')
    .select('id, url, status')
    .eq('enabled', true)
    .is('deleted_at', null)

  if (error) throw error
  if (!systems || systems.length === 0) return []

  const results = await Promise.allSettled(
    systems.map((system) => checkSystemHealthWithRetry({ id: system.id, url: system.url })),
  )

  const healthResults: HealthCheckResult[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const system = systems[i]

    if (result.status === 'fulfilled') {
      const checkResult = result.value

      try {
        await recordHealthCheck(checkResult, supabase)

        if (checkResult.status === 'success') {
          // Recovery path (AC #2): reset counter and set online
          await resetConsecutiveFailures(checkResult.systemId, supabase)
          await updateSystemHealthStatus(checkResult.systemId, 'online', checkResult.responseTime, supabase)

          if (system.status === 'offline') {
            console.info(
              `[health-check] System ${checkResult.systemId}: offline → online (recovered)`,
            )
          }
        } else {
          // Failure path (AC #1): increment counter, check threshold
          const failureCount = await incrementConsecutiveFailures(checkResult.systemId, supabase)

          if (failureCount >= DEFAULT_FAILURE_THRESHOLD) {
            await updateSystemHealthStatus(checkResult.systemId, 'offline', null, supabase)

            if (system.status !== 'offline') {
              console.info(
                `[health-check] System ${checkResult.systemId}: ${system.status ?? 'unknown'} → offline (${failureCount} consecutive failures)`,
              )
            }
          } else {
            // Below threshold: update last_checked_at only, keep previous status
            await updateSystemHealthStatus(checkResult.systemId, null, null, supabase)
          }
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
