import { BarChart3 } from 'lucide-react'
import EmptyState from '@/components/patterns/EmptyState'

export const metadata = {
  title: 'Analytics | Admin | zyncdata',
}

export default function AnalyticsPage() {
  return (
    <div className="p-6" data-testid="analytics-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          View health monitoring analytics
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="Analytics Coming Soon"
          description="This feature will be available in Epic 5."
        />
      </div>
    </div>
  )
}
