import { redirect } from 'next/navigation'
import { getCurrentUser, getMfaStatus } from '@/lib/auth/queries'
import MfaEnrollForm from './_components/MfaEnrollForm'

export const metadata = {
  title: 'MFA Setup | zyncdata',
  description: 'Set up multi-factor authentication for your account',
}

export default async function MfaEnrollPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const { hasNoFactors, needsMfaVerification } = await getMfaStatus()
  if (!hasNoFactors && needsMfaVerification) redirect('/auth/mfa-verify')
  if (!hasNoFactors && !needsMfaVerification) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center">
      <MfaEnrollForm />
    </main>
  )
}
