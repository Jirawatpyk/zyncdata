import { queryOptions } from '@tanstack/react-query'
import type { System } from '@/lib/validations/system'
import { unwrapResponse } from './api-adapter'

export const systemsQueryOptions = queryOptions({
  queryKey: ['admin', 'systems'],
  queryFn: async () => {
    const res = await fetch('/api/systems')
    return unwrapResponse<System[]>(res)
  },
  staleTime: 60_000,
})
