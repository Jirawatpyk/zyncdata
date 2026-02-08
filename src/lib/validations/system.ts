import { z } from 'zod'

// Category constants (Story 4-B)
export const SYSTEM_CATEGORIES = [
  'dxt_smart_platform',
  'dxt_solutions',
  'dxt_game',
] as const

export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<SystemCategory, string> = {
  dxt_smart_platform: 'DxT Smart Platform',
  dxt_solutions: 'DxT Solutions',
  dxt_game: 'DxT Game',
}

/** Auto-prepend https:// if no protocol is provided */
const urlWithAutoProtocol = z
  .string()
  .min(1, 'URL required')
  .transform((val) => (!/^https?:\/\//i.test(val) ? `https://${val}` : val))
  .pipe(z.string().url('Valid URL required'))

// Input schema for creating a new system (AC: #3, #4)
export const createSystemSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name must be 100 characters or less'),
  url: urlWithAutoProtocol,
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  enabled: z.boolean().default(true),
  category: z.enum(SYSTEM_CATEGORIES).nullable().optional(),
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
  lastCheckedAt: z.string().nullable(),
  category: z.string().nullable(),
  consecutiveFailures: z.number().int(),
  checkInterval: z.number().int().nullable(),
  timeoutThreshold: z.number().int().nullable(),
  failureThreshold: z.number().int().nullable(),
})

export type System = z.infer<typeof systemSchema>

// Input schema for updating an existing system (Story 3.3, AC: #3)
export const updateSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
  name: z.string().min(1, 'Name required').max(100, 'Name must be 100 characters or less'),
  url: urlWithAutoProtocol,
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  enabled: z.boolean(),
  category: z.enum(SYSTEM_CATEGORIES).nullable().optional(),
})

export type UpdateSystemInput = z.infer<typeof updateSystemSchema>

// Input schema for deleting a system (Story 3.4, AC: #3)
export const deleteSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
})

export type DeleteSystemInput = z.infer<typeof deleteSystemSchema>

// Input schema for reordering systems (Story 3.5, AC: #1)
export const reorderSystemsSchema = z.object({
  systems: z
    .array(
      z.object({
        id: z.string().uuid('Invalid system ID'),
        displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
      }),
    )
    .min(2, 'At least 2 systems required for reorder')
    .max(100, 'Too many systems in single reorder')
    .refine(
      (systems) => new Set(systems.map((s) => s.id)).size === systems.length,
      { message: 'Duplicate system IDs are not allowed' },
    ),
})

export type ReorderSystemsInput = z.infer<typeof reorderSystemsSchema>

// Input schema for toggling system visibility (Story 3.6, AC: #1)
export const toggleSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
  enabled: z.boolean(),
})

export type ToggleSystemInput = z.infer<typeof toggleSystemSchema>

// Max file size: 512KB (architecture target is 10KB, but allow larger originals)
export const MAX_LOGO_SIZE = 512 * 1024 // 512KB

export const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
] as const

// Server-side validation for the upload API (validates parsed FormData fields)
export const uploadLogoSchema = z.object({
  systemId: z.string().uuid('Invalid system ID'),
  fileName: z.string().min(1, 'File name required'),
  fileSize: z.number().max(MAX_LOGO_SIZE, 'File must be less than 512KB'),
  fileType: z
    .string()
    .refine(
      (val): val is (typeof ALLOWED_LOGO_TYPES)[number] =>
        (ALLOWED_LOGO_TYPES as readonly string[]).includes(val),
      { message: 'File must be JPEG, PNG, SVG, or WebP' },
    ),
})

export type UploadLogoInput = z.infer<typeof uploadLogoSchema>
