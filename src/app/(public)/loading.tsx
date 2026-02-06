import GridSkeleton from '@/app/_components/GridSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton — matches Hero.tsx */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 md:py-36">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-center">
          <div className="mx-auto h-12 w-80 animate-pulse rounded bg-slate-700" />
          <div className="mx-auto h-8 w-64 animate-pulse rounded bg-slate-700" />
          <div className="mx-auto h-6 w-96 max-w-full animate-pulse rounded bg-slate-700" />
          <div className="pt-6">
            <div className="mx-auto h-12 w-36 animate-pulse rounded-xl bg-slate-700" />
          </div>
        </div>
      </section>

      {/* Pillars skeleton — matches PillarsSection.tsx */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 h-1.5 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="mx-auto h-10 w-48 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border-l-2 border-gray-200 p-6">
                <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-12 w-full animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-5 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cards grid skeleton — matches page systems section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 space-y-3 text-center">
            <div className="mx-auto h-10 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto h-5 w-72 animate-pulse rounded bg-gray-200" />
          </div>
          <GridSkeleton />
        </div>
      </section>
    </div>
  )
}
