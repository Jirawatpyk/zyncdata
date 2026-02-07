'use client'

import dynamic from 'next/dynamic'
import type { SystemHealthSummary } from '@/lib/validations/health'

const Chart = dynamic(() => import('./ResponseTimeChartInner'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded bg-muted" data-testid="chart-loading" />,
})

interface ResponseTimeChartProps {
  systems: SystemHealthSummary[]
}

export default function ResponseTimeChart({ systems }: ResponseTimeChartProps) {
  return (
    <div data-testid="response-time-chart">
      <Chart systems={systems} />
    </div>
  )
}
