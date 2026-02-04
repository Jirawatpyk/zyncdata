import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layouts/Header'

export const metadata: Metadata = {
  title: 'Coming Soon - DxT AI Platform',
  description: 'This system is coming soon to the DxT AI Platform.',
}

export default async function ComingSoonPage(props: {
  searchParams: Promise<{ system?: string }>
}) {
  const searchParams = await props.searchParams
  const systemName = searchParams.system ?? 'This system'

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
            {systemName}
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Coming Soon
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            We&apos;re working hard to bring this system online. Stay tuned for updates.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-dxt-primary to-dxt-secondary px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-dxt-primary/25 hover:shadow-md hover:shadow-dxt-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2 motion-safe:transition-all motion-safe:duration-150"
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
      </main>
    </>
  )
}
