'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from '@/lib/validations/system'

interface LogoUploadProps {
  currentLogoUrl: string | null
  pendingPreview: string | null
  systemName: string
  isUploading: boolean
  onFileSelect: (file: File) => void
  onRemove: () => void
  error?: string | null
}

export default function LogoUpload({
  currentLogoUrl,
  pendingPreview,
  systemName,
  isUploading,
  onFileSelect,
  onRemove,
  error,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    // Client-side validation
    if (!(ALLOWED_LOGO_TYPES as readonly string[]).includes(file.type)) {
      setValidationError('File must be JPEG, PNG, SVG, or WebP')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      setValidationError(`File must be less than 512KB (current: ${Math.round(file.size / 1024)}KB)`)
      return
    }

    // Pass file to parent — parent creates preview + stores file for deferred upload
    onFileSelect(file)
  }

  const handleRemove = () => {
    setValidationError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove()
  }

  const displayUrl = pendingPreview ?? currentLogoUrl
  const displayError = validationError ?? error

  return (
    <div className="space-y-2">
      <Label>Logo</Label>
      <div className="flex items-center gap-4">
        {/* Logo preview */}
        <div
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted',
            isUploading && 'opacity-50',
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- preview uses local blob URL */
            <img
              src={displayUrl}
              alt={`${systemName} logo`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-2xl font-bold text-muted-foreground" aria-hidden="true">
              {systemName.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Upload / Remove buttons */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="upload-logo-button"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {currentLogoUrl || pendingPreview ? 'Replace' : 'Upload'}
            </Button>
            {(currentLogoUrl || pendingPreview) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                data-testid="remove-logo-button"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            JPEG, PNG, SVG, or WebP. Max 512KB.
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="logo-file-input"
        />
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-[0.8rem] font-medium text-destructive" role="alert" data-testid="logo-error">
          {displayError}
        </p>
      )}
    </div>
  )
}
