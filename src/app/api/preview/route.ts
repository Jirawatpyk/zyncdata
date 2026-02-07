import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getEnabledSystemsByCategory } from '@/lib/systems/queries'
import { getThemeCssVars, getThemeFontVar } from '@/lib/content/theme-provider'
import {
  heroContentSchema,
  pillarsContentSchema,
  systemsContentSchema,
  themeContentSchema,
  FONT_FAMILY_MAP,
  GOOGLE_FONTS_URL,
} from '@/lib/validations/content'
import { SYSTEM_CATEGORIES, CATEGORY_LABELS } from '@/lib/validations/system'
import { ErrorCode } from '@/lib/errors/codes'
import { z } from 'zod'

// Footer uses a local camelCase schema because data arrives from the React Query
// cache (already transformed by footerContentSchema). The canonical
// footerContentSchema in validations/content.ts uses .transform() to convert
// snake_case DB fields → camelCase, so it cannot validate already-camelCase input.
// If footerContentSchema gains new fields, update this schema too.
const previewFooterSchema = z.object({
  copyright: z.string().min(1),
  contactEmail: z.string().email().optional(),
  links: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })),
})

const previewPayloadSchema = z.object({
  hero: heroContentSchema,
  pillars: pillarsContentSchema,
  footer: previewFooterSchema,
  systems: systemsContentSchema,
  theme: themeContentSchema,
})

