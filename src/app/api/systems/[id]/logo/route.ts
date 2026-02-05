import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { uploadSystemLogo, deleteSystemLogo } from '@/lib/systems/mutations'
import { uploadLogoSchema } from '@/lib/validations/system'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid form data', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { data: null, error: { message: 'No file provided', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Validate metadata via Zod
    const validated = uploadLogoSchema.parse({
      systemId: id,
      fileName: (file as File).name ?? 'upload.png',
      fileSize: file.size,
      fileType: file.type,
    })

    // Convert to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const system = await uploadSystemLogo(
      validated.systemId,
      bytes,
      validated.fileName,
      validated.fileType,
    )

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
      { data: null, error: { message: 'Failed to upload logo', code: 'UPLOAD_ERROR' } },
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

    // Validate UUID format
    z.string().uuid('Invalid system ID').parse(id)

    const system = await deleteSystemLogo(id)
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
      { data: null, error: { message: 'Failed to delete logo', code: 'DELETE_ERROR' } },
      { status: 500 },
    )
  }
}
