import PreviewSkeleton from './_components/PreviewSkeleton'

export default function PreviewLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <PreviewSkeleton />
    </div>
  )
}
