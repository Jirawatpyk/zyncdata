export default function BrandingSkeleton() {
  return (
    <div className="space-y-6" data-testid="branding-skeleton">
      <div className="h-8 w-48 animate-shimmer rounded" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border p-6">
            <div className="mb-4 h-5 w-32 animate-shimmer rounded" />
            <div className="h-20 animate-shimmer rounded" />
            <div className="mt-4 h-10 w-24 animate-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
