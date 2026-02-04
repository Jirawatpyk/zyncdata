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
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })
  if (challengeError) throw challengeError

  const { data, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) throw verifyError
  return data
}