type PreviewPayload = z.infer<typeof previewPayloadSchema>

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildPreviewHtml(
  payload: PreviewPayload,
  systems: Record<string, { name: string; url: string; description: string | null; logoUrl: string | null; status: string | null }[]>,
): string {
  const cssVars = getThemeCssVars(payload.theme)
  const fontVar = getThemeFontVar(payload.theme)
  const fontFamily = FONT_FAMILY_MAP[payload.theme.font]

  const cssVarStyle = Object.entries(cssVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')

  // Build pillars HTML
  const pillarsHtml = payload.pillars.items.length > 0
    ? `<section style="background:#f8fafc;padding:4rem 0">
        <div style="max-width:80rem;margin:0 auto;padding:0 1rem">
          <div style="text-align:center;margin-bottom:2.5rem">
            <div style="width:5rem;height:6px;border-radius:9999px;background:linear-gradient(to right,var(--dxt-primary),var(--dxt-accent),var(--dxt-secondary));margin:0 auto 1.5rem"></div>
            <h2 style="font-size:1.875rem;font-weight:bold;color:#1f2937">${escapeHtml(payload.pillars.heading)}</h2>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem">
            ${payload.pillars.items.map((item) => `
              <div style="border-left:2px solid var(--dxt-primary);padding:1.5rem;border-radius:0.75rem">
                <h3 style="font-size:1.125rem;font-weight:600;color:#1f2937">${escapeHtml(item.title)}</h3>
                <p style="margin-top:0.5rem;font-size:0.875rem;color:#6b7280">${escapeHtml(item.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
    : ''

  // Build systems HTML
  const tabOrder = [...SYSTEM_CATEGORIES, 'other'] as const
  const visibleTabs = tabOrder
    .filter((key) => systems[key] && systems[key].length > 0)
    .map((key) => ({
      key,
      label: key === 'other' ? 'Other' : CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
    }))

  const systemsHtml = visibleTabs.length > 0
    ? `<section style="padding:4rem 0">
        <div style="max-width:80rem;margin:0 auto;padding:0 1rem">
          <div style="text-align:center;margin-bottom:2.5rem">
            <h2 style="font-size:1.875rem;font-weight:bold;color:#1f2937">${escapeHtml(payload.systems.heading)}</h2>
            <p style="margin-top:0.75rem;font-size:1rem;color:#6b7280">${escapeHtml(payload.systems.subtitle)}</p>
          </div>
          ${visibleTabs.map((tab) => `
            <div style="margin-bottom:2rem">
              <h3 style="font-size:1.25rem;font-weight:600;color:#374151;margin-bottom:1rem">${escapeHtml(tab.label)}</h3>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem">
                ${(systems[tab.key] ?? []).map((sys) => `
                  <div style="border:1px solid #e5e7eb;border-radius:0.75rem;padding:1.5rem">
                    <h4 style="font-weight:600;color:#1f2937">${escapeHtml(sys.name)}</h4>
                    ${sys.description ? `<p style="font-size:0.875rem;color:#6b7280;margin-top:0.5rem">${escapeHtml(sys.description)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`
    : ''

  // Build footer links
  const footerLinksHtml = payload.footer.links.length > 0
    ? `<nav style="display:flex;gap:1.5rem;justify-content:center">
        ${payload.footer.links.map((link) => `<a href="${escapeHtml(link.url)}" style="font-size:0.875rem;color:#94a3b8;text-decoration:none">${escapeHtml(link.label)}</a>`).join('')}
      </nav>`
    : ''

  const googleFontsUrl = GOOGLE_FONTS_URL[payload.theme.font]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview - DxT Smart Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${googleFontsUrl}" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { ${cssVarStyle}; --font-sans: ${fontVar}; }
    body { font-family: ${fontFamily}; padding-top: 40px; color: #1f2937; }
  </style>
</head>
<body>
  <!-- Preview Banner -->
  <div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#000;text-align:center;padding:8px;font-weight:bold;">
    PREVIEW - Not Published
  </div>

  <!-- Header -->
  <header style="position:sticky;top:40px;z-index:50;border-bottom:1px solid rgba(229,231,235,0.5);background:rgba(255,255,255,0.8);backdrop-filter:blur(12px)">
    <div style="max-width:80rem;margin:0 auto;display:flex;height:76px;align-items:center;justify-content:space-between;padding:0 1rem">
      ${payload.theme.logoUrl
        ? `<img src="${escapeHtml(payload.theme.logoUrl)}" alt="Platform Logo" style="height:40px;width:auto" />`
        : `<span style="font-size:1.125rem"><strong>D</strong><strong style="color:var(--dxt-primary)">x</strong><strong>T</strong> <span style="color:#4b5563">Smart Platform &amp; Solutions</span></span>`
      }
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section style="background:linear-gradient(to bottom right,#0f172a,#1e293b,#0f172a);padding:4rem 0 6rem;text-align:center">
      <div style="max-width:48rem;margin:0 auto;padding:0 1rem">
        <h1 style="font-weight:bold;color:white;font-size:2.5rem">${escapeHtml(payload.hero.title)}</h1>
        <p style="margin-top:1.5rem;font-size:1.5rem;font-weight:600;background:linear-gradient(to right,var(--dxt-accent),var(--dxt-primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${escapeHtml(payload.hero.subtitle)}</p>
        <p style="margin-top:1.5rem;font-size:1.125rem;color:#cbd5e1;line-height:1.75">${escapeHtml(payload.hero.description)}</p>
      </div>
    </section>

    ${pillarsHtml}
    ${systemsHtml}
  </main>

  <!-- Footer -->
  <footer style="background:#0f172a;padding:2.5rem 0">
    <div style="max-width:80rem;margin:0 auto;padding:0 1rem;text-align:center">
      <span style="font-size:0.875rem">
        <strong style="color:#e2e8f0">D</strong><strong style="color:var(--dxt-primary)">x</strong><strong style="color:#e2e8f0">T</strong>
        <span style="color:#94a3b8"> Smart Platform &amp; Solutions</span>
      </span>
      <div style="margin-top:1.25rem">${footerLinksHtml}</div>
      ${payload.footer.contactEmail
        ? `<p style="margin-top:1.25rem;font-size:0.875rem;color:#94a3b8">Contact: <a href="mailto:${escapeHtml(payload.footer.contactEmail)}" style="color:var(--dxt-accent);text-decoration:none">${escapeHtml(payload.footer.contactEmail)}</a></p>`
        : ''
      }
      <p style="margin-top:1.25rem;font-size:0.75rem;color:#94a3b8">&copy; ${escapeHtml(payload.footer.copyright)}</p>
    </div>
  </footer>
</body>
</html>`
}

export async function POST(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid JSON body', code: ErrorCode.VALIDATION_ERROR } },
      { status: 400 },
    )
  }

  const parsed = previewPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { message: 'Invalid preview payload', code: ErrorCode.VALIDATION_ERROR } },
      { status: 400 },
    )
  }

  try {
    const systems = await getEnabledSystemsByCategory()
    const html = buildPreviewHtml(parsed.data, systems)
    return NextResponse.json({ data: html, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to render preview', code: ErrorCode.INTERNAL_ERROR } },
      { status: 500 },
    )
  }
}
