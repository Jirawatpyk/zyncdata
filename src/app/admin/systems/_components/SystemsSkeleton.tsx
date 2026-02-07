export default function SystemsSkeleton() {
  return (
    <div data-testid="systems-skeleton">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-11 w-28 animate-pulse rounded bg-muted" />
      </div>

      {/* System rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-1">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="size-11 animate-pulse rounded bg-muted" />
              <div className="size-11 animate-pulse rounded bg-muted" />
              <div className="h-11 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
