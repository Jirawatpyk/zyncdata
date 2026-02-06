'use client'

import { useState, useEffect } from 'react'
import { getRelativeTimeString } from '@/lib/utils/relative-time'

interface RelativeTimeProps {
  lastCheckedAt: string | null
}

export default function RelativeTime({ lastCheckedAt }: RelativeTimeProps) {
  const [timeText, setTimeText] = useState(() => formatTime(lastCheckedAt))

  useEffect(() => {
    if (!lastCheckedAt) return

    const interval = setInterval(() => {
      setTimeText(formatTime(lastCheckedAt))
    }, 60_000)

    return () => clearInterval(interval)
  }, [lastCheckedAt])

  return (
    <span className="text-xs text-gray-500" aria-label={`Last checked: ${timeText}`}>
      {lastCheckedAt ? `Last checked: ${timeText}` : timeText}
    </span>
  )
}

function formatTime(lastCheckedAt: string | null): string {
  if (!lastCheckedAt) return 'Never checked'
  return getRelativeTimeString(new Date(lastCheckedAt))
}
