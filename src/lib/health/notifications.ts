import 'server-only'

import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

interface FailureNotificationPayload {
  systemId: string
  systemName: string
  systemUrl: string
  errorMessage: string | null
  failureCount: number
}

interface RecoveryNotificationPayload {
  systemId: string
  systemName: string
  systemUrl: string
  responseTime: number | null
}

interface NotificationSettings {
  notificationEmails: string[]
  notifyOnFailure: boolean
  notifyOnRecovery: boolean
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const FROM_ADDRESS = process.env.NODE_ENV === 'production'
  ? 'notifications@zyncdata.app'
  : 'onboarding@resend.dev'

const DASHBOARD_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/analytics`
  : 'https://zyncdata.app/admin/analytics'

function createResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.info('[notifications] RESEND_API_KEY not configured, skipping email')
    return null
  }
  return new Resend(apiKey)
}

async function getNotificationSettings(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('notification_emails, notify_on_failure, notify_on_recovery')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[notifications] Failed to fetch notification settings:', error)
    return null
  }

  if (!data) return null

  return {
    notificationEmails: data.notification_emails ?? [],
    notifyOnFailure: data.notify_on_failure ?? true,
    notifyOnRecovery: data.notify_on_recovery ?? true,
  }
}

async function logNotification(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    systemId: string
    notificationType: 'failure' | 'recovery'
    recipientEmails: string[]
    subject: string
    status: 'sent' | 'failed'
    errorMessage?: string
  },
): Promise<void> {
  const { error } = await supabase.from('notification_log').insert({
    system_id: params.systemId,
    notification_type: params.notificationType,
    recipient_emails: params.recipientEmails,
    subject: params.subject,
    status: params.status,
    error_message: params.errorMessage ?? null,
    sent_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[notifications] Failed to log notification:', error)
  }
}

export async function sendFailureNotification(
  payload: FailureNotificationPayload,
  client?: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const resend = createResendClient()
  if (!resend) return

  const supabase = client ?? createServiceClient()
  const settings = await getNotificationSettings(supabase)

  if (!settings || !settings.notifyOnFailure || settings.notificationEmails.length === 0) {
    console.info('[notifications] Failure notification skipped (disabled or no recipients)')
    return
  }

  // Query last successful check for context (AC #2)
  const { data: lastSuccess } = await supabase
    .from('health_checks')
    .select('checked_at')
    .eq('system_id', payload.systemId)
    .eq('status', 'success')
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastSuccessfulCheck = lastSuccess?.checked_at ?? 'Never'
  const failureTime = new Date().toISOString()
  const subject = `[ALERT] System Offline: ${payload.systemName}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="color: #dc2626;">System Offline Alert</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">System:</td><td style="padding: 8px;">${escapeHtml(payload.systemName)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">URL:</td><td style="padding: 8px;">${escapeHtml(payload.systemUrl)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #dc2626; font-weight: bold;">OFFLINE</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Failure Time:</td><td style="padding: 8px;">${escapeHtml(failureTime)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Last Successful Check:</td><td style="padding: 8px;">${escapeHtml(lastSuccessfulCheck)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Error:</td><td style="padding: 8px;">${escapeHtml(payload.errorMessage ?? 'Unknown error')}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Consecutive Failures:</td><td style="padding: 8px;">${payload.failureCount}</td></tr>
      </table>
      <p style="margin-top: 16px;">
        <a href="${DASHBOARD_URL}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
      </p>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: settings.notificationEmails,
      subject,
      html,
    })

    if (error) {
      console.error('[notifications] Resend API error:', error)
      await logNotification(supabase, {
        systemId: payload.systemId,
        notificationType: 'failure',
        recipientEmails: settings.notificationEmails,
        subject,
        status: 'failed',
        errorMessage: error.message,
      })
      return
    }

    console.info(`[notifications] Failure notification sent for ${payload.systemName}`)
    await logNotification(supabase, {
      systemId: payload.systemId,
      notificationType: 'failure',
      recipientEmails: settings.notificationEmails,
      subject,
      status: 'sent',
    })
  } catch (err) {
    console.error('[notifications] Failed to send failure notification:', err)
    await logNotification(supabase, {
      systemId: payload.systemId,
      notificationType: 'failure',
      recipientEmails: settings.notificationEmails,
      subject,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

export async function sendRecoveryNotification(
  payload: RecoveryNotificationPayload,
  client?: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const resend = createResendClient()
  if (!resend) return

  const supabase = client ?? createServiceClient()
  const settings = await getNotificationSettings(supabase)

  if (!settings || !settings.notifyOnRecovery || settings.notificationEmails.length === 0) {
    console.info('[notifications] Recovery notification skipped (disabled or no recipients)')
    return
  }

  const recoveryTime = new Date().toISOString()
  const subject = `[RESOLVED] System Online: ${payload.systemName}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="color: #16a34a;">System Recovered</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">System:</td><td style="padding: 8px;">${escapeHtml(payload.systemName)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">URL:</td><td style="padding: 8px;">${escapeHtml(payload.systemUrl)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">ONLINE (Recovered)</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Recovery Time:</td><td style="padding: 8px;">${escapeHtml(recoveryTime)}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Response Time:</td><td style="padding: 8px;">${payload.responseTime ?? 'N/A'}ms</td></tr>
      </table>
      <p style="margin-top: 16px;">
        <a href="${DASHBOARD_URL}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
      </p>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: settings.notificationEmails,
      subject,
      html,
    })

    if (error) {
      console.error('[notifications] Resend API error:', error)
      await logNotification(supabase, {
        systemId: payload.systemId,
        notificationType: 'recovery',
        recipientEmails: settings.notificationEmails,
        subject,
        status: 'failed',
        errorMessage: error.message,
      })
      return
    }

    console.info(`[notifications] Recovery notification sent for ${payload.systemName}`)
    await logNotification(supabase, {
      systemId: payload.systemId,
      notificationType: 'recovery',
      recipientEmails: settings.notificationEmails,
      subject,
      status: 'sent',
    })
  } catch (err) {
    console.error('[notifications] Failed to send recovery notification:', err)
    await logNotification(supabase, {
      systemId: payload.systemId,
      notificationType: 'recovery',
      recipientEmails: settings.notificationEmails,
      subject,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
