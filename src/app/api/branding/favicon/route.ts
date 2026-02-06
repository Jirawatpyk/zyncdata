import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { uploadBrandingAsset, deleteBrandingAsset } from '@/lib/content/branding-mutations'
import { updateSectionContent } from '@/lib/content/mutations'
import { getLandingPageContent } from '@/lib/content/queries'
import { uploadBrandingFaviconSchema } from '@/lib/validations/branding'

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
    const validated = uploadBrandingFaviconSchema.parse({
      fileName: (file as File).name ?? 'favicon.png',
      fileSize: file.size,
      fileType: file.type,
    })

    // Get current theme to check for existing favicon
    const content = await getLandingPageContent()
    const currentFaviconUrl = content.theme.faviconUrl

    // Convert to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const newUrl = await uploadBrandingAsset(
      'favicon',
      bytes,
      validated.fileName,
      validated.fileType,
      currentFaviconUrl,
    )

    // Update theme section with new favicon URL
    const updatedTheme = { ...content.theme, faviconUrl: newUrl }
    await updateSectionContent('theme', updatedTheme, auth.user.id)

    return NextResponse.json({ data: { faviconUrl: newUrl }, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    console.error('[POST /api/branding/favicon]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to upload favicon', code: 'UPLOAD_ERROR' } },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    // Get current theme to find existing favicon URL
    const content = await getLandingPageContent()
    const currentFaviconUrl = content.theme.faviconUrl

    // Delete from storage
    await deleteBrandingAsset(currentFaviconUrl)

    // Update theme section to clear favicon URL
    const updatedTheme = { ...content.theme, faviconUrl: null }
    await updateSectionContent('theme', updatedTheme, auth.user.id)

    return NextResponse.json({ data: { faviconUrl: null }, error: null })
  } catch (error) {
    console.error('[DELETE /api/branding/favicon]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { data: null, error: { message: 'Failed to delete favicon', code: 'DELETE_ERROR' } },
      { status: 500 },
    )
  }
}
