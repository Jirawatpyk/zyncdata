'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const buttonClasses = cn(
  'inline-flex h-11 w-28 items-center justify-center rounded-lg bg-gradient-to-r from-dxt-primary to-dxt-secondary text-sm font-medium text-white',
  'shadow-sm shadow-dxt-primary/25 hover:shadow-md hover:shadow-dxt-primary/30',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2',
  'motion-safe:transition-all motion-safe:duration-150',
)

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setIsLoggedIn(!!user)
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Skeleton placeholder while checking auth
  if (isLoggedIn === null) {
    return (
      <span
        className="inline-block h-11 w-28 animate-pulse rounded-lg bg-gray-200"
        data-testid="auth-button-skeleton"
      />
    )
  }

  if (isLoggedIn) {
    return (
      <Link href="/admin" className={buttonClasses} data-testid="header-dashboard-link">
        Dashboard
      </Link>
    )
  }

  return (
    <Link href="/auth/login" className={buttonClasses} data-testid="header-login-link">
      Login
    </Link>
  )
}
