import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import {
  heroContentSchema,
  pillarsContentSchema,
  systemsContentSchema,
  footerContentSchema,
  themeContentSchema,
} from '@/lib/validations/content'

const PILLARS_FALLBACK = { heading: 'Our Pillars', items: [] }
const THEME_FALLBACK = { colorScheme: 'dxt-default', font: 'nunito', logoUrl: null, faviconUrl: null }

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('section_name, content, draft_content')

    if (error) throw error

    // For each row: use draft_content if it exists, otherwise content (published)
    const contentMap = Object.fromEntries(
      data.map((row) => [row.section_name, row.draft_content ?? row.content]),
    )

    // Parse with same Zod schemas + fallbacks as getLandingPageContent()
    const result = {
      hero: heroContentSchema.parse(contentMap.hero),
      pillars: contentMap.pillars
        ? pillarsContentSchema.parse(contentMap.pillars)
        : PILLARS_FALLBACK,
      systems: systemsContentSchema.parse(contentMap.systems),
      footer: footerContentSchema.parse(contentMap.footer),
      theme: contentMap.theme
        ? themeContentSchema.parse(contentMap.theme)
        : THEME_FALLBACK,
    }

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('[GET /api/content]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch content', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}
