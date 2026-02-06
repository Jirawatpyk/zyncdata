import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SystemStatus = 'online' | 'offline' | 'coming_soon' | 'unknown'

interface StatusBadgeProps {
  status: string | null
}

function resolveStatus(status: string | null): SystemStatus {
  if (status === 'online' || status === 'offline' || status === 'coming_soon') return status
  return 'unknown'
}

const STATUS_CONFIG = {
  online: {
    label: 'Online',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ping: true,
  },
  offline: {
    label: 'Offline',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    ping: false,
  },
  unknown: {
    label: 'Status unknown',
    dot: 'bg-gray-400',
    badge: 'bg-gray-50 text-gray-600 border-gray-200',
    ping: false,
  },
  coming_soon: {
    label: 'Coming Soon',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ping: false,
  },
} as const

export default function StatusBadge({ status }: StatusBadgeProps) {
  const resolved = resolveStatus(status)
  const config = STATUS_CONFIG[resolved]

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 border py-0.5', config.badge)}
      aria-label={`System status: ${config.label}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              'motion-safe:animate-ping',
              config.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dot)} />
      </span>
      {config.label}
    </Badge>
  )
}
