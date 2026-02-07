import { queryOptions } from '@tanstack/react-query'
import type { HealthDashboardData } from '@/lib/validations/health'
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
