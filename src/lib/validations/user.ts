import { z } from 'zod'

/** All roles including super_admin — used in Change Role dialog (Story 6-2) */
export const ALL_ROLES = ['super_admin', 'admin', 'user'] as const
export type AllRole = (typeof ALL_ROLES)[number]

export const ALL_ROLE_LABELS: Record<AllRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

/** Roles that can be assigned via the Add User form (super_admin excluded) */
export const ASSIGNABLE_ROLES = ['admin', 'user'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const ROLE_LABELS: Record<AssignableRole, string> = {
  admin: 'Admin',
  user: 'User',
}

/** Schema for creating a new CMS user via Add User dialog */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Valid email address required')
    .max(255, 'Email must be 255 characters or less'),
  role: z.enum(ASSIGNABLE_ROLES, { message: 'Role is required' }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

/** Schema for updating a CMS user's role via Change Role dialog */
export const updateUserRoleSchema = z.object({
  role: z.enum(ALL_ROLES, { message: 'Role is required' }),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>

/** Schema for the update-password form (user-facing password reset) */
export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

/** CMS user as displayed in the admin UI (camelCase) */
export interface CmsUser {
  id: string
  email: string
  role: AllRole
  isConfirmed: boolean // email confirmed
  lastSignInAt: string | null
  createdAt: string
}
