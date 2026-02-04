import Link from 'next/link'

export const metadata = {
  title: 'MFA Setup | zyncdata',
  description: 'Set up multi-factor authentication for your account',
}

export default function MfaEnrollPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-white/10 bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">MFA Setup</h1>
        <p className="text-sm text-muted-foreground">
          MFA Setup coming in Story 2.2
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-sm text-dxt-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2"
        >
          Back to Login
        </Link>
      </div>
    </main>
  )
}
