import { queryOptions } from '@tanstack/react-query'
import type { NotificationSettings } from '@/lib/validations/health'
import { unwrapResponse } from './api-adapter'

export function notificationSettingsQueryOptions() {
  return queryOptions({
    queryKey: ['admin', 'notifications', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/notifications/settings')
      return unwrapResponse<NotificationSettings>(res)
    },
    staleTime: 5 * 60 * 1000,
  })
}
