export default function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
