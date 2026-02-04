import { createClient } from '@/lib/supabase/server'
import { systemSchema, type System } from '@/lib/validations/system'
import { toCamelCase } from '@/lib/utils/transform'
import { z } from 'zod'

export async function getSystemByName(name: string): Promise<System | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select('id, name, url, logo_url, description, status, display_order')
    .eq('name', name)
    .eq('enabled', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return systemSchema.parse(toCamelCase<System>(data))
}

export async function getEnabledSystems(): Promise<System[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select('id, name, url, logo_url, description, status, display_order')
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  if (error) throw error

  return z.array(systemSchema).parse(data.map((s) => toCamelCase<System>(s)))
}
