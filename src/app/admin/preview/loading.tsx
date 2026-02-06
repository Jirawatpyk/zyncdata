export default function PreviewLoadingSkeleton() {
  return (
    <div className="space-y-4" data-testid="preview-loading-skeleton">
      <div className="h-11 w-36 animate-pulse rounded bg-slate-200" />
      <div className="animate-pulse rounded-lg border border-border p-4">
        <div className="mb-3 h-10 w-full rounded bg-slate-200" />
        <div className="h-10 w-48 rounded bg-slate-100" />
      </div>
      <div className="h-[60vh] animate-pulse rounded-lg border border-border bg-slate-100" />
    </div>
  )
}
