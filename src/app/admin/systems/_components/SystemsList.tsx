'use client'

import { useQuery } from '@tanstack/react-query'
import { systemsQueryOptions } from '@/lib/admin/queries/systems'
import { useReorderSystems, useToggleSystem } from '@/lib/admin/mutations/systems'
import LoadingSpinner from '@/components/patterns/LoadingSpinner'
import SystemsEmptyState from './SystemsEmptyState'
import AddSystemDialog from './AddSystemDialog'
import EditSystemDialog from './EditSystemDialog'
import DeleteSystemDialog from './DeleteSystemDialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, type SystemCategory } from '@/lib/validations/system'

export default function SystemsList() {
  const { data: systems, isPending, isError } = useQuery(systemsQueryOptions)
  const reorder = useReorderSystems()
  const toggle = useToggleSystem()

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!systems) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const current = systems[index]
    const target = systems[targetIndex]

    reorder.mutate(
      [
        { id: current.id, displayOrder: target.displayOrder },
        { id: target.id, displayOrder: current.displayOrder },
      ],
      {
        onSuccess: () => toast.success('Order updated'),
        onError: () => toast.error('Failed to reorder systems'),
      },
    )
  }

  const handleToggle = (systemId: string, enabled: boolean) => {
    toggle.mutate(
      { id: systemId, enabled },
      {
        onSuccess: () => toast.success(enabled ? 'System enabled' : 'System disabled'),
        onError: () => toast.error('Failed to toggle system visibility'),
      },
    )
  }

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
    <div data-testid="systems-container">
      {/* Header with Add button */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {systems.length} system{systems.length !== 1 ? 's' : ''}
        </h2>
        <AddSystemDialog />
      </div>

      {/* Systems list */}
      <div className="divide-y divide-border" data-testid="systems-list">
        {systems.map((system, index) => (
          <div
            key={system.id}
            className="flex items-center justify-between px-4 py-3"
            data-testid={`system-row-${system.id}`}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{system.name}</span>
                {system.category && (
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    data-testid={`category-badge-${system.id}`}
                  >
                    {CATEGORY_LABELS[system.category as SystemCategory] ?? system.category}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {system.url}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Move up/down buttons (Story 3.5, AC #1, #4) */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === 0 || system.deletedAt != null || reorder.isPending}
                  onClick={() => handleMove(index, 'up')}
                  aria-label={`Move ${system.name} up`}
                  data-testid={`move-up-${system.id}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === systems.length - 1 || system.deletedAt != null || reorder.isPending}
                  onClick={() => handleMove(index, 'down')}
                  aria-label={`Move ${system.name} down`}
                  data-testid={`move-down-${system.id}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              {/* Edit button */}
              <EditSystemDialog system={system} />
              {/* Delete button — hidden for already-deleted systems */}
              {system.deletedAt == null && (
                <DeleteSystemDialog system={system} />
              )}
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
              {/* Deleted badge — shown when deletedAt is set */}
              {system.deletedAt != null && (
                <span
                  className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                  data-testid={`deleted-badge-${system.id}`}
                >
                  Deleted
                </span>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={system.enabled}
                  onCheckedChange={(checked) => handleToggle(system.id, checked)}
                  disabled={system.deletedAt != null || (toggle.isPending && toggle.variables?.id === system.id)}
                  aria-label={`Toggle ${system.name} visibility`}
                  data-testid={`toggle-system-${system.id}`}
                />
                <span className="text-xs text-muted-foreground">
                  {system.enabled ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
