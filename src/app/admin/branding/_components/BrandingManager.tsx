'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSuspenseQuery } from '@tanstack/react-query'
import { contentQueryOptions } from '@/lib/admin/queries/content'
import { COLOR_SCHEME_PALETTES, FONT_FAMILY_MAP } from '@/lib/validations/content'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import PreviewButton from '@/app/admin/_components/PreviewButton'
import PublishButton from '@/app/admin/_components/PublishButton'
import ColorSchemeEditor from './ColorSchemeEditor'
import FontSelector from './FontSelector'
import LogoUploader from './LogoUploader'
import FaviconUploader from './FaviconUploader'

type EditingCard = 'colorScheme' | 'font' | 'logo' | 'favicon' | null

export default function BrandingManager() {
  const { data: content } = useSuspenseQuery(contentQueryOptions)
  const [editing, setEditing] = useState<EditingCard>(null)

  const theme = content.theme
  const palette = COLOR_SCHEME_PALETTES[theme.colorScheme]

  return (
    <div data-testid="branding-manager">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Theme &amp; Branding</h1>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <PublishButton />
          </Suspense>
          <PreviewButton />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Color Scheme */}
        <div className="rounded-lg border border-border bg-card p-6" data-testid="card-color-scheme">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Color Scheme</h2>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: palette.primary }} />
            <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: palette.secondary }} />
            <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: palette.accent }} />
            <span className="ml-2 text-sm text-muted-foreground">{theme.colorScheme}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing('colorScheme')} data-testid="edit-color-scheme-button">
            <Pencil className="mr-2 h-4 w-4" />
            Change
          </Button>
        </div>

        {/* Font */}
        <div className="rounded-lg border border-border bg-card p-6" data-testid="card-font">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Font Family</h2>
          <p className="mb-4 text-sm text-muted-foreground" style={{ fontFamily: FONT_FAMILY_MAP[theme.font] }}>
            {theme.font} — The quick brown fox jumps over the lazy dog
          </p>
          <Button variant="outline" size="sm" onClick={() => setEditing('font')} data-testid="edit-font-button">
            <Pencil className="mr-2 h-4 w-4" />
            Change
          </Button>
        </div>

        {/* Logo */}
        <div className="rounded-lg border border-border bg-card p-6" data-testid="card-logo">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Platform Logo</h2>
          <div className="mb-4">
            {theme.logoUrl ? (
              <Image src={theme.logoUrl} alt="Platform logo" width={160} height={40} className="h-10 w-auto" unoptimized data-testid="logo-preview" />
            ) : (
              <span className="text-sm text-muted-foreground" data-testid="logo-placeholder">Text-based &quot;DxT&quot; mark (default)</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing('logo')} data-testid="edit-logo-button">
            <Pencil className="mr-2 h-4 w-4" />
            Change
          </Button>
        </div>

        {/* Favicon */}
        <div className="rounded-lg border border-border bg-card p-6" data-testid="card-favicon">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Favicon</h2>
          <div className="mb-4">
            {theme.faviconUrl ? (
              <Image src={theme.faviconUrl} alt="Favicon" width={32} height={32} className="h-8 w-8" unoptimized data-testid="favicon-preview" />
            ) : (
              <span className="text-sm text-muted-foreground" data-testid="favicon-placeholder">Default SVG favicon</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing('favicon')} data-testid="edit-favicon-button">
            <Pencil className="mr-2 h-4 w-4" />
            Change
          </Button>
        </div>
      </div>

      <ColorSchemeEditor
        open={editing === 'colorScheme'}
        onOpenChange={(open) => !open && setEditing(null)}
        currentTheme={theme}
      />
      <FontSelector
        open={editing === 'font'}
        onOpenChange={(open) => !open && setEditing(null)}
        currentTheme={theme}
      />
      <LogoUploader
        open={editing === 'logo'}
        onOpenChange={(open) => !open && setEditing(null)}
        currentLogoUrl={theme.logoUrl}
      />
      <FaviconUploader
        open={editing === 'favicon'}
        onOpenChange={(open) => !open && setEditing(null)}
        currentFaviconUrl={theme.faviconUrl}
      />
    </div>
  )
}
