import { createClient } from '@/lib/supabase/server'
import { systemSchema, type System } from '@/lib/validations/system'
import { toCamelCase } from '@/lib/utils/transform'
import { z } from 'zod'

export const SYSTEM_SELECT_COLUMNS =
  'id, name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at, deleted_at'

export async function getSystemByName(name: string): Promise<System | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select(SYSTEM_SELECT_COLUMNS)
    .eq('name', name)
    .eq('enabled', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return systemSchema.parse(toCamelCase<System>(data))
}

export async function getEnabledSystems(): Promise<System[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select(SYSTEM_SELECT_COLUMNS)
    .eq('enabled', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) throw error

  return z.array(systemSchema).parse(data.map((s) => toCamelCase<System>(s)))
}

/**
 * Get all systems (for admin panel) - includes disabled systems.
 * Ordered by display_order for consistent list rendering.
 */
export async function getSystems(): Promise<System[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select(SYSTEM_SELECT_COLUMNS)
    .order('display_order', { ascending: true })

  if (error) throw error

  return z.array(systemSchema).parse(data.map((s) => toCamelCase<System>(s)))
}
