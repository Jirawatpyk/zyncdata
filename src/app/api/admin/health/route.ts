import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { toCamelCase } from '@/lib/utils/transform'
import type { HealthDashboardData, SystemHealthSummary } from '@/lib/validations/health'

const DASHBOARD_SELECT =
  'id, name, url, status, response_time, last_checked_at, consecutive_failures, category, enabled, check_interval, timeout_threshold, failure_threshold'

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('systems')
      .select(DASHBOARD_SELECT)
      .is('deleted_at', null)
      .eq('enabled', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    const systems = (data ?? []).map((s) => toCamelCase<SystemHealthSummary>(s))

    // Sort: offline first, then by original order
    systems.sort((a, b) => {
      const aOffline = a.status === 'offline' ? 0 : 1
      const bOffline = b.status === 'offline' ? 0 : 1
      return aOffline - bOffline
    })

    const onlineCount = systems.filter((s) => s.status === 'online').length
    const offlineCount = systems.filter((s) => s.status === 'offline').length
    const unknownCount = systems.length - onlineCount - offlineCount

    const responseTimes = systems
      .map((s) => s.responseTime)
      .filter((rt): rt is number => rt !== null)
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
        : null

    const result: HealthDashboardData = {
      systems,
      summary: {
        total: systems.length,
        online: onlineCount,
        offline: offlineCount,
        unknown: unknownCount,
        avgResponseTime,
      },
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({ data: result, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch health data', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}
