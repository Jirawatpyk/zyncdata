import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { publishAllContent, getPublishStatus } from '@/lib/content/publish'

export async function POST() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { publishedAt } = await publishAllContent(auth.user.id)
    return NextResponse.json({ data: { publishedAt }, error: null })
  } catch (error) {
    console.error('[POST /api/content/publish]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to publish changes', code: 'PUBLISH_ERROR' } },
      { status: 500 },
    )
  }
}

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const status = await getPublishStatus()
    return NextResponse.json({ data: status, error: null })
  } catch (error) {
    console.error('[GET /api/content/publish]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch publish status', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}
