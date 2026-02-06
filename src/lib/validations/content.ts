import { z } from 'zod'

export const heroContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
})

export const pillarItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url().nullable(),
  icon: z.string().optional(),
})

export const pillarsContentSchema = z.object({
  heading: z.string(),
  items: z.array(pillarItemSchema).min(1),
})

export const systemsContentSchema = z.object({
  heading: z.string(),
  subtitle: z.string(),
})

export const footerContentSchema = z
  .object({
    copyright: z.string(),
    contact_email: z.string().email().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
  })
  .transform((data) => ({
    copyright: data.copyright,
    contactEmail: data.contact_email,
    links: data.links,
  }))

export type HeroContent = z.infer<typeof heroContentSchema>
export type PillarItem = z.infer<typeof pillarItemSchema>
export type PillarsContent = z.infer<typeof pillarsContentSchema>
export type SystemsContent = z.infer<typeof systemsContentSchema>
export type FooterContent = z.infer<typeof footerContentSchema>
