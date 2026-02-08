'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { HealthCheck, HealthCheckStatus } from '@/lib/validations/health'

interface HealthCheckHistoryTableProps {
  checks: HealthCheck[]
  total: number
  hasMore: boolean
  isLoadingMore: boolean
  statusFilter: HealthCheckStatus | undefined
  onStatusFilterChange: (status: HealthCheckStatus | undefined) => void
  onLoadMore: () => void
}

const STATUS_FILTERS: { label: string; value: HealthCheckStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Success', value: 'success' },
  { label: 'Failure', value: 'failure' },
]

export default function HealthCheckHistoryTable({
  checks,
  total,
  hasMore,
  isLoadingMore,
  statusFilter,
  onStatusFilterChange,
  onLoadMore,
}: HealthCheckHistoryTableProps) {
  return (
    <div data-testid="health-history-table">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1" data-testid="status-filters">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.label}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              className="min-h-11"
              onClick={() => onStatusFilterChange(filter.value)}
              data-testid={`filter-${filter.label.toLowerCase()}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground" data-testid="record-count">
          Showing {checks.length} of {total}
        </span>
      </div>

      {checks.length === 0 ? (
        <div
          className="flex items-center justify-center p-8 text-muted-foreground"
          data-testid="history-table-empty"
        >
          No records match your filter.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Response Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Error</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {checks.map((check) => (
                  <tr
                    key={check.id}
                    className={cn(
                      'transition-colors',
                      check.status === 'failure' && 'bg-destructive/10',
                    )}
                    data-testid={`history-row-${check.id}`}
                  >
                    <td className="px-4 py-3">
                      <Badge
                        variant={check.status === 'success' ? 'secondary' : 'destructive'}
                        data-testid={`status-badge-${check.id}`}
                      >
                        {check.status === 'success' ? 'Pass' : 'Fail'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {check.responseTime !== null ? `${check.responseTime} ms` : '\u2014'}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {check.errorMessage ?? '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground" title={check.checkedAt}>
                      {formatDistanceToNow(new Date(check.checkedAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                data-testid="load-more-btn"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
