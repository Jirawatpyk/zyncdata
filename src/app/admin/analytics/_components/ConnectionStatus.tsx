'use client'

import { Badge } from '@/components/ui/badge'
import { Wifi } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ConnectionStatusProps {
  lastUpdated: string
  refetchInterval: number
}

export default function ConnectionStatus({ lastUpdated, refetchInterval }: ConnectionStatusProps) {
  const intervalSeconds = Math.round(refetchInterval / 1000)

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="connection-status">
      <Wifi className="h-4 w-4" />
      <Badge variant="outline" className="gap-1">
        Polling
      </Badge>
      <span data-testid="last-updated">
        Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
      </span>
      <span className="text-xs" data-testid="refresh-interval">
        (auto-refresh every {intervalSeconds}s)
      </span>
    </div>
  )
}
