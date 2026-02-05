'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  delay?: number
}

export default function LoadingSpinner({
  className,
  delay = 200,
}: LoadingSpinnerProps) {
  const [show, setShow] = useState(delay === 0)

  useEffect(() => {
    if (delay === 0) return

    const timer = setTimeout(() => {
      setShow(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!show) {
    return null
  }

  return (
    <div
      className={cn('flex items-center justify-center p-8', className)}
      role="status"
      aria-label="Loading"
      aria-live="polite"
      data-testid="loading-spinner"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
