export default function PreviewSkeleton() {
  return (
    <div data-testid="preview-skeleton">
      {/* Back button */}
      <div className="mb-4">
        <div className="h-11 w-36 animate-pulse rounded bg-muted" />
      </div>

      {/* Preview iframe area */}
      <div className="h-[60vh] animate-pulse rounded-lg border border-border bg-muted" />
    </div>
  )
}
