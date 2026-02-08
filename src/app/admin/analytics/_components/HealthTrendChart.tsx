'use client'

import dynamic from 'next/dynamic'
import type { HealthCheck } from '@/lib/validations/health'

const Chart = dynamic(() => import('./HealthTrendChartInner'), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse rounded bg-muted" data-testid="trend-chart-loading" />,
})

interface HealthTrendChartProps {
  checks: HealthCheck[]
  timeoutThreshold?: number | null
}

export default function HealthTrendChart({ checks, timeoutThreshold }: HealthTrendChartProps) {
  return (
    <div data-testid="health-trend-chart">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Response Time Trend</h3>
      <Chart checks={checks} timeoutThreshold={timeoutThreshold} />
    </div>
  )
}
