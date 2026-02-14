import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AllRole, CmsUser, CreateUserInput } from '@/lib/validations/user'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'

interface CreateUserMutationContext {
  previous: CmsUser[] | undefined
  optimistic: CmsUser
}

interface UpdateUserRoleMutationContext {
  previous: CmsUser[] | undefined
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<CmsUser, Error, CreateUserInput, CreateUserMutationContext>({
    mutationFn: async (input: CreateUserInput) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      return unwrapResponse<CmsUser>(res)
    },

    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] })

      const previous = queryClient.getQueryData<CmsUser[]>(['admin', 'users'])

      // Optimistic insert with temp ID
      const optimistic: CmsUser = {
        id: `temp-${Date.now()}`,
        email: newUser.email,
        role: newUser.role,
        isConfirmed: false,
        lastSignInAt: null,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<CmsUser[]>(['admin', 'users'], (old) => [
        ...(old ?? []),
        optimistic,
      ])

      return { previous, optimistic }
    },

    onSuccess: (created, _variables, context) => {
      // Replace temp item with real server response
      queryClient.setQueryData<CmsUser[]>(['admin', 'users'], (old) =>
        old?.map((u) => (u.id === context?.optimistic.id ? created : u)) ?? [created],
      )
    },

    onError: (_error, _variables, context) => {
      // Rollback to snapshot
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'users'], context.previous)
      }
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

interface UpdateUserRoleVariables {
  userId: string
  role: AllRole
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation<CmsUser, Error, UpdateUserRoleVariables, UpdateUserRoleMutationContext>({
    mutationFn: async ({ userId, role }: UpdateUserRoleVariables) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      return unwrapResponse<CmsUser>(res)
    },

    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] })
      const previous = queryClient.getQueryData<CmsUser[]>(['admin', 'users'])

      queryClient.setQueryData<CmsUser[]>(['admin', 'users'], (old) =>
        old?.map((u) => (u.id === userId ? { ...u, role } : u)) ?? [],
      )

      return { previous }
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'users'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
