import { FileText } from 'lucide-react'
import EmptyState from '@/components/patterns/EmptyState'

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

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Content Management Coming Soon"
          description="This feature will be available in Epic 4."
        />
      </div>
    </div>
  )
}
