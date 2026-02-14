import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { transformAuthUser } from '@/lib/users/queries'
import type { CreateUserInput, CmsUser, UpdateUserRoleInput } from '@/lib/validations/user'

/**
 * Send a password reset email to a CMS user via Supabase Auth.
 * Uses service client (implicit flow) — MUST NOT use SSR server client (PKCE breaks admin-triggered resets).
 *
 * @param userId - The user ID to reset password for
 * @returns { email } on success (used by toast)
 * @throws Error with "User not found" if userId doesn't exist
 * @throws Error with "Failed to send password reset email" if email delivery fails
 */
export async function resetCmsUserPassword(userId: string): Promise<{ email: string }> {
  const serviceClient = createServiceClient()

  // Step 1: Look up user email from userId
  const { data: userData, error: getUserError } = await serviceClient.auth.admin.getUserById(userId)

  if (getUserError || !userData.user) {
    throw new Error('User not found')
  }

  const email = userData.user.email
  if (!email) {
    throw new Error('User not found')
  }

  // Step 2: Send password reset email (implicit flow — no code_challenge)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    console.warn('[users] NEXT_PUBLIC_SITE_URL is not configured — password reset redirect may fail')
  }
  const { error: resetError } = await serviceClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl ?? ''}/auth/update-password`,
  })

  if (resetError) {
    throw new Error(`Failed to send password reset email: ${resetError.message}`)
  }

  return { email }
}

/** Typed error for last-super-admin protection (caught by route handler) */
export class LastSuperAdminError extends Error {
  constructor() {
    super('At least one Super Admin is required')
    this.name = 'LastSuperAdminError'
  }
}

/**
 * Create a new CMS user via Supabase Auth Admin API.
 * Two-step flow: createUser (with role in app_metadata) → inviteUserByEmail.
 *
 * @throws Error with "already exists" message for duplicate emails (→ CONFLICT)
 */
export async function createCmsUser(input: CreateUserInput): Promise<CmsUser> {
  const serviceClient = createServiceClient()

  // Step 1: Create user with role in app_metadata
  const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
    email: input.email,
    app_metadata: { role: input.role },
    email_confirm: false, // User must confirm via invite link
  })

  if (createError) {
    // Supabase Auth returns specific error for duplicate email
    if (
      createError.message.includes('already been registered') ||
      createError.message.includes('already exists')
    ) {
      throw new Error('A user with this email already exists')
    }
    throw new Error(`Failed to create user: ${createError.message}`)
  }

  if (!createData.user) {
    throw new Error('Failed to create user: no user returned')
  }

  // Step 2: Send invite email (user sets own password)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    console.warn('[users] NEXT_PUBLIC_SITE_URL is not configured — invite redirect may fail')
  }

  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${siteUrl ?? ''}/auth/login`,
  })

  if (inviteError) {
    // User was created but invite failed — log but don't throw
    // The user appears in the list as "Invited" and can be re-invited later
    console.warn('[users] Invite email failed for:', input.email, inviteError.message)
  }

  return transformAuthUser(createData.user)
}

/**
 * Update a CMS user's role via Supabase Auth Admin API.
 * Enforces last-super-admin protection server-side.
 *
 * @param userId - The user ID to update
 * @param currentRole - The user's current role (used for last-super-admin check)
 * @param input - The new role to assign
 * @throws LastSuperAdminError if demoting the last super admin
 * @throws Error with "Failed to update user role" for Supabase API errors
 */
export async function updateCmsUserRole(
  userId: string,
  currentRole: string,
  input: UpdateUserRoleInput,
): Promise<CmsUser> {
  const serviceClient = createServiceClient()

  // Last Super Admin check: only when demoting FROM super_admin
  if (currentRole === 'super_admin' && input.role !== 'super_admin') {
    const { data: { users } } = await serviceClient.auth.admin.listUsers()
    const superAdminCount = users.filter(
      (u) => u.app_metadata?.role === 'super_admin',
    ).length
    if (superAdminCount <= 1) {
      throw new LastSuperAdminError()
    }
  }

  const { data, error } = await serviceClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: input.role },
  })

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  return transformAuthUser(data.user)
}
