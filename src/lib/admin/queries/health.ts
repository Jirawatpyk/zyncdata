import { queryOptions } from '@tanstack/react-query'
import type { HealthDashboardData, HealthConfig, HealthHistoryResponse, HealthHistoryFilters } from '@/lib/validations/health'
import { unwrapResponse } from './api-adapter'

export const healthDashboardQueryOptions = queryOptions({
  queryKey: ['admin', 'health', 'dashboard'],
  queryFn: async () => {
    const res = await fetch('/api/admin/health')
    return unwrapResponse<HealthDashboardData>(res)
  },
  staleTime: 30_000,
  refetchInterval: 60_000,
})

export function healthHistoryQueryOptions(
  systemId: string,
  filters: HealthHistoryFilters,
) {
  return queryOptions({
    queryKey: ['admin', 'health', 'history', systemId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(filters.limit ?? 20),
        offset: String(filters.offset ?? 0),
      })
      if (filters.status) params.set('status', filters.status)

      const res = await fetch(`/api/admin/health/${systemId}/history?${params}`)
      return unwrapResponse<HealthHistoryResponse>(res)
    },
    staleTime: 30_000,
  })
}

export function systemHealthConfigQueryOptions(systemId: string) {
  return queryOptions({
    queryKey: ['admin', 'health', 'config', systemId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/systems/${systemId}/health-config`)
      return unwrapResponse<HealthConfig>(res)
    },
  })
}
