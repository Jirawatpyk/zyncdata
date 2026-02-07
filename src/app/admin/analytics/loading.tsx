import AnalyticsSkeleton from './_components/AnalyticsSkeleton'

export default function AnalyticsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <AnalyticsSkeleton />
    </div>
  )
}
