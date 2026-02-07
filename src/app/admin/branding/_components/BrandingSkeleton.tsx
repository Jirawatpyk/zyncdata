export default function BrandingSkeleton() {
  return (
    <div data-testid="branding-skeleton">
      {/* Button bar */}
      <div className="mb-4 flex justify-end gap-2">
        <div className="h-11 w-24 animate-pulse rounded bg-muted" />
        <div className="h-11 w-24 animate-pulse rounded bg-muted" />
      </div>

      {/* 2×2 card grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="mb-4 h-16 animate-pulse rounded bg-muted" />
            <div className="h-11 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
