import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ContentRow {
  id: string
  section_name: string
  content: Record<string, unknown>
  metadata: Record<string, unknown> | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Update a content section's JSONB content in landing_page_content.
 * Calls revalidatePath('/') to bust ISR cache — changes go live immediately.
 */
export async function updateSectionContent(
  sectionName: string,
  content: Record<string, unknown>,
  userId: string,
): Promise<ContentRow> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landing_page_content')
    .update({ content, updated_by: userId })
    .eq('section_name', sectionName)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Section not found: ${sectionName}`)
    }
    throw error
  }

  // Bust ISR cache — changes go live immediately
  revalidatePath('/')

  return data as ContentRow
}
