import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import type { CmsUser } from '@/lib/validations/user'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/** Transform Supabase Auth user to CmsUser (snake_case → camelCase) */
function transformAuthUser(authUser: SupabaseUser): CmsUser {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    role: (authUser.app_metadata?.role as string) ?? 'user',
    isConfirmed: !!authUser.email_confirmed_at,
    lastSignInAt: authUser.last_sign_in_at ?? null,
    createdAt: authUser.created_at,
  }
}

/**
 * List all CMS users from Supabase Auth Admin API.
 * Requires service role client (server-only).
 */
export async function listCmsUsers(): Promise<CmsUser[]> {
  const serviceClient = createServiceClient()
  const {
    data: { users },
    error,
  } = await serviceClient.auth.admin.listUsers()

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  return users.map(transformAuthUser)
}
