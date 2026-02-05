import { createClient } from '@/lib/supabase/server'
import {
  systemSchema,
  type System,
  type CreateSystemInput,
  type UpdateSystemInput,
} from '@/lib/validations/system'
import { getSystems, SYSTEM_SELECT_COLUMNS } from '@/lib/systems/queries'
import { toCamelCase, toSnakeCase } from '@/lib/utils/transform'
import { revalidatePath } from 'next/cache'

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

/**
 * Update an existing system in the database.
 * Note: updated_at is auto-set by database trigger — do not include in payload.
 * Revalidates ISR cache for landing page.
 */
export async function updateSystem(input: UpdateSystemInput): Promise<System> {
  const supabase = await createClient()
  const { id, ...updateData } = input

  const snakeData = toSnakeCase(updateData as unknown as Record<string, unknown>)
  if (updateData.enabled === true) {
    snakeData.deleted_at = null // Clear soft-delete on recovery
  }

  const { data, error } = await supabase
    .from('systems')
    .update(snakeData)
    .eq('id', id)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('System not found')
    }
    throw error
  }

  // Bust ISR cache for landing page (AC #4)
  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}

/**
 * Soft-delete a system by setting enabled=false and recording deleted_at timestamp.
 * System remains in admin list for recovery within 30 days.
 * Revalidates ISR cache for landing page.
 */
export async function deleteSystem(id: string): Promise<System> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('systems')
    .update({ enabled: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('System not found')
    }
    throw error
  }

  // Bust ISR cache for landing page
  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}

/**
 * Reorder systems by updating display_order for the given systems.
 * Typically used for a 2-system swap, but supports bulk updates.
 * Revalidates ISR cache for landing page.
 *
 * WARNING: Updates are NOT atomic — each system is updated individually.
 * If the second update fails, the first is already committed, which can leave
 * display_order in an inconsistent state. For a 2-item swap the risk is minimal.
 * TODO: Migrate to a Supabase RPC function for atomic bulk reorder if this
 * grows beyond simple swaps.
 */
export async function reorderSystems(
  systems: Array<{ id: string; displayOrder: number }>,
): Promise<System[]> {
  const supabase = await createClient()

  for (const { id, displayOrder } of systems) {
    const { error } = await supabase
      .from('systems')
      .update({ display_order: displayOrder })
      .eq('id', id)

    if (error) throw error
  }

  // Bust ISR cache for landing page
  revalidatePath('/')

  // Return fresh sorted list
  return getSystems()
}

/**
 * Toggle system visibility (enabled/disabled).
 * ONLY updates `enabled` — does NOT touch `deleted_at`.
 * Use this for simple visibility toggle, NOT for soft-delete recovery.
 * Revalidates ISR cache for landing page.
 */
export async function toggleSystem(id: string, enabled: boolean): Promise<System> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('systems')
    .update({ enabled })
    .eq('id', id)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('System not found')
    }
    throw error
  }

  // Bust ISR cache for landing page
  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}
