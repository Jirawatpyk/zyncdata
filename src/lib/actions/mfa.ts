'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { mfaVerifySchema } from '@/lib/validations/auth'
import { getMfaRatelimit } from '@/lib/ratelimit/mfa'
import { getCurrentUser } from '@/lib/auth/queries'

export type MfaEnrollState = {
  error: string | null
  rateLimited: boolean
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
