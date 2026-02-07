import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function publishAllContent(userId: string): Promise<{ publishedAt: string }> {
  const supabase = await createClient()

  // Get all rows that have unpublished drafts
  const { data: draftRows, error: fetchError } = await supabase
    .from('landing_page_content')
    .select('id, section_name, draft_content')
    .not('draft_content', 'is', null)

  if (fetchError) throw fetchError

  // Copy draft_content → content for each draft row
  for (const row of draftRows ?? []) {
    const { error: updateError } = await supabase
      .from('landing_page_content')
      .update({
        content: row.draft_content,
        draft_content: null,
        updated_by: userId,
      })
      .eq('id', row.id)

    if (updateError) throw updateError
  }

  // Bust ISR cache — public page re-renders with new content
  revalidatePath('/')

  return { publishedAt: new Date().toISOString() }
}

export async function getPublishStatus(): Promise<{
  hasDrafts: boolean
  draftSections: string[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('landing_page_content')
    .select('section_name, draft_content')
    .not('draft_content', 'is', null)

  if (error) throw error

  const draftSections = (data ?? []).map((r) => r.section_name)

  return {
    hasDrafts: draftSections.length > 0,
    draftSections,
  }
}
