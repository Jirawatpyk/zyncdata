import { createClient } from '@/lib/supabase/server'
import {
  heroContentSchema,
  introContentSchema,
  footerContentSchema,
  type HeroContent,
  type IntroContent,
  type FooterContent,
} from '@/lib/validations/content'

export interface LandingPageContent {
  hero: HeroContent
  intro: IntroContent
  footer: FooterContent
}

export async function getLandingPageContent(): Promise<LandingPageContent> {
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
    intro: introContentSchema.parse(contentMap.intro),
    footer: footerContentSchema.parse(contentMap.footer),
  }
}
