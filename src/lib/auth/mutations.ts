import { createClient } from '@/lib/supabase/client'

export async function enrollMfaFactor() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
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
