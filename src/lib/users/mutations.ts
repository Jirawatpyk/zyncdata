import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import type { CreateUserInput, CmsUser } from '@/lib/validations/user'

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

  const user = createData.user

  // Step 2: Send invite email (user sets own password)
  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`,
  })

  if (inviteError) {
    // User was created but invite failed — log but don't throw
    // The user appears in the list as "Invited" and can be re-invited later
    console.warn('[users] Invite email failed for:', input.email, inviteError.message)
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role: (user.app_metadata?.role as string) ?? 'user',
    isConfirmed: !!user.email_confirmed_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at,
  }
}
