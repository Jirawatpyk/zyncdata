import StatusBadge from '@/components/patterns/StatusBadge'
import HealthConfigDialog from './HealthConfigDialog'
import HealthHistoryPanel from './HealthHistoryPanel'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { SystemHealthSummary } from '@/lib/validations/health'

interface SystemsHealthTableProps {
  systems: SystemHealthSummary[]
}

function formatConfigValue(value: number | null, unit: string, defaultLabel: string): string {
  if (value == null) return `${defaultLabel} (default)`
  return `${value}${unit}`
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
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">History</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Config</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {systems.map((system) => (
            <tr
              key={system.id}
              className={cn(
                'transition-colors',
                system.status === 'offline' && 'bg-destructive/10',
              )}
              data-testid={`health-row-${system.id}`}
            >
              <td className="px-4 py-3">
                <div className="font-medium">{system.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatConfigValue(system.checkInterval, 's', '60s')}
                  {' / '}
                  {formatConfigValue(system.timeoutThreshold, 'ms', '10000ms')}
                  {' / '}
                  {formatConfigValue(system.failureThreshold, ' failures', '3 failures')}
                </div>
              </td>
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
              <td className="px-4 py-3 text-center">
                <HealthHistoryPanel
                  systemId={system.id}
                  systemName={system.name}
                  systemStatus={system.status}
                  timeoutThreshold={system.timeoutThreshold}
                />
              </td>
              <td className="px-4 py-3 text-center">
                <HealthConfigDialog systemId={system.id} systemName={system.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
