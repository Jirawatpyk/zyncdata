import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { listCmsUsers } from '@/lib/users/queries'
import { createCmsUser } from '@/lib/users/mutations'
import { createUserSchema } from '@/lib/validations/user'
import { ErrorCode } from '@/lib/errors/codes'

export async function GET() {
  const auth = await requireApiAuth('super_admin')
  if (isAuthError(auth)) return auth

  try {
    const users = await listCmsUsers()
    return NextResponse.json({ data: users, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch users', code: ErrorCode.INTERNAL_ERROR } },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAuth('super_admin')
  if (isAuthError(auth)) return auth

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid request body', code: ErrorCode.VALIDATION_ERROR } },
        { status: 400 },
      )
    }
    const validated = createUserSchema.parse(body)
    const user = await createCmsUser(validated)
    return NextResponse.json({ data: user, error: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: ErrorCode.VALIDATION_ERROR } },
        { status: 400 },
      )
    }

    // Handle duplicate email
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: ErrorCode.CONFLICT } },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to create user', code: ErrorCode.INTERNAL_ERROR } },
      { status: 500 },
    )
  }
}
