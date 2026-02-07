export default function ContentSkeleton() {
  return (
    <div data-testid="content-skeleton">
      {/* Button bar */}
      <div className="mb-4 flex justify-end gap-2">
        <div className="h-11 w-24 animate-pulse rounded bg-muted" />
        <div className="h-11 w-24 animate-pulse rounded bg-muted" />
      </div>

      {/* 3 section cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-2 h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="mb-4 h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-11 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
