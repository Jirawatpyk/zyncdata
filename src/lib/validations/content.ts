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

export type HeroContent = z.infer<typeof heroContentSchema>
export type PillarItem = z.infer<typeof pillarItemSchema>
export type PillarsContent = z.infer<typeof pillarsContentSchema>
export type SystemsContent = z.infer<typeof systemsContentSchema>
export type FooterContent = z.infer<typeof footerContentSchema>
