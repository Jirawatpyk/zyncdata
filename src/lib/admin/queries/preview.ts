import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { contentQueryOptions } from '@/lib/admin/queries/content'
import type { HeroContent, PillarsContent, FooterContent, SystemsContent, ThemeContent } from '@/lib/validations/content'

export interface PreviewPayload {
  hero: HeroContent
  pillars: PillarsContent
  footer: FooterContent
  systems: SystemsContent
  theme: ThemeContent
}

/**
 * Aggregates all pending content + theme + branding from React Query cache
 * to produce a full preview state. Reads the current cache (which includes
 * optimistic updates from editing) — no DB call needed.
 *
 * Returns a memoized object so consumers can safely use it as a useEffect
 * dependency without triggering infinite re-fetches.
 */
export function usePreviewData(): PreviewPayload {
  const { data: content } = useSuspenseQuery(contentQueryOptions)

  return useMemo(() => ({
    hero: content.hero,
    pillars: content.pillars,
    footer: content.footer,
    systems: content.systems,
    theme: content.theme,
  }), [content.hero, content.pillars, content.footer, content.systems, content.theme])
}
