import { Building2, Lightbulb, Brain, Gamepad2, ExternalLink, type LucideIcon } from 'lucide-react'
import FadeInOnScroll from '@/components/animations/FadeInOnScroll'
import type { PillarItem } from '@/lib/validations/content'

interface PillarsSectionProps {
  heading: string
  items: PillarItem[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  lightbulb: Lightbulb,
  brain: Brain,
  gamepad: Gamepad2,
}

function PillarCard({ title, description, url, icon }: PillarItem) {
  const IconComponent = (icon && ICON_MAP[icon]) || Building2

  return (
    <div className="rounded-xl border-l-2 border-dxt-primary p-6 transition-colors duration-200 hover:bg-slate-100">
      <IconComponent size={24} className="text-dxt-primary" aria-hidden="true" />
      <h3 className="mt-3 text-lg font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1 font-medium text-dxt-primary hover:underline"
        >
          Visit
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : (
        <span className="mt-4 inline-block text-xs text-gray-400">Coming Soon</span>
      )}
    </div>
  )
}

export default function PillarsSection({ heading, items }: PillarsSectionProps) {
  if (items.length === 0) return null

  return (
    <section data-testid="pillars-section" className="bg-slate-50 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <FadeInOnScroll>
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-dxt-primary via-dxt-accent to-dxt-secondary" />
            <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">{heading}</h2>
          </div>
        </FadeInOnScroll>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <FadeInOnScroll key={item.title} delay={index * 100}>
              <PillarCard {...item} />
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
