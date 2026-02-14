import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { updateCmsUserRole, LastSuperAdminError } from '@/lib/users/mutations'
import { listCmsUsers } from '@/lib/users/queries'
import { updateUserRoleSchema } from '@/lib/validations/user'
import { ErrorCode } from '@/lib/errors/codes'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireApiAuth('super_admin')
  if (isAuthError(auth)) return auth

  const { userId } = await params

  // Self-role-change prevention (defense-in-depth — UI also hides action)
  if (auth.user.id === userId) {
    return NextResponse.json(
      { data: null, error: { message: 'Cannot change your own role', code: ErrorCode.CONFLICT } },
      { status: 409 },
    )
  }

  try {
    const body = await request.json()
    const validated = updateUserRoleSchema.parse(body)

    // Look up target user's current role
    const users = await listCmsUsers()
    const targetUser = users.find((u) => u.id === userId)
    if (!targetUser) {
      return NextResponse.json(
        { data: null, error: { message: 'User not found', code: ErrorCode.NOT_FOUND } },
        { status: 404 },
      )
    }

    const updated = await updateCmsUserRole(userId, targetUser.role, validated)
    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: ErrorCode.VALIDATION_ERROR } },
        { status: 400 },
      )
    }

    // Last Super Admin protection
    if (error instanceof LastSuperAdminError) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: ErrorCode.CONFLICT } },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to update user role', code: ErrorCode.INTERNAL_ERROR } },
      { status: 500 },
    )
  }
}
