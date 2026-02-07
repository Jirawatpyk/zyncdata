'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { SystemHealthSummary } from '@/lib/validations/health'

interface ResponseTimeChartInnerProps {
  systems: SystemHealthSummary[]
}

export default function ResponseTimeChartInner({ systems }: ResponseTimeChartInnerProps) {
  const chartData = systems
    .filter((s) => s.responseTime !== null)
    .map((s) => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
      responseTime: s.responseTime,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground" data-testid="chart-empty">
        No response time data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300} data-testid="chart-container">
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis unit=" ms" className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`${value} ms`, 'Response Time']}
          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
        />
        <Bar dataKey="responseTime" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
