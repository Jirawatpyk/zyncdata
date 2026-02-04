import { createClient } from '@/lib/supabase/server'

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function getMfaStatus() {
  const supabase = await createClient()
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const { data: factors } = await supabase.auth.mfa.listFactors()

  const hasNoFactors = !factors?.totp?.length
  const needsMfaVerification = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2'

  return { hasNoFactors, needsMfaVerification, aalData, factors }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
