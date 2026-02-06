import { createClient } from '@/lib/supabase/server'
import { healthCheckSchema, type HealthCheck } from '@/lib/validations/health'
import { toCamelCase } from '@/lib/utils/transform'
import { z } from 'zod'

const HEALTH_CHECK_SELECT = 'id, system_id, status, response_time, error_message, checked_at'

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
