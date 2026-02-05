import { createClient } from '@/lib/supabase/server'
import {
  systemSchema,
  type System,
  type CreateSystemInput,
} from '@/lib/validations/system'
import { toCamelCase, toSnakeCase } from '@/lib/utils/transform'
import { revalidatePath } from 'next/cache'

const SYSTEM_SELECT_COLUMNS =
  'id, name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at'

/**
 * Create a new system in the database.
 * Auto-calculates display_order as MAX(display_order) + 1.
 * Revalidates ISR cache for landing page.
 */
export async function createSystem(input: CreateSystemInput): Promise<System> {
  const supabase = await createClient()

  // Get next display_order
  const { data: maxOrder } = await supabase
    .from('systems')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const displayOrder = (maxOrder?.display_order ?? -1) + 1

  // Transform input to snake_case for database
  const insertData = {
    ...toSnakeCase(input as unknown as Record<string, unknown>),
    display_order: displayOrder,
  }

  const { data, error } = await supabase
    .from('systems')
    .insert(insertData)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) throw error

  // Bust ISR cache for landing page
  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}
