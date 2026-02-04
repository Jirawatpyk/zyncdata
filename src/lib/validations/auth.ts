import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const mfaVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export type MfaVerifyFormData = z.infer<typeof mfaVerifySchema>

export const backupCodeSchema = z.object({
  code: z.coerce
    .string()
    .min(1, 'Backup code is required')
    .transform((val) => val.replace(/[-\s]/g, '').toUpperCase())
    .pipe(z.string().regex(/^[A-F0-9]{8}$/, 'Invalid backup code format')),
})

export type BackupCodeFormData = z.infer<typeof backupCodeSchema>
