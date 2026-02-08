import { createClient } from '@/lib/supabase/server'
import { healthCheckSchema, HEALTH_CHECK_SELECT, type HealthCheck } from '@/lib/validations/health'
import { toCamelCase } from '@/lib/utils/transform'
import { z } from 'zod'

export async function getRecentHealthChecks(
  systemId: string,
  limit: number = 10,
): Promise<HealthCheck[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('health_checks')
    .select(HEALTH_CHECK_SELECT)
    .eq('system_id', systemId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return z.array(healthCheckSchema).parse(data.map((row) => toCamelCase<HealthCheck>(row)))
}

/**
 * Get the total health check record count for a specific system.
 * Utility for admin dashboard — verifies pruning is keeping records within bounds.
 * @param systemId UUID of the system
 * @returns Number of health check records for this system
 */
export async function getHealthCheckCount(systemId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('health_checks')
    .select('*', { count: 'exact', head: true })
    .eq('system_id', systemId)

  if (error) throw error

  return count ?? 0
}

export async function getHealthCheckHistory(
  systemId: string,
  options: { limit?: number; offset?: number; status?: string } = {},
): Promise<{ checks: HealthCheck[]; total: number }> {
  const supabase = await createClient()
  const { limit = 20, offset = 0, status } = options

  let query = supabase
    .from('health_checks')
    .select(HEALTH_CHECK_SELECT, { count: 'exact' })
    .eq('system_id', systemId)
    .order('checked_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    checks: z.array(healthCheckSchema).parse((data ?? []).map((row) => toCamelCase<HealthCheck>(row))),
    total: count ?? 0,
  }
}

export async function getLatestHealthCheck(systemId: string): Promise<HealthCheck | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('health_checks')
    .select(HEALTH_CHECK_SELECT)
    .eq('system_id', systemId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return healthCheckSchema.parse(toCamelCase<HealthCheck>(data))
}
