import type { Metadata } from 'next'
import { Suspense } from 'react'
import BrandingManager from './_components/BrandingManager'
import BrandingSkeleton from './_components/BrandingSkeleton'

export const metadata: Metadata = { title: 'Theme & Branding | Admin' }

export default function BrandingPage() {
  return (
    <Suspense fallback={<BrandingSkeleton />}>
      <BrandingManager />
    </Suspense>
  )
}
