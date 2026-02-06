import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getLandingPageContent } from '@/lib/content/queries'

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const content = await getLandingPageContent()
    return NextResponse.json({ data: content, error: null })
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Failed to fetch content', code: 'FETCH_ERROR' },
      },
      { status: 500 },
    )
  }
}
