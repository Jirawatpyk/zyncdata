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
  FONT_OPTIONS,
  FONT_FAMILY_MAP,
  type FontOption,
  type ThemeContent,
} from '@/lib/validations/content'
import { useUpdateSection } from '@/lib/admin/mutations/content'

interface FontSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTheme: ThemeContent
}

const FONT_LABELS: Record<FontOption, string> = {
  'nunito': 'Nunito',
  'inter': 'Inter',
  'open-sans': 'Open Sans',
}

export default function FontSelector({ open, onOpenChange, currentTheme }: FontSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <FontSelectorContent currentTheme={currentTheme} onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function FontSelectorContent({ currentTheme, onOpenChange }: { currentTheme: ThemeContent; onOpenChange: (open: boolean) => void }) {
  const [selected, setSelected] = useState<FontOption>(currentTheme.font)
  const updateSection = useUpdateSection()

  const isDirty = selected !== currentTheme.font

  async function handleSave() {
    await updateSection.mutateAsync({
      section: 'theme',
      content: { ...currentTheme, font: selected } as unknown as Record<string, unknown>,
    })
    onOpenChange(false)
  }

  return (
    <DialogContent className="max-w-md" data-testid="font-selector">
      <DialogHeader>
        <DialogTitle>Font Family</DialogTitle>
        <DialogDescription>Choose a font for your landing page.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {FONT_OPTIONS.map((font) => {
          const isActive = font === selected

          return (
            <button
              key={font}
              type="button"
              onClick={() => setSelected(font)}
              className={cn(
                'flex min-h-11 w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                isActive ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
              )}
              data-testid={`font-option-${font}`}
              aria-pressed={isActive}
            >
              <span className="text-sm font-medium">{FONT_LABELS[font]}</span>
              <span className="text-sm text-muted-foreground" style={{ fontFamily: FONT_FAMILY_MAP[font] }}>
                The quick brown fox jumps over the lazy dog
              </span>
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
          data-testid="save-font-button"
        >
          {updateSection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </DialogContent>
  )
}
