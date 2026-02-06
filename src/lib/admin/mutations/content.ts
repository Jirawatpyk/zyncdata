import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LandingPageContent } from '@/lib/content/queries'
import type { ContentRow } from '@/lib/content/mutations'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'
import { toast } from 'sonner'

interface UpdateSectionInput {
  section: 'hero' | 'pillars' | 'footer'
  content: Record<string, unknown>
}

interface UpdateSectionContext {
  previous: LandingPageContent | undefined
}

export function useUpdateSection() {
  const queryClient = useQueryClient()

  return useMutation<ContentRow, Error, UpdateSectionInput, UpdateSectionContext>({
    mutationFn: async ({ section, content }: UpdateSectionInput) => {
      const res = await fetch(`/api/content/${section}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      return unwrapResponse<ContentRow>(res)
    },

    onMutate: async ({ section, content }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'content'] })

      const previous = queryClient.getQueryData<LandingPageContent>(['admin', 'content'])

      // Optimistic update
      queryClient.setQueryData<LandingPageContent>(['admin', 'content'], (old) => {
        if (!old) return old
        return {
          ...old,
          [section]: content,
        }
      })

      return { previous }
    },

    onSuccess: () => {
      toast.success('Content updated')
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'content'], context.previous)
      }
      toast.error('Failed to update content')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
    },
  })
}
