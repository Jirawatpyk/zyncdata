'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import type { HealthCheck } from '@/lib/validations/health'

interface HealthTrendChartInnerProps {
  checks: HealthCheck[]
  timeoutThreshold?: number | null
}

interface ChartDataPoint {
  timestamp: string
  responseTime: number | null
  status: string
  formattedTime: string
}

function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: ChartDataPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null

  const color = payload.status === 'success' ? 'var(--primary)' : 'var(--destructive)'
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="none" />
}

export default function HealthTrendChartInner({ checks, timeoutThreshold }: HealthTrendChartInnerProps) {
  // Reverse to show oldest → newest (left-to-right reading)
  const chartData: ChartDataPoint[] = [...checks].reverse().map((check) => ({
    timestamp: check.checkedAt,
    responseTime: check.responseTime,
    status: check.status,
    formattedTime: format(new Date(check.checkedAt), 'HH:mm'),
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground" data-testid="trend-chart-empty">
        No response time data available.
      </div>
    )
  }

  return (
    <div data-testid="trend-chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="formattedTime"
            className="text-xs"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            unit=" ms"
            className="text-xs"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value} ms`, 'Response Time']}
            labelFormatter={(label) => `Time: ${label}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.1}
            dot={<CustomDot />}
            connectNulls={false}
          />
          {timeoutThreshold && (
            <ReferenceLine
              y={timeoutThreshold}
              stroke="var(--destructive)"
              strokeDasharray="5 5"
              label={{ value: `Timeout: ${timeoutThreshold}ms`, position: 'right', fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
