'use client'

import { useQuery } from '@tanstack/react-query'
import { systemsQueryOptions } from '@/lib/admin/queries/systems'
import LoadingSpinner from '@/components/patterns/LoadingSpinner'
import SystemsEmptyState from './SystemsEmptyState'
import { cn } from '@/lib/utils'

export default function SystemsList() {
  const { data: systems, isPending, isError } = useQuery(systemsQueryOptions)

  if (isPending) {
    return <LoadingSpinner />
  }

  if (isError) {
    return (
      <div
        className="flex items-center justify-center p-8 text-destructive"
        role="alert"
        data-testid="systems-error"
      >
        Failed to load systems. Please try again.
      </div>
    )
  }

  if (!systems || systems.length === 0) {
    return <SystemsEmptyState />
  }

  return (
    <div className="divide-y divide-border" data-testid="systems-list">
      {systems.map((system) => (
        <div
          key={system.id}
          className="flex items-center justify-between px-4 py-3"
          data-testid={`system-row-${system.id}`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{system.name}</span>
            <span className="text-sm text-muted-foreground">{system.url}</span>
          </div>
          <div className="flex items-center gap-3">
            {system.status && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  system.status === 'operational'
                    ? 'bg-green-100 text-green-700'
                    : system.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700',
                )}
              >
                {system.status}
              </span>
            )}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                system.enabled
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500',
              )}
            >
              {system.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
