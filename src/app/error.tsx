'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-800">Something went wrong</h2>
      <p className="mt-2 text-lg text-gray-600">Please try again later.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-dxt-primary px-6 py-3 text-sm font-medium text-white hover:bg-dxt-primary/90 focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:outline-none"
      >
        Try again
      </button>
    </div>
  )
}
