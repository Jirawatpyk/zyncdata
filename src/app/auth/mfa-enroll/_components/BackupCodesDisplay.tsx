'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// Duplicated from src/lib/auth/backup-codes.ts (server-only module — cannot import here).
// Keep in sync if format changes.
function formatBackupCodeForDisplay(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

type BackupCodesDisplayProps = {
  codes: string[]
  onContinue: () => void
}

export default function BackupCodesDisplay({ codes, onContinue }: BackupCodesDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const formattedCodes = codes.map(formatBackupCodeForDisplay)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formattedCodes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may fail in some environments
    }
  }

  function handleDownload() {
    const date = new Date().toISOString().split('T')[0]
    const content = [
      'zyncdata Backup Codes',
      `Generated: ${date}`,
      '',
      ...formattedCodes,
      '',
      'Each code can only be used once.',
      'Store these codes in a safe place.',
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zyncdata-backup-codes-${date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10">
      <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            data-testid="backup-codes-title"
          >
            Save Your Backup Codes
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="backup-codes-description">
            These codes can be used to access your account if you lose your authenticator app. Each
            code can only be used once.
          </p>
        </div>

        {/* Codes Grid */}
        <div
          role="list"
          data-testid="backup-codes-list"
          className="grid grid-cols-2 gap-2"
        >
          {formattedCodes.map((code, index) => (
            <div
              key={index}
              role="listitem"
              data-testid={`backup-code-${index}`}
              className="rounded-md bg-muted px-3 py-2 text-center font-mono text-sm tracking-widest"
            >
              {code}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            aria-label="Copy all backup codes"
            data-testid="backup-codes-copy"
            className={cn(
              'flex-1',
              'focus-visible:ring-2 focus-visible:ring-dxt-primary',
            )}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" aria-hidden="true" />
                <span aria-live="polite">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="mr-2" aria-hidden="true" />
                <span aria-live="polite">Copy All</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            aria-label="Download backup codes"
            data-testid="backup-codes-download"
            className={cn(
              'flex-1',
              'focus-visible:ring-2 focus-visible:ring-dxt-primary',
            )}
          >
            <Download size={16} className="mr-2" aria-hidden="true" />
            Download
          </Button>
        </div>

        {/* Acknowledgment */}
        <label
          className="flex items-center gap-3 cursor-pointer"
          data-testid="backup-codes-acknowledge-label"
        >
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            data-testid="backup-codes-acknowledge"
            className={cn(
              'h-4 w-4 rounded border-gray-300',
              'focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2',
            )}
          />
          <span className="text-sm text-muted-foreground">
            I have saved my backup codes in a safe place
          </span>
        </label>

        {/* Continue */}
        <Button
          type="button"
          disabled={!acknowledged}
          onClick={onContinue}
          aria-label="Continue to Dashboard"
          data-testid="backup-codes-continue"
          className={cn(
            'w-full bg-dxt-primary text-white hover:bg-dxt-primary/90',
            'focus-visible:ring-2 focus-visible:ring-dxt-primary',
          )}
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  )
}
