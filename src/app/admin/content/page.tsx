import { Suspense } from 'react'
import ContentManager from './_components/ContentManager'
import ContentSkeleton from './_components/ContentSkeleton'

export const metadata = {
  title: 'Content | Admin | zyncdata',
}

export default function ContentPage() {
  return (
    <div className="p-6" data-testid="content-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Content</h1>
        <p className="text-sm text-muted-foreground">
          Manage your website content
        </p>
      </div>

      <Suspense fallback={<ContentSkeleton />}>
        <ContentManager />
      </Suspense>
    </div>
  )
}
