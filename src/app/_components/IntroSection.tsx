import FadeInOnScroll from '@/components/animations/FadeInOnScroll'

interface IntroSectionProps {
  heading: string
  body: string
}

export default function IntroSection({ heading, body }: IntroSectionProps) {
  return (
    <section data-testid="intro-section" className="relative overflow-x-clip bg-slate-50 py-16 md:py-20">
      {/* Subtle decorative orb */}
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-dxt-primary/[0.04] blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <FadeInOnScroll>
          <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-dxt-primary via-dxt-accent to-dxt-secondary" />
          <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">{heading}</h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={150}>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">{body}</p>
        </FadeInOnScroll>
      </div>
      {/* Bottom gradient fade to white (systems section) */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
    </section>
  )
}
