import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { reorderSystems } from '@/lib/systems/mutations'
import { reorderSystemsSchema } from '@/lib/validations/system'

export async function PATCH(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const validated = reorderSystemsSchema.parse(body)
    const systems = await reorderSystems(validated.systems)
    return NextResponse.json({ data: systems, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { data: null, error: { message: 'Failed to reorder systems', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
