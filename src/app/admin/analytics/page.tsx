import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { toCamelCase } from '@/lib/utils/transform'
import type { HealthDashboardData, SystemHealthSummary } from '@/lib/validations/health'
import AnalyticsSkeleton from './_components/AnalyticsSkeleton'
import HealthDashboard from './_components/HealthDashboard'

export const metadata = {
  title: 'Analytics | Admin | zyncdata',
}

const DASHBOARD_SELECT =
  'id, name, url, status, response_time, last_checked_at, consecutive_failures, category, enabled'

async function AnalyticsContent() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('systems')
    .select(DASHBOARD_SELECT)
    .is('deleted_at', null)
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  const systems = (data ?? []).map((s) => toCamelCase<SystemHealthSummary>(s))
  systems.sort((a, b) => {
    const aOffline = a.status === 'offline' ? 0 : 1
    const bOffline = b.status === 'offline' ? 0 : 1
    return aOffline - bOffline
  })

  const onlineCount = systems.filter((s) => s.status === 'online').length
  const offlineCount = systems.filter((s) => s.status === 'offline').length
  const responseTimes = systems
    .map((s) => s.responseTime)
    .filter((rt): rt is number => rt !== null)
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : null

  const initialData: HealthDashboardData = {
    systems,
    summary: {
      total: systems.length,
      online: onlineCount,
      offline: offlineCount,
      unknown: systems.length - onlineCount - offlineCount,
      avgResponseTime,
    },
    lastUpdated: new Date().toISOString(),
  }

  return <HealthDashboard initialData={initialData} />
}

export default function AnalyticsPage() {
  return (
    <div className="p-6" data-testid="analytics-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Health Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Monitor system health, response times, and availability
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
