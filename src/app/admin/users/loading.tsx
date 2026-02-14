import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
  return (
    <div className="p-6" data-testid="users-loading">
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="p-4">
          {/* Table header skeleton */}
          <div className="mb-4 flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
          </div>
          {/* Table rows skeleton */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="mb-3 flex gap-4">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/6" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
