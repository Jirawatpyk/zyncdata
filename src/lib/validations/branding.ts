import { z } from 'zod'

export const MAX_LOGO_SIZE = 512 * 1024 // 512KB
export const MAX_FAVICON_SIZE = 64 * 1024 // 64KB

export const ALLOWED_LOGO_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/webp',
] as const

export const ALLOWED_FAVICON_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/x-icon',
] as const

export const uploadBrandingLogoSchema = z.object({
  fileName: z.string().min(1, 'File name required').max(255, 'File name too long'),
  fileSize: z.number().min(1, 'File cannot be empty').max(MAX_LOGO_SIZE, 'File must be less than 512KB'),
  fileType: z
    .string()
    .refine(
      (val): val is (typeof ALLOWED_LOGO_TYPES)[number] =>
        (ALLOWED_LOGO_TYPES as readonly string[]).includes(val),
      { message: 'File must be PNG, SVG, or WebP' },
    ),
})

export const uploadBrandingFaviconSchema = z.object({
  fileName: z.string().min(1, 'File name required').max(255, 'File name too long'),
  fileSize: z.number().min(1, 'File cannot be empty').max(MAX_FAVICON_SIZE, 'File must be less than 64KB'),
  fileType: z
    .string()
    .refine(
      (val): val is (typeof ALLOWED_FAVICON_TYPES)[number] =>
        (ALLOWED_FAVICON_TYPES as readonly string[]).includes(val),
      { message: 'File must be PNG, SVG, or ICO' },
    ),
})
