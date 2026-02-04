interface HeroProps {
  title: string
  subtitle: string
  description: string
}

export default function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 md:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-dxt-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-dxt-secondary/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dxt-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-sky-300 md:text-3xl">
          {subtitle}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          {description}
        </p>
      </div>
    </section>
  )
}
