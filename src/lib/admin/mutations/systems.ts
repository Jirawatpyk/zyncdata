import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { System, CreateSystemInput } from '@/lib/validations/system'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'

interface MutationContext {
  previous: System[] | undefined
  optimistic: System
}

export function useCreateSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, CreateSystemInput, MutationContext>({
    mutationFn: async (input: CreateSystemInput) => {
      const res = await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async (newSystem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })

      // Snapshot current data
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic insert with temp ID
      const optimistic: System = {
        id: `temp-${Date.now()}`,
        name: newSystem.name,
        url: newSystem.url,
        description: newSystem.description ?? null,
        logoUrl: null,
        status: null,
        responseTime: null,
        displayOrder: previous?.length ?? 0,
        enabled: newSystem.enabled ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) => [
        ...(old ?? []),
        optimistic,
      ])

      return { previous, optimistic }
    },

    onSuccess: (created, _variables, context) => {
      // Replace temp item with real server response
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === context?.optimistic.id ? created : s)) ?? [
          created,
        ],
      )
    },

    onError: (_error, _variables, context) => {
      // Rollback to snapshot
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'systems'], context.previous)
      }
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin', 'systems'] })
    },
  })
}
