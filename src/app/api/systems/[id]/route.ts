import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { updateSystem, deleteSystem } from '@/lib/systems/mutations'
import { updateSystemSchema, deleteSystemSchema } from '@/lib/validations/system'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Body should contain: { name, url, description, enabled }
    // ID comes from URL params, NOT body
    // Cast body to object for spread - Zod will validate the actual shape
    const validated = updateSystemSchema.parse({ id, ...(body as Record<string, unknown>) })
    const system = await updateSystem(validated)

    return NextResponse.json({ data: system, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    // Handle unique constraint violation (duplicate name)
    const isDuplicate =
      (error instanceof Error && error.message.includes('duplicate key')) ||
      (error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505')

    if (isDuplicate) {
      return NextResponse.json(
        {
          data: null,
          error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' },
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to update system', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    const validated = deleteSystemSchema.parse({ id })
    const system = await deleteSystem(validated.id)

    return NextResponse.json({ data: system, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to delete system', code: 'DELETE_ERROR' } },
      { status: 500 },
    )
  }
}
