'use client'

import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ConnectionState } from '@/lib/hooks/useHealthMonitor'

interface ConnectionStatusProps {
  lastUpdated: string
  refetchInterval: number
  connectionState?: ConnectionState
}

const stateConfig = {
  connected: {
    label: 'Real-time',
    variant: 'default',
    Icon: Wifi,
    className: 'bg-green-600 text-white',
  },
  reconnecting: {
    label: 'Reconnecting...',
    variant: 'secondary',
    Icon: WifiOff,
    className: 'bg-amber-500 text-white',
  },
  disconnected: {
    label: 'Polling',
    variant: 'outline',
    Icon: Wifi,
    className: '',
  },
} as const

export default function ConnectionStatus({
  lastUpdated,
  refetchInterval,
  connectionState = 'disconnected',
}: ConnectionStatusProps) {
  const intervalSeconds = Math.round(refetchInterval / 1000)
  const { label, variant, Icon, className } = stateConfig[connectionState]

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="connection-status">
      <Icon className="h-4 w-4" />
      <Badge variant={variant} className={cn('gap-1', className)}>
        {label}
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
