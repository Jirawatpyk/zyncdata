import { redirect } from 'next/navigation'
import { getCurrentUser, getMfaStatus } from '@/lib/auth/queries'
import MfaVerifyForm from './_components/MfaVerifyForm'

export const metadata = {
  title: 'Verify Identity - zyncdata',
}

export default async function MfaVerifyPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { hasNoFactors, needsMfaVerification } = await getMfaStatus()

  // If no MFA factors, user needs to enroll first
  if (hasNoFactors) {
    redirect('/auth/mfa-enroll')
  }

  // If already aal2, go to dashboard
  if (!needsMfaVerification) {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <MfaVerifyForm />
    </main>
  )
}
