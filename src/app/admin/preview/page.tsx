import { Suspense } from 'react'
import PreviewManager from './_components/PreviewManager'
import PreviewSkeleton from './_components/PreviewSkeleton'

export const metadata = {
  title: 'Preview | Admin | zyncdata',
}

export default function PreviewPage() {
  return (
    <div className="p-6" data-testid="preview-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Preview</h1>
        <p className="text-sm text-muted-foreground">
          Preview your changes before publishing
        </p>
      </div>

      <Suspense fallback={<PreviewSkeleton />}>
        <PreviewManager />
      </Suspense>
    </div>
  )
}
