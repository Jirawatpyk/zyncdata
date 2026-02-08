import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'
import { toast } from 'sonner'
import type { HealthConfig, UpdateHealthConfig } from '@/lib/validations/health'

export function useUpdateHealthConfig(systemId: string) {
  const queryClient = useQueryClient()

  return useMutation<HealthConfig, Error, UpdateHealthConfig>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/admin/systems/${systemId}/health-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return unwrapResponse<HealthConfig>(res)
    },

    onSuccess: () => {
      toast.success('Health check settings saved')
      queryClient.invalidateQueries({ queryKey: ['admin', 'health', 'config', systemId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'health', 'dashboard'] })
    },

    onError: () => {
      toast.error('Failed to update health check settings')
    },
  })
}
