import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Unauthorized | zyncdata',
}

export default function UnauthorizedPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background"
      data-testid="unauthorized-page"
    >
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert
            className="h-12 w-12 text-destructive"
            aria-hidden="true"
            data-testid="shield-alert-icon"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/admin"
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2',
              'text-sm font-medium text-primary-foreground shadow-sm',
              'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
            aria-label="Go to Admin"
            data-testid="go-to-admin-link"
          >
            Go to Admin
          </Link>
          <Link
            href="/auth/login"
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2',
              'text-sm font-medium text-muted-foreground',
              'hover:text-foreground focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
            aria-label="Go to Login"
            data-testid="go-to-login-link"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
