'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    // TODO(#future): Log error to Sentry once configured
    // For now, browser dev tools will capture the error boundary error
    void error
  }, [error])

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6"
      role="alert"
      data-testid="admin-error"
    >
      <AlertTriangle
        className="h-12 w-12 text-destructive"
        aria-hidden="true"
      />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading this page.
        </p>
      </div>
      <Button onClick={reset} className="min-h-11">
        Try again
      </Button>
    </div>
  )
}
