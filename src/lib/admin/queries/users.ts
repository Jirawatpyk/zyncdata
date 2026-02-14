import { queryOptions } from '@tanstack/react-query'
import type { CmsUser } from '@/lib/validations/user'
import { unwrapResponse } from './api-adapter'

export const usersQueryOptions = queryOptions({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    const res = await fetch('/api/users')
    return unwrapResponse<CmsUser[]>(res)
  },
  staleTime: 60_000,
})
