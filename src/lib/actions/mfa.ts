'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { mfaVerifySchema } from '@/lib/validations/auth'
import { getMfaRatelimit } from '@/lib/ratelimit/mfa'
import { getCurrentUser } from '@/lib/auth/queries'

export type MfaEnrollState = {
  error: string | null
  rateLimited: boolean
}

export async function cleanupUnverifiedFactorsAction(): Promise<{ error: string | null }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect('/auth/login')
    }

    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // List all factors for this user via admin API
    const { data: userData } = await supabase.auth.admin.getUserById(user.id)
    const factors = userData?.user?.factors ?? []

    for (const factor of factors) {
      if (factor.status === 'unverified') {
        await supabase.auth.admin.mfa.deleteFactor({
          userId: user.id,
          id: factor.id,
        })
      }
    }

    return { error: null }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: 'Failed to clean up MFA factors.' }
  }
}

export async function verifyMfaEnrollmentAction(
  _prevState: MfaEnrollState,
  formData: FormData,
): Promise<MfaEnrollState> {
  try {
    // Auth check — user must be logged in (AAL1)
    const user = await getCurrentUser()
    if (!user) {
      redirect('/auth/login')
    }

    // Rate limit by user ID (not IP — per architecture spec)
    const { success } = await getMfaRatelimit().limit(user.id)
    if (!success) {
      return { error: 'Too many attempts. Please try again later.', rateLimited: true }
    }

    // Validate TOTP code format
    const raw = { code: formData.get('code') }
    const parsed = mfaVerifySchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message, rateLimited: false }
    }

    // Server action validates code format + enforces rate limiting.
    // Client component calls this FIRST, then calls verifyMfaEnrollment()
    // client-side only if this returns { error: null }.
    return { error: null, rateLimited: false }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err
    }
    return { error: 'An unexpected error occurred. Please try again.', rateLimited: false }
  }
}
