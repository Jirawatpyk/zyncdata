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

/** Check if a logo URL points to Supabase Storage (vs static /logos/ path) */
export function isSupabaseStorageUrl(url: string): boolean {
  return (
    url.includes('supabase.co/storage/') ||
    url.includes('127.0.0.1:54321/storage/') ||
    url.includes('localhost:54321/storage/')
  )
}

/** Extract storage path from a Supabase Storage public URL */
export function extractStoragePath(url: string): string | null {
  const match = url.match(/\/object\/public\/system-logos\/(.+)$/)
  return match?.[1] ?? null
}

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

/**
 * Upload a logo for a system.
 * If the system already has a Supabase Storage logo, deletes the old one first.
 * Stores file in system-logos/{systemId}/{timestamp}.{ext}
 * Revalidates ISR cache for landing page.
 */
export async function uploadSystemLogo(
  systemId: string,
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
): Promise<System> {
  const supabase = await createClient()

  // 1. Get current system to check for existing logo
  const { data: current, error: fetchError } = await supabase
    .from('systems')
    .select('logo_url')
    .eq('id', systemId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('System not found')
    throw fetchError
  }

  // 2. Delete old logo from storage if it's a Supabase URL
  if (current.logo_url && isSupabaseStorageUrl(current.logo_url)) {
    const oldPath = extractStoragePath(current.logo_url)
    if (oldPath) {
      await supabase.storage.from('system-logos').remove([oldPath])
    }
  }

  // 3. Upload new file
  const ext = fileName.split('.').pop() ?? 'png'
  const storagePath = `${systemId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('system-logos')
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    })

  if (uploadError) throw new Error(`Failed to upload logo: ${uploadError.message}`)

  // 4. Get public URL
  const { data: urlData } = supabase.storage.from('system-logos').getPublicUrl(storagePath)

  // 5. Update system record with new logo URL
  const { data, error } = await supabase
    .from('systems')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', systemId)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) throw error

  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}

/**
 * Delete a system's logo.
 * Removes file from Supabase Storage (if it's a storage URL) and clears logo_url.
 * Static logos (e.g., /logos/tinedy.svg) just get their DB field cleared.
 * Revalidates ISR cache for landing page.
 */
export async function deleteSystemLogo(systemId: string): Promise<System> {
  const supabase = await createClient()

  // 1. Get current logo URL
  const { data: current, error: fetchError } = await supabase
    .from('systems')
    .select('logo_url')
    .eq('id', systemId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('System not found')
    throw fetchError
  }

  // 2. Delete from storage if Supabase URL
  if (current.logo_url && isSupabaseStorageUrl(current.logo_url)) {
    const path = extractStoragePath(current.logo_url)
    if (path) {
      await supabase.storage.from('system-logos').remove([path])
    }
  }

  // 3. Clear logo_url on system record
  const { data, error } = await supabase
    .from('systems')
    .update({ logo_url: null })
    .eq('id', systemId)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) throw error

  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}
