import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getSystems } from '@/lib/systems/queries'
import { createSystem } from '@/lib/systems/mutations'
import { createSystemSchema } from '@/lib/validations/system'

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

export async function POST(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const body = await request.json()
    const validated = createSystemSchema.parse(body)
    const system = await createSystem(validated)
    return NextResponse.json({ data: system, error: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        {
          data: null,
          error: { message, code: 'VALIDATION_ERROR' },
        },
        { status: 400 },
      )
    }

    // Handle unique constraint violation (duplicate name)
    // Check both Error.message and PostgrestError.code for robustness
    const isDuplicate =
      (error instanceof Error && error.message.includes('duplicate key')) ||
      (error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505')

    if (isDuplicate) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: 'A system with this name already exists',
            code: 'DUPLICATE_NAME',
          },
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        data: null,
        error: { message: 'Failed to create system', code: 'CREATE_ERROR' },
      },
      { status: 500 },
    )
  }
}
