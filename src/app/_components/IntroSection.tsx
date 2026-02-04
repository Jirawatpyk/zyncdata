interface IntroSectionProps {
  heading: string
  body: string
}

export default function IntroSection({ heading, body }: IntroSectionProps) {
  return (
    <section data-testid="intro-section" className="bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold text-gray-800">{heading}</h2>
        <p className="mt-4 text-lg leading-relaxed text-gray-600">{body}</p>
      </div>
    </section>
  )
}
