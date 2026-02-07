import type { Metadata } from 'next'
import { Suspense } from 'react'
import BrandingManager from './_components/BrandingManager'
import BrandingSkeleton from './_components/BrandingSkeleton'

export const metadata: Metadata = { title: 'Theme & Branding | Admin' }

export default function BrandingPage() {
  return (
    <div className="p-6" data-testid="branding-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Theme & Branding</h1>
        <p className="text-sm text-muted-foreground">
          Customize colors, fonts, logo and favicon
        </p>
      </div>

      <Suspense fallback={<BrandingSkeleton />}>
        <BrandingManager />
      </Suspense>
    </div>
  )
}
