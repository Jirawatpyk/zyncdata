import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { resetCmsUserPassword } from '@/lib/users/mutations'
import { ErrorCode } from '@/lib/errors/codes'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireApiAuth('super_admin')
  if (isAuthError(auth)) return auth

  const { userId } = await params

  try {
    const result = await resetCmsUserPassword(userId)
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'User not found') {
      return NextResponse.json(
        { data: null, error: { message, code: ErrorCode.NOT_FOUND } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to send password reset email', code: ErrorCode.INTERNAL_ERROR } },
      { status: 500 },
    )
  }
}
