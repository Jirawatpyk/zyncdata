import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getSystems } from '@/lib/systems/queries'

export async function GET() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const systems = await getSystems()
    return NextResponse.json({ data: systems, error: null })
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Failed to fetch systems', code: 'FETCH_ERROR' },
      },
      { status: 500 },
    )
  }
}
