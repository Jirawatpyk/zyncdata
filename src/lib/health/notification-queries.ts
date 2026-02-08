import { createClient } from '@/lib/supabase/server'
import { toCamelCase } from '@/lib/utils/transform'
import type { NotificationSettings, UpdateNotificationSettings } from '@/lib/validations/health'

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_settings')
    .select('id, notification_emails, notify_on_failure, notify_on_recovery, created_at, updated_at')
    .limit(1)
    .single()

  if (error) throw error

  return toCamelCase<NotificationSettings>(data)
}

export async function updateNotificationSettings(
  updates: UpdateNotificationSettings,
): Promise<NotificationSettings> {
  const supabase = await createClient()

  // Get the single settings row ID
  const { data: existing, error: readError } = await supabase
    .from('notification_settings')
    .select('id')
    .limit(1)
    .single()

  if (readError) throw readError

  const { data, error } = await supabase
    .from('notification_settings')
    .update({
      notification_emails: updates.notificationEmails,
      notify_on_failure: updates.notifyOnFailure,
      notify_on_recovery: updates.notifyOnRecovery,
    })
    .eq('id', existing.id)
    .select('id, notification_emails, notify_on_failure, notify_on_recovery, created_at, updated_at')
    .single()

  if (error) throw error

  return toCamelCase<NotificationSettings>(data)
}
