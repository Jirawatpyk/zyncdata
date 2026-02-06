import { z } from 'zod'

export const heroContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
})

export const introContentSchema = z.object({
  heading: z.string(),
  body: z.string(),
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
export type IntroContent = z.infer<typeof introContentSchema>
export type SystemsContent = z.infer<typeof systemsContentSchema>
export type FooterContent = z.infer<typeof footerContentSchema>
