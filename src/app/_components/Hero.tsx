interface HeroProps {
  title: string
  subtitle: string
  description: string
}

export default function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 md:text-5xl">{title}</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-700 md:text-4xl">{subtitle}</h2>
        <p className="mt-6 text-lg text-gray-600">{description}</p>
      </div>
    </section>
  )
}
