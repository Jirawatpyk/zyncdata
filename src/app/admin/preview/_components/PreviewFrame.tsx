'use client'

import { useState } from 'react'
import { Smartphone, Tablet, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DeviceSize = 'mobile' | 'tablet' | 'desktop'

const DEVICE_WIDTHS: Record<DeviceSize, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
}

const DEVICE_OPTIONS: { key: DeviceSize; label: string; icon: typeof Smartphone }[] = [
  { key: 'mobile', label: 'Mobile', icon: Smartphone },
  { key: 'tablet', label: 'Tablet', icon: Tablet },
  { key: 'desktop', label: 'Desktop', icon: Monitor },
]

interface PreviewFrameProps {
  previewHtml: string
}

export default function PreviewFrame({ previewHtml }: PreviewFrameProps) {
  const [device, setDevice] = useState<DeviceSize>('desktop')

  return (
    <div data-testid="preview-frame">
      {/* Preview banner */}
      <div
        className="rounded-t-lg bg-amber-500 py-2 text-center text-sm font-bold text-black"
        data-testid="preview-banner"
      >
        PREVIEW - Not Published
      </div>

      {/* Device toolbar */}
      <div
        className="flex items-center justify-center gap-2 border-x border-border bg-muted/50 px-4 py-3"
        role="toolbar"
        aria-label="Device preview sizes"
      >
        {DEVICE_OPTIONS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={device === key ? 'default' : 'outline'}
            size="sm"
            className="min-h-11 gap-2"
            onClick={() => setDevice(key)}
            aria-label={label}
            data-active={device === key}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      {/* iframe container */}
      <div className={cn('overflow-x-auto border-x border-b border-border bg-gray-100 p-4')} role="region" aria-label="Preview content">
        <iframe
          title="Preview"
          srcDoc={previewHtml}
          sandbox="allow-same-origin allow-scripts"
          className="mx-auto block rounded border border-border bg-white"
          style={{ width: `${DEVICE_WIDTHS[device]}px`, height: '80vh' }}
        />
      </div>
    </div>
  )
}
