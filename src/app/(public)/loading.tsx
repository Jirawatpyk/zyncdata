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

      {/* Intro skeleton — matches IntroSection.tsx */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-center">
          <div className="mx-auto h-1.5 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto h-10 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto mt-2 h-20 w-full animate-pulse rounded bg-gray-200" />
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
