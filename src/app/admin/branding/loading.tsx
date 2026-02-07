import BrandingSkeleton from './_components/BrandingSkeleton'

export default function BrandingLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <BrandingSkeleton />
    </div>
  )
}
