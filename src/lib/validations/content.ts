import { z } from 'zod'

export const heroContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  description: z.string().min(1, 'Description is required'),
})

export const pillarItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url().nullable(),
  icon: z.string().optional(),
})

export const pillarsContentSchema = z.object({
  heading: z.string().min(1, 'Heading is required'),
  items: z.array(pillarItemSchema).min(1),
})

export const systemsContentSchema = z.object({
  heading: z.string(),
  subtitle: z.string(),
})

export const footerContentSchema = z
  .object({
    copyright: z.string().min(1, 'Copyright is required'),
    contact_email: z.string().email().optional(),
    links: z.array(z.object({ label: z.string().min(1, 'Label is required'), url: z.string().min(1, 'URL is required') })),
  })
  .transform((data) => ({
    copyright: data.copyright,
    contactEmail: data.contact_email,
    links: data.links,
  }))

// Theme & Branding (Story 4-2)
export const COLOR_SCHEMES = ['dxt-default', 'ocean-blue', 'midnight-purple'] as const
export type ColorScheme = (typeof COLOR_SCHEMES)[number]

export const FONT_OPTIONS = ['nunito', 'inter', 'open-sans'] as const
export type FontOption = (typeof FONT_OPTIONS)[number]

export const themeContentSchema = z.object({
  colorScheme: z.enum(COLOR_SCHEMES),
  font: z.enum(FONT_OPTIONS),
  logoUrl: z.string().url().nullable(),
  faviconUrl: z.string().url().nullable(),
})

export const COLOR_SCHEME_PALETTES: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  'dxt-default': { primary: '#41b9d5', secondary: '#5371ff', accent: '#6ce6e9' },
  'ocean-blue': { primary: '#0077b6', secondary: '#00b4d8', accent: '#90e0ef' },
  'midnight-purple': { primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd' },
}

export const FONT_FAMILY_MAP: Record<FontOption, string> = {
  'nunito': "'Nunito', sans-serif",
  'inter': "'Inter', sans-serif",
  'open-sans': "'Open Sans', sans-serif",
}

/** Google Fonts CSS URLs for iframe/preview contexts where next/font is unavailable */
export const GOOGLE_FONTS_URL: Record<FontOption, string> = {
  'nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
  'inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'open-sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
}

export type HeroContent = z.infer<typeof heroContentSchema>
export type PillarItem = z.infer<typeof pillarItemSchema>
export type PillarsContent = z.infer<typeof pillarsContentSchema>
export type SystemsContent = z.infer<typeof systemsContentSchema>
export type FooterContent = z.infer<typeof footerContentSchema>
export type ThemeContent = z.infer<typeof themeContentSchema>
