import { createClient } from '@/lib/supabase/server'

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
 * Update a content section's draft in landing_page_content.
 * Saves to draft_content column — does NOT go live until explicit publish.
 */
export async function updateSectionContent(
  sectionName: string,
  content: Record<string, unknown>,
  userId: string,
): Promise<ContentRow> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landing_page_content')
    .update({ draft_content: content, updated_by: userId })
    .eq('section_name', sectionName)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Section not found: ${sectionName}`)
    }
    throw error
  }

  // NO revalidatePath — edits stay as drafts until explicit publish
  return data as ContentRow
}
