import { z } from 'zod'

export const systemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  logoUrl: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  responseTime: z.number().int().nullable(),
  displayOrder: z.number().int(),
  enabled: z.boolean(),
  // Supabase returns timestamps with/without timezone offset - use string() with permissive validation
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type System = z.infer<typeof systemSchema>
