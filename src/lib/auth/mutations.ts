import { createClient } from '@/lib/supabase/client'
import { cleanupUnverifiedFactorsAction } from '@/lib/actions/mfa'

export async function enrollMfaFactor() {
  const supabase = createClient()

  // Clean up stale unverified factors via server action (admin API)
  const cleanup = await cleanupUnverifiedFactorsAction()
  if (cleanup.error) {
    throw new Error(cleanup.error)
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'zyncdata',
  })
  if (error) throw error
  return data
}

export async function verifyMfaEnrollment(factorId: string, code: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  })
  if (error) throw error
  return data
}
