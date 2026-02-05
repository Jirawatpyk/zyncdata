import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { System, CreateSystemInput, UpdateSystemInput, DeleteSystemInput } from '@/lib/validations/system'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'

interface CreateMutationContext {
  previous: System[] | undefined
  optimistic: System
}

interface UpdateMutationContext {
  previous: System[] | undefined
}

interface DeleteMutationContext {
  previous: System[] | undefined
}

export function useCreateSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, CreateSystemInput, CreateMutationContext>({
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
        deletedAt: null,
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

export function useUpdateSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, UpdateSystemInput, UpdateMutationContext>({
    mutationFn: async (input: UpdateSystemInput) => {
      const { id, ...body } = input
      const res = await fetch(`/api/systems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })

      // Snapshot current data
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic update
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) =>
          s.id === updates.id
            ? {
                ...s,
                name: updates.name,
                url: updates.url,
                description: updates.description ?? null,
                enabled: updates.enabled,
              }
            : s,
        ) ?? [],
      )

      return { previous }
    },

    onSuccess: (updated) => {
      // Replace optimistic update with real server response
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === updated.id ? updated : s)) ?? [],
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

interface ReorderMutationContext {
  previous: System[] | undefined
}

export function useReorderSystems() {
  const queryClient = useQueryClient()

  return useMutation<System[], Error, Array<{ id: string; displayOrder: number }>, ReorderMutationContext>({
    mutationFn: async (systems) => {
      const res = await fetch('/api/systems/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systems }),
      })
      return unwrapResponse<System[]>(res)
    },

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic swap
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) => {
        if (!old) return []
        const next = [...old]
        for (const u of updates) {
          const idx = next.findIndex((s) => s.id === u.id)
          if (idx !== -1) next[idx] = { ...next[idx], displayOrder: u.displayOrder }
        }
        return next.sort((a, b) => a.displayOrder - b.displayOrder)
      })

      return { previous }
    },

    onSuccess: (serverData) => {
      queryClient.setQueryData<System[]>(['admin', 'systems'], serverData)
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'systems'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'systems'] })
    },
  })
}

export function useDeleteSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, DeleteSystemInput, DeleteMutationContext>({
    mutationFn: async ({ id }: DeleteSystemInput) => {
      const res = await fetch(`/api/systems/${id}`, {
        method: 'DELETE',
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })

      // Snapshot current data
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic update — mark as deleted (NOT remove from list)
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) =>
          s.id === id
            ? { ...s, enabled: false, deletedAt: new Date().toISOString() }
            : s,
        ) ?? [],
      )

      return { previous }
    },

    onSuccess: (serverData) => {
      // Replace optimistic entry with real server response
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === serverData.id ? serverData : s)) ?? [],
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
