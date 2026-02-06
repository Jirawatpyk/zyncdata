import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getEnabledSystemsByCategory } from '@/lib/systems/queries'
import { getLandingPageContent } from '@/lib/content/queries'
import { SYSTEM_CATEGORIES, CATEGORY_LABELS } from '@/lib/validations/system'
import Footer from '@/components/layouts/Footer'
import Hero from '@/app/_components/Hero'
import PillarsSection from '@/app/_components/PillarsSection'
import CategoryTabs from '@/app/_components/CategoryTabs'
import SystemCard from '@/components/patterns/SystemCard'
import GridSkeleton from '@/app/_components/GridSkeleton'
import FadeInOnScroll from '@/components/animations/FadeInOnScroll'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'DxT Smart Platform & Solutions',
  description:
    'One portal to access and monitor all DxT systems. Complete visibility.',
  openGraph: {
    title: 'DxT Smart Platform & Solutions',
    description:
      'One portal to access and monitor all DxT systems. Complete visibility.',
    type: 'website',
  },
}

async function SystemsByCategory() {
  const grouped = await getEnabledSystemsByCategory()

  // Build visible tabs in order: defined categories + 'other' if exists
  const tabOrder = [...SYSTEM_CATEGORIES, 'other'] as const
  const visibleTabs = tabOrder
    .filter((key) => grouped[key] && grouped[key].length > 0)
    .map((key) => ({
      key,
      label: key === 'other' ? 'Other' : CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
    }))

  if (visibleTabs.length === 0) {
    return (
      <p className="py-12 text-center text-lg text-gray-600">
        No systems available
      </p>
    )
  }

  // Build children record — Server Component content for each tab
  const tabContent: Record<string, React.ReactNode> = {}
  for (const tab of visibleTabs) {
    const systems = grouped[tab.key] ?? []
    tabContent[tab.key] = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system, index) => (
          <FadeInOnScroll key={system.id} delay={index * 100}>
            <SystemCard
              name={system.name}
              url={system.url}
              logoUrl={system.logoUrl}
              description={system.description}
              status={system.status}
              lastCheckedAt={system.lastCheckedAt}
            />
          </FadeInOnScroll>
        ))}
      </div>
    )
  }

  return (
    <CategoryTabs tabs={visibleTabs}>
      {tabContent}
    </CategoryTabs>
  )
}

export default async function Home() {
  const content = await getLandingPageContent()

  return (
    <>
      <main id="main-content">
        <Hero
          title={content.hero.title}
          subtitle={content.hero.subtitle}
          description={content.hero.description}
        />
        <PillarsSection
          heading={content.pillars.heading}
          items={content.pillars.items}
        />
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <FadeInOnScroll>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">
                  {content.systems.heading}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
                  {content.systems.subtitle}
                </p>
              </div>
            </FadeInOnScroll>
            <Suspense fallback={<GridSkeleton />}>
              <SystemsByCategory />
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
