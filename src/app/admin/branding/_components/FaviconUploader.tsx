'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, Trash2 } from 'lucide-react'
import { useUploadFavicon, useDeleteFavicon } from '@/lib/admin/mutations/branding'

interface FaviconUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFaviconUrl: string | null
}

const ACCEPTED_TYPES = 'image/png,image/svg+xml,image/x-icon'
const MAX_SIZE = 64 * 1024 // 64 KB

export default function FaviconUploader({ open, onOpenChange, currentFaviconUrl }: FaviconUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFavicon = useUploadFavicon()
  const deleteFavicon = useDeleteFavicon()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE) {
      return // Zod validation on the API will catch this too
    }

    const formData = new FormData()
    formData.append('file', file)

    await uploadFavicon.mutateAsync(formData)
    onOpenChange(false)
  }

  async function handleDelete() {
    await deleteFavicon.mutateAsync()
    onOpenChange(false)
  }

  const isPending = uploadFavicon.isPending || deleteFavicon.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="favicon-uploader">
        <DialogHeader>
          <DialogTitle>Favicon</DialogTitle>
          <DialogDescription>Upload a favicon (PNG, SVG, or ICO, max 64 KB).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current preview */}
          <div className="rounded-lg border border-border p-4 text-center">
            {currentFaviconUrl ? (
              <Image src={currentFaviconUrl} alt="Current favicon" width={32} height={32} className="mx-auto h-8 w-8" unoptimized data-testid="current-favicon-preview" />
            ) : (
              <span className="text-sm text-muted-foreground">Default SVG favicon</span>
            )}
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
            data-testid="favicon-file-input"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex-1"
              data-testid="upload-favicon-button"
            >
              {uploadFavicon.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Favicon
            </Button>

            {currentFaviconUrl && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                data-testid="delete-favicon-button"
              >
                {deleteFavicon.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
