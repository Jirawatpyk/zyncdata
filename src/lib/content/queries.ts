import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  heroContentSchema,
  pillarsContentSchema,
  systemsContentSchema,
  footerContentSchema,
  themeContentSchema,
  type HeroContent,
  type PillarsContent,
  type SystemsContent,
  type FooterContent,
  type ThemeContent,
} from '@/lib/validations/content'

export interface LandingPageContent {
  hero: HeroContent
  pillars: PillarsContent
  systems: SystemsContent
  footer: FooterContent
  theme: ThemeContent
}

// Deploy-safety fallback: bypasses pillarsContentSchema.parse() (which requires min 1 item)
// because this covers the case where the DB section doesn't exist yet during deploy.
// PillarsSection handles empty items by returning null.
const PILLARS_FALLBACK: PillarsContent = { heading: 'Our Pillars', items: [] }

const THEME_FALLBACK: ThemeContent = { colorScheme: 'dxt-default', font: 'nunito', logoUrl: null, faviconUrl: null }

// Wrapped in React.cache() to deduplicate DB calls within a single render pass
// (called in both public layout.tsx and page.tsx)
export const getLandingPageContent = cache(async (): Promise<LandingPageContent> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('landing_page_content')
    .select('section_name, content')

  if (error) throw error

  const contentMap = Object.fromEntries(
    data.map((row) => [row.section_name, row.content]),
  )

  return {
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
})
