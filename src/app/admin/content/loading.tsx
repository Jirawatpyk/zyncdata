export default function ContentLoadingSkeleton() {
  return (
    <div className="space-y-4" data-testid="content-loading">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border p-6"
        >
          <div className="mb-3 h-5 w-24 rounded bg-slate-200" />
          <div className="mb-4 h-4 w-full rounded bg-slate-100" />
          <div className="h-9 w-16 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
