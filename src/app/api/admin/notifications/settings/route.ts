import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getNotificationSettings, updateNotificationSettings } from '@/lib/health/notification-queries'
import { updateNotificationSettingsSchema } from '@/lib/validations/health'

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const settings = await getNotificationSettings()
    return NextResponse.json({ data: settings, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch notification settings', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const body: unknown = await request.json()
    const parsed = updateNotificationSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const updated = await updateNotificationSettings(parsed.data)
    return NextResponse.json({ data: updated, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to update notification settings', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
