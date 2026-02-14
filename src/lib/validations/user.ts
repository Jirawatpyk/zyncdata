import { z } from 'zod'

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

/** CMS user as displayed in the admin UI (camelCase) */
export interface CmsUser {
  id: string
  email: string
  role: string // 'super_admin' | 'admin' | 'user'
  isConfirmed: boolean // email confirmed
  lastSignInAt: string | null
  createdAt: string
}
