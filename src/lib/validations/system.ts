import { z } from 'zod'

export const systemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  logoUrl: z.string().nullable(),
  description: z.string().nullable(),
  displayOrder: z.number().int(),
})

export type System = z.infer<typeof systemSchema>
