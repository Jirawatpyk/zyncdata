'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { loginSchema } from '@/lib/validations/auth'
import { signInWithEmail, getMfaStatus } from '@/lib/auth/queries'
import { getLoginRatelimit } from '@/lib/ratelimit/login'
import { headers } from 'next/headers'

export type LoginState = {
  error: string | null
  rateLimited: boolean
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Rate limit check
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success } = await getLoginRatelimit().limit(ip)
  if (!success) {
    return { error: 'Too many login attempts. Please try again later.', rateLimited: true }
  }

  // Validate input
  const raw = { email: formData.get('email'), password: formData.get('password') }
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, rateLimited: false }
  }

  // Attempt sign in + check MFA status
  try {
    await signInWithEmail(parsed.data.email, parsed.data.password)

    // Check MFA status after successful login
    const { hasNoFactors, needsMfaVerification } = await getMfaStatus()
    if (hasNoFactors) {
      redirect('/auth/mfa-enroll')
    } else if (needsMfaVerification) {
      redirect('/auth/mfa-verify')
    } else {
      redirect('/admin')
    }
  } catch (err) {
    // redirect() throws a NEXT_REDIRECT error — rethrow it
    if (isRedirectError(err)) {
      throw err
    }
    // All auth/MFA errors → generic message (no credential enumeration)
    return { error: 'Invalid email or password', rateLimited: false }
  }
}
