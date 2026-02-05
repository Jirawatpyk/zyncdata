import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getSystemByName } from '@/lib/systems/queries'

export const metadata: Metadata = {
  title: 'Coming Soon - DxT AI Platform',
  description: 'This system is coming soon to the DxT AI Platform.',
}

export default async function ComingSoonPage(props: {
  searchParams: Promise<{ system?: string }>
}) {
  const searchParams = await props.searchParams
  const systemName = searchParams.system ?? 'This system'

  const system = searchParams.system
    ? await getSystemByName(searchParams.system)
    : null

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-dxt-primary/15 blur-3xl motion-safe:animate-float-a" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-dxt-secondary/15 blur-3xl motion-safe:animate-float-b" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dxt-primary/[0.07] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md motion-safe:animate-fade-up">
          {/* Glass card — gradient border wrapper (same as login) */}
          <div className="rounded-2xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10">
            <div className="rounded-2xl bg-white/95 p-8 backdrop-blur-sm">
              <div className="text-center">
                {/* System logo or fallback */}
                {system?.logoUrl ? (
                  <Image
                    src={system.logoUrl}
                    alt={`${systemName} logo`}
                    width={80}
                    height={80}
                    className="mx-auto h-20 w-20 rounded-2xl object-contain"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-dxt-primary/15 to-dxt-secondary/15 text-3xl font-bold text-dxt-primary"
                    aria-hidden="true"
                  >
                    {systemName.charAt(0)}
                  </div>
                )}

                {/* System name */}
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                  {systemName}
                </h1>

                {/* Coming Soon badge */}
                <div className="mx-auto mt-4 w-fit rounded-full border border-dxt-primary/30 bg-dxt-primary/10 px-4 py-1.5">
                  <span className="text-sm font-medium text-dxt-primary">
                    Coming Soon
                  </span>
                </div>

                {/* Description */}
                <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {system?.description ??
                    'We\u2019re working hard to bring this system online. Stay tuned for updates.'}
                </p>

                {/* Back to Home CTA */}
                <Link
                  href="/"
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-dxt-primary to-dxt-secondary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-dxt-primary/25 hover:shadow-xl hover:shadow-dxt-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-300 motion-safe:animate-glow-pulse"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
