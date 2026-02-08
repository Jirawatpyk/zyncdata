'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { healthHistoryQueryOptions } from '@/lib/admin/queries/health'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/patterns/StatusBadge'
import HealthCheckHistoryTable from './HealthCheckHistoryTable'
import HealthTrendChart from './HealthTrendChart'
import { History } from 'lucide-react'
import type { HealthCheckStatus } from '@/lib/validations/health'

interface HealthHistoryPanelProps {
  systemId: string
  systemName: string
  systemStatus: string | null
  timeoutThreshold?: number | null
}

const PAGE_SIZE = 20

export default function HealthHistoryPanel({
  systemId,
  systemName,
  systemStatus,
  timeoutThreshold,
}: HealthHistoryPanelProps) {
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<HealthCheckStatus | undefined>(undefined)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const { data, isPending, isFetching } = useQuery({
    ...healthHistoryQueryOptions(systemId, {
      limit,
      offset: 0,
      status: statusFilter,
    }),
    enabled: open && !!systemId,
  })

  const checks = data?.checks ?? []
  const total = data?.total ?? 0
  const hasMore = checks.length < total

  const handleStatusFilterChange = useCallback((status: HealthCheckStatus | undefined) => {
    setStatusFilter(status)
    setLimit(PAGE_SIZE)
  }, [])

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE)
  }, [])

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setStatusFilter(undefined)
      setLimit(PAGE_SIZE)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          data-testid={`health-history-trigger-${systemId}`}
        >
          <History className="h-4 w-4" />
          <span className="sr-only">View health history for {systemName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="health-history-dialog">
        <DialogHeader>
          <DialogTitle>Health History: {systemName}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Status: <StatusBadge status={systemStatus} />
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="space-y-4" data-testid="health-history-loading">
            <div className="h-[200px] animate-pulse rounded bg-muted" />
            <div className="h-[200px] animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="space-y-6">
            <HealthTrendChart
              checks={checks}
              timeoutThreshold={timeoutThreshold}
            />
            <HealthCheckHistoryTable
              checks={checks}
              total={total}
              hasMore={hasMore}
              isLoadingMore={isFetching && limit > PAGE_SIZE}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              onLoadMore={handleLoadMore}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
