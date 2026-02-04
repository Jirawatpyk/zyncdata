interface IntroSectionProps {
  heading: string
  body: string
}

export default function IntroSection({ heading, body }: IntroSectionProps) {
  return (
    <section data-testid="intro-section" className="bg-slate-50 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-dxt-primary to-dxt-accent" />
        <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">{heading}</h2>
        <p className="mt-6 text-lg leading-relaxed text-gray-600">{body}</p>
      </div>
    </section>
  )
}
