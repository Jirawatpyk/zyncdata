'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COLOR_SCHEMES,
  COLOR_SCHEME_PALETTES,
  type ColorScheme,
  type ThemeContent,
} from '@/lib/validations/content'
import { useUpdateSection } from '@/lib/admin/mutations/content'

interface ColorSchemeEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTheme: ThemeContent
}

const SCHEME_LABELS: Record<ColorScheme, string> = {
  'dxt-default': 'DxT Default',
  'ocean-blue': 'Ocean Blue',
  'midnight-purple': 'Midnight Purple',
}

export default function ColorSchemeEditor({ open, onOpenChange, currentTheme }: ColorSchemeEditorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ColorSchemeEditorContent currentTheme={currentTheme} onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function ColorSchemeEditorContent({ currentTheme, onOpenChange }: { currentTheme: ThemeContent; onOpenChange: (open: boolean) => void }) {
  const [selected, setSelected] = useState<ColorScheme>(currentTheme.colorScheme)
  const updateSection = useUpdateSection()

  const isDirty = selected !== currentTheme.colorScheme

  async function handleSave() {
    try {
      await updateSection.mutateAsync({
        section: 'theme',
        content: { ...currentTheme, colorScheme: selected } as unknown as Record<string, unknown>,
      })
      onOpenChange(false)
    } catch {
      // Error already handled by mutation's onError callback
    }
  }

  return (
      <DialogContent className="max-w-md" data-testid="color-scheme-editor">
        <DialogHeader>
          <DialogTitle>Color Scheme</DialogTitle>
          <DialogDescription>Choose a predefined color palette for your landing page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {COLOR_SCHEMES.map((scheme) => {
            const palette = COLOR_SCHEME_PALETTES[scheme]
            const isActive = scheme === selected

            return (
              <button
                key={scheme}
                type="button"
                onClick={() => setSelected(scheme)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  isActive ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
                )}
                data-testid={`scheme-option-${scheme}`}
                aria-pressed={isActive}
              >
                <div className="flex gap-1.5">
                  <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: palette.primary }} />
                  <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: palette.secondary }} />
                  <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: palette.accent }} />
                </div>
                <span className="text-sm font-medium">{SCHEME_LABELS[scheme]}</span>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateSection.isPending}
            data-testid="save-color-scheme-button"
          >
            {updateSection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
  )
}
