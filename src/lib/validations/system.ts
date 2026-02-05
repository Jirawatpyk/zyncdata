import { z } from 'zod'

// Input schema for creating a new system (AC: #3, #4)
export const createSystemSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name must be 100 characters or less'),
  url: z.string().url('Valid URL required'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  enabled: z.boolean().default(true),
})

// Use z.input for form input type (allows optional with defaults)
// Use z.infer for API output type (resolved with defaults applied)
export type CreateSystemInput = z.input<typeof createSystemSchema>
export type CreateSystemOutput = z.output<typeof createSystemSchema>

// Full system schema (database response)
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
  deletedAt: z.string().nullable(),
})

export type System = z.infer<typeof systemSchema>

// Input schema for updating an existing system (Story 3.3, AC: #3)
export const updateSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
  name: z.string().min(1, 'Name required').max(100, 'Name must be 100 characters or less'),
  url: z.string().url('Valid URL required'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  enabled: z.boolean(),
})

export type UpdateSystemInput = z.infer<typeof updateSystemSchema>

// Input schema for deleting a system (Story 3.4, AC: #3)
export const deleteSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
})

export type DeleteSystemInput = z.infer<typeof deleteSystemSchema>
