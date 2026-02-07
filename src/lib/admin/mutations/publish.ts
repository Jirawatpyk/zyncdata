import { useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'
import { toast } from 'sonner'

interface PublishResult {
  publishedAt: string
}

interface PublishStatus {
  hasDrafts: boolean
  draftSections: string[]
}

export function usePublishChanges() {
  const queryClient = useQueryClient()

  return useMutation<PublishResult, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/content/publish', { method: 'POST' })
      return unwrapResponse<PublishResult>(res)
    },

    onSuccess: () => {
      toast.success('Changes published successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'publish-status'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
    },

    onError: () => {
      toast.error('Failed to publish changes')
    },
  })
}

export const publishStatusQueryOptions = queryOptions({
  queryKey: ['admin', 'publish-status'] as const,
  queryFn: async () => {
    const res = await fetch('/api/content/publish')
    return unwrapResponse<PublishStatus>(res)
  },
  staleTime: 30_000,
  refetchOnWindowFocus: true,
})
