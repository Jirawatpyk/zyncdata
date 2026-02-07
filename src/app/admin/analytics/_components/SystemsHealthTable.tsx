import StatusBadge from '@/components/patterns/StatusBadge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { SystemHealthSummary } from '@/lib/validations/health'

interface SystemsHealthTableProps {
  systems: SystemHealthSummary[]
}

export default function SystemsHealthTable({ systems }: SystemsHealthTableProps) {
  if (systems.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground" data-testid="health-table-empty">
        No systems found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border" data-testid="health-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">System</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Response Time</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Last Checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {systems.map((system) => (
            <tr
              key={system.id}
              className={cn(
                'transition-colors',
                system.status === 'offline' && 'bg-red-50',
              )}
              data-testid={`health-row-${system.id}`}
            >
              <td className="px-4 py-3 font-medium">{system.name}</td>
              <td className="px-4 py-3">
                <StatusBadge status={system.status} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {system.responseTime !== null ? `${system.responseTime} ms` : 'N/A'}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {system.lastCheckedAt
                  ? formatDistanceToNow(new Date(system.lastCheckedAt), { addSuffix: true })
                  : 'Never'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
