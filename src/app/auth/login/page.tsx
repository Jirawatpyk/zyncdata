import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/queries'
import LoginForm from './_components/LoginForm'

export const metadata = {
  title: 'Login | zyncdata',
  description: 'Sign in to the zyncdata CMS',
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm />
    </main>
  )
}
