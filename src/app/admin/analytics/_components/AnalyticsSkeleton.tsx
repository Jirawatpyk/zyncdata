export default function AnalyticsSkeleton() {
  return (
    <div data-testid="analytics-skeleton" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between pb-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-[300px] animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
