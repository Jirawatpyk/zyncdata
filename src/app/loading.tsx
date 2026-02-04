import GridSkeleton from '@/app/_components/GridSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-14 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-12 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-6 w-96 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Intro skeleton */}
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-10 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-20 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-8 h-10 w-48 animate-pulse rounded bg-gray-200" />
          <GridSkeleton />
        </div>
      </div>
    </div>
  )
}
