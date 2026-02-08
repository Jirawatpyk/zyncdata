import { createServiceClient } from '@/lib/supabase/service'
import {
  healthCheckSchema,
  HEALTH_CHECK_SELECT,
  type HealthCheck,
  type HealthCheckResult,
} from '@/lib/validations/health'
import { toCamelCase } from '@/lib/utils/transform'
import { checkSystemHealthWithRetry } from '@/lib/health/check'
import { sendFailureNotification, sendRecoveryNotification } from '@/lib/health/notifications'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type HealthCheckInsert = Database['public']['Tables']['health_checks']['Insert']
type ServiceClient = ReturnType<typeof createServiceClient>

export const DEFAULT_FAILURE_THRESHOLD = 3
export const DEFAULT_CONCURRENCY_LIMIT = 5
export const MAX_JITTER_MS = 500

/**
 * Execute async tasks with a concurrency limit, preserving result order.
 * Inline pLimit-style semaphore — avoids external dependency for ~20 lines of code.
 * @param tasks Array of task factories (thunks)
 * @param limit Max concurrent tasks
 * @returns Settled results in same order as input tasks
 */
export async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  const executing = new Set<Promise<void>>()

  for (let i = 0; i < tasks.length; i++) {
    const index = i
    const p = tasks[index]()
      .then((value) => {
        results[index] = { status: 'fulfilled', value }
      })
      .catch((reason: unknown) => {
        results[index] = { status: 'rejected', reason }
      })
      .then(() => {
        executing.delete(p)
      })
    executing.add(p)

    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}

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
    .select('id, name, url, status, timeout_threshold, failure_threshold')
    .eq('enabled', true)
    .is('deleted_at', null)

  if (error) throw error
  if (!systems || systems.length === 0) return []

  const results = await withConcurrencyLimit(
    systems.map((system) => async () => {
      // Staggered start: random jitter 0-500ms to prevent thundering herd
      const jitter = Math.random() * MAX_JITTER_MS
      if (jitter > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, jitter))
      }
      return checkSystemHealthWithRetry(
        { id: system.id, url: system.url },
        system.timeout_threshold != null ? { timeoutMs: system.timeout_threshold } : undefined,
      )
    }),
    DEFAULT_CONCURRENCY_LIMIT,
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
            // Non-blocking recovery notification (AC #3)
            try {
              await sendRecoveryNotification({
                systemId: checkResult.systemId,
                systemName: system.name,
                systemUrl: system.url,
                responseTime: checkResult.responseTime,
              }, supabase)
            } catch (notifError) {
              console.error('[health-check] Recovery notification failed:', notifError)
            }
          }
        } else {
          // Failure path (AC #1): increment counter, check threshold
          const failureCount = await incrementConsecutiveFailures(checkResult.systemId, supabase)

          const threshold = system.failure_threshold ?? DEFAULT_FAILURE_THRESHOLD
          if (failureCount >= threshold) {
            await updateSystemHealthStatus(checkResult.systemId, 'offline', null, supabase)

            if (system.status !== 'offline') {
              console.info(
                `[health-check] System ${checkResult.systemId}: ${system.status ?? 'unknown'} → offline (${failureCount} consecutive failures)`,
              )
              // Non-blocking failure notification (AC #1) — first transition only
              try {
                await sendFailureNotification({
                  systemId: checkResult.systemId,
                  systemName: system.name,
                  systemUrl: system.url,
                  errorMessage: checkResult.errorMessage,
                  failureCount,
                }, supabase)
              } catch (notifError) {
                console.error('[health-check] Failure notification failed:', notifError)
              }
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
