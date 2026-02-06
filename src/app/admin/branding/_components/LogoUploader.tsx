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
import { toast } from 'sonner'
import { useUploadLogo, useDeleteLogo } from '@/lib/admin/mutations/branding'

interface LogoUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLogoUrl: string | null
}

const ACCEPTED_TYPES = 'image/png,image/svg+xml,image/webp'
const MAX_SIZE = 512 * 1024 // 512 KB

export default function LogoUploader({ open, onOpenChange, currentLogoUrl }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadLogo = useUploadLogo()
  const deleteLogo = useDeleteLogo()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE) {
      toast.error('File must be less than 512 KB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      await uploadLogo.mutateAsync(formData)
      onOpenChange(false)
    } catch {
      // Error already handled by mutation's onError callback
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    try {
      await deleteLogo.mutateAsync()
      onOpenChange(false)
    } catch {
      // Error already handled by mutation's onError callback
    }
  }

  const isPending = uploadLogo.isPending || deleteLogo.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="logo-uploader">
        <DialogHeader>
          <DialogTitle>Platform Logo</DialogTitle>
          <DialogDescription>Upload a logo image (PNG, SVG, or WebP, max 512 KB).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current preview */}
          <div className="rounded-lg border border-border p-4 text-center">
            {currentLogoUrl ? (
              <Image src={currentLogoUrl} alt="Current logo" width={160} height={48} className="mx-auto h-12 w-auto" unoptimized data-testid="current-logo-preview" />
            ) : (
              <span className="text-sm text-muted-foreground">No logo uploaded — using text-based &quot;DxT&quot; mark</span>
            )}
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
            data-testid="logo-file-input"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex-1"
              data-testid="upload-logo-button"
            >
              {uploadLogo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Logo
            </Button>

            {currentLogoUrl && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                data-testid="delete-logo-button"
              >
                {deleteLogo.isPending ? (
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
