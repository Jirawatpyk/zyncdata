import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'
import { toast } from 'sonner'
import type { NotificationSettings, UpdateNotificationSettings } from '@/lib/validations/health'

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation<NotificationSettings, Error, UpdateNotificationSettings>({
    mutationFn: async (data) => {
      const res = await fetch('/api/admin/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return unwrapResponse<NotificationSettings>(res)
    },

    onSuccess: () => {
      toast.success('Notification settings saved')
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications', 'settings'] })
    },

    onError: () => {
      toast.error('Failed to save notification settings')
    },
  })
}
