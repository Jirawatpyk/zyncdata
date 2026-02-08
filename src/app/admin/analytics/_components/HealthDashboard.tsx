'use client'

import { useQuery } from '@tanstack/react-query'
import { healthDashboardQueryOptions } from '@/lib/admin/queries/health'
import { useHealthMonitor } from '@/lib/hooks/useHealthMonitor'
import type { HealthDashboardData } from '@/lib/validations/health'
import HealthSummaryCards from './HealthSummaryCards'
import SystemsHealthTable from './SystemsHealthTable'
import ResponseTimeChart from './ResponseTimeChart'
import ConnectionStatus from './ConnectionStatus'
import AnalyticsSkeleton from './AnalyticsSkeleton'

interface HealthDashboardProps {
  initialData?: HealthDashboardData
}

export default function HealthDashboard({ initialData }: HealthDashboardProps) {
  const { connectionState } = useHealthMonitor()
  const { data, isPending, isError } = useQuery({
    ...healthDashboardQueryOptions,
    initialData,
  })

  if (isPending) {
    return <AnalyticsSkeleton />
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive" role="alert" data-testid="dashboard-error">
        Failed to load health data. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="health-dashboard">
      <ConnectionStatus
        lastUpdated={data.lastUpdated}
        refetchInterval={healthDashboardQueryOptions.refetchInterval as number}
        connectionState={connectionState}
      />
      <HealthSummaryCards summary={data.summary} />
      <SystemsHealthTable systems={data.systems} />
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Response Times</h2>
        <ResponseTimeChart systems={data.systems} />
      </div>
    </div>
  )
}
