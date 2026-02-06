'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreviewData } from '@/lib/admin/queries/preview'
import PreviewFrame from './PreviewFrame'

export default function PreviewManager() {
  const router = useRouter()
  const previewData = usePreviewData()
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(previewData),
        })

        const body = await res.json()
        if (cancelled) return

        if (!res.ok || body.error) {
          setError('Failed to load preview')
          return
        }

        setPreviewHtml(body.data)
      } catch {
        if (!cancelled) {
          setError('Failed to load preview')
        }
      }
    }

    loadPreview()

    return () => {
      cancelled = true
    }
  }, [previewData])

  return (
    <div data-testid="preview-manager">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          className="min-h-11 gap-2"
          onClick={() => router.push('/admin/content')}
          aria-label="Back to Editor"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Editor
        </Button>
      </div>

      {/* Preview content */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-destructive" data-testid="preview-error">
          {error}
        </div>
      )}

      {!error && !previewHtml && (
        <div className="flex items-center justify-center py-20 text-muted-foreground" data-testid="preview-loading">
          Loading preview...
        </div>
      )}

      {!error && previewHtml && (
        <PreviewFrame previewHtml={previewHtml} />
      )}
    </div>
  )
}
