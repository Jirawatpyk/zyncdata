import { queryOptions } from '@tanstack/react-query'
import type { LandingPageContent } from '@/lib/content/queries'
import { unwrapResponse } from './api-adapter'

export const contentQueryOptions = queryOptions({
  queryKey: ['admin', 'content'] as const,
  queryFn: async () => {
    const res = await fetch('/api/content')
    return unwrapResponse<LandingPageContent>(res)
  },
  staleTime: 60_000,
})
