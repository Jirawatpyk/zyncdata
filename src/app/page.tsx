import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getEnabledSystems } from '@/lib/systems/queries'
import { getLandingPageContent } from '@/lib/content/queries'
import Header from '@/components/layouts/Header'
import Footer from '@/components/layouts/Footer'
import Hero from '@/app/_components/Hero'
import IntroSection from '@/app/_components/IntroSection'
import SystemCard from '@/components/patterns/SystemCard'
import GridSkeleton from '@/app/_components/GridSkeleton'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'DxT AI Platform - Enterprise Access Management',
  description:
    'Your centralized hub for accessing and monitoring all DxT AI systems.',
  openGraph: {
    title: 'DxT AI Platform - Enterprise Access Management',
    description:
      'Your centralized hub for accessing and monitoring all DxT AI systems.',
    type: 'website',
  },
}

async function SystemGrid() {
  const systems = await getEnabledSystems()

  if (systems.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-gray-600">
        No systems available
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {systems.map((system) => (
        <SystemCard
          key={system.id}
          name={system.name}
          url={system.url}
          logoUrl={system.logoUrl}
          description={system.description}
        />
      ))}
    </div>
  )
}

export default async function Home() {
  const content = await getLandingPageContent()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-4 focus:text-dxt-primary"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Hero
          title={content.hero.title}
          subtitle={content.hero.subtitle}
          description={content.hero.description}
        />
        <IntroSection
          heading={content.intro.heading}
          body={content.intro.body}
        />
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="mb-8 text-center text-4xl font-bold text-gray-800">
              Our Systems
            </h2>
            <Suspense fallback={<GridSkeleton />}>
              <SystemGrid />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer
        copyright={content.footer.copyright}
        contactEmail={content.footer.contactEmail}
        links={content.footer.links}
      />
    </>
  )
}
