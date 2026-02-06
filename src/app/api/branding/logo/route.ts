import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { uploadBrandingAsset, deleteBrandingAsset } from '@/lib/content/branding-mutations'
import { updateSectionContent } from '@/lib/content/mutations'
import { getLandingPageContent } from '@/lib/content/queries'
import { uploadBrandingLogoSchema } from '@/lib/validations/branding'

export async function POST(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
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
    const validated = uploadBrandingLogoSchema.parse({
      fileName: (file as File).name ?? 'upload.png',
      fileSize: file.size,
      fileType: file.type,
    })

    // Get current theme to check for existing logo
    const content = await getLandingPageContent()
    const currentLogoUrl = content.theme.logoUrl

    // Convert to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const newUrl = await uploadBrandingAsset(
      'logo',
      bytes,
      validated.fileName,
      validated.fileType,
      currentLogoUrl,
    )

    // Update theme section with new logo URL
    const updatedTheme = { ...content.theme, logoUrl: newUrl }
    await updateSectionContent('theme', updatedTheme, auth.user.id)

    return NextResponse.json({ data: { logoUrl: newUrl }, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    console.error('[POST /api/branding/logo]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to upload logo', code: 'UPLOAD_ERROR' } },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    // Get current theme to find existing logo URL
    const content = await getLandingPageContent()
    const currentLogoUrl = content.theme.logoUrl

    // Delete from storage
    await deleteBrandingAsset(currentLogoUrl)

    // Update theme section to clear logo URL
    const updatedTheme = { ...content.theme, logoUrl: null }
    await updateSectionContent('theme', updatedTheme, auth.user.id)

    return NextResponse.json({ data: { logoUrl: null }, error: null })
  } catch (error) {
    console.error('[DELETE /api/branding/logo]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to delete logo', code: 'DELETE_ERROR' } },
      { status: 500 },
    )
  }
}
