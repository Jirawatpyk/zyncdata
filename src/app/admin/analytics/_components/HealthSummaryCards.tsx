import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HealthDashboardSummary } from '@/lib/validations/health'

interface HealthSummaryCardsProps {
  summary: HealthDashboardSummary
}

export default function HealthSummaryCards({ summary }: HealthSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Systems',
      value: summary.total,
      icon: Activity,
      color: 'text-foreground',
      testId: 'summary-total',
    },
    {
      title: 'Online',
      value: summary.online,
      icon: CheckCircle,
      color: 'text-emerald-600',
      testId: 'summary-online',
    },
    {
      title: 'Offline',
      value: summary.offline,
      icon: XCircle,
      color: 'text-red-600',
      testId: 'summary-offline',
    },
    {
      title: 'Avg Response Time',
      value: summary.avgResponseTime !== null ? `${summary.avgResponseTime} ms` : 'N/A',
      icon: Clock,
      color: 'text-muted-foreground',
      testId: 'summary-avg-response',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="health-summary-cards">
      {cards.map((card) => (
        <Card key={card.testId} data-testid={card.testId}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={cn('h-4 w-4', card.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', card.color)}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
