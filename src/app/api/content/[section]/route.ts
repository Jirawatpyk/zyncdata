import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { updateSectionContent } from '@/lib/content/mutations'
import {
  heroContentSchema,
  pillarsContentSchema,
} from '@/lib/validations/content'
import { stripHtml, sanitizeHtml } from '@/lib/content/sanitize'

const VALID_SECTIONS = ['hero', 'pillars', 'footer'] as const
type ValidSection = (typeof VALID_SECTIONS)[number]

// Zod schema for each section (input validation — before DB transform)
const sectionSchemas: Record<ValidSection, z.ZodTypeAny> = {
  hero: heroContentSchema,
  pillars: pillarsContentSchema,
  // Footer input uses camelCase (contactEmail) from the form.
  // We validate with a raw schema (no transform) then reverse-map manually.
  footer: z.object({
    copyright: z.string().min(1, 'Copyright is required'),
    contactEmail: z.string().email().optional(),
    links: z.array(z.object({ label: z.string().min(1, 'Label is required'), url: z.string().min(1, 'URL is required') })),
  }),
}

/** Sanitize hero content: strip HTML from plain text, sanitize rich text */
function sanitizeHeroContent(content: { title: string; subtitle: string; description: string }) {
  return {
    title: stripHtml(content.title),
    subtitle: stripHtml(content.subtitle),
    description: sanitizeHtml(content.description),
  }
}

/** Sanitize pillars content: strip HTML from plain text fields */
function sanitizePillarsContent(content: { heading: string; items: Array<{ title: string; description: string; url: string | null; icon?: string }> }) {
  return {
    heading: stripHtml(content.heading),
    items: content.items.map((item) => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      url: item.url,
      icon: item.icon,
    })),
  }
}

/** Sanitize footer content and reverse transform camelCase → snake_case for DB */
function sanitizeAndTransformFooterContent(content: { copyright: string; contactEmail?: string; links: Array<{ label: string; url: string }> }) {
  return {
    copyright: stripHtml(content.copyright),
    contact_email: content.contactEmail ? stripHtml(content.contactEmail) : undefined,
    links: content.links.map((link) => ({
      label: stripHtml(link.label),
      url: link.url,
    })),
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { section } = await params

    // Validate section name is in whitelist
    if (!VALID_SECTIONS.includes(section as ValidSection)) {
      return NextResponse.json(
        {
          data: null,
          error: { message: `Invalid section: ${section}`, code: 'NOT_FOUND' },
        },
        { status: 404 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Validate and sanitize based on section type
    const schema = sectionSchemas[section as ValidSection]
    const validated = schema.parse(body)

    let dbContent: Record<string, unknown>
    const sectionKey = section as ValidSection
    if (sectionKey === 'hero') {
      dbContent = sanitizeHeroContent(validated as { title: string; subtitle: string; description: string })
    } else if (sectionKey === 'pillars') {
      dbContent = sanitizePillarsContent(validated as { heading: string; items: Array<{ title: string; description: string; url: string | null; icon?: string }> })
    } else {
      dbContent = sanitizeAndTransformFooterContent(validated as { copyright: string; contactEmail?: string; links: Array<{ label: string; url: string }> })
    }

    const row = await updateSectionContent(section, dbContent, auth.user.id)

    return NextResponse.json({ data: row, error: null })
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

    console.error('[PATCH /api/content/section]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        data: null,
        error: { message: 'Failed to update content', code: 'UPDATE_ERROR' },
      },
      { status: 500 },
    )
  }
}
