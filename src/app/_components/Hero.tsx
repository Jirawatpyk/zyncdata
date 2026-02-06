import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HeroProps {
  title: string
  subtitle: string
  description: string
}

export default function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <section className="relative overflow-x-clip bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 pb-24 md:pt-24 md:pb-36">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-x-clip" aria-hidden="true">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-dxt-primary/20 blur-3xl motion-safe:animate-float-a" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-dxt-secondary/20 blur-3xl motion-safe:animate-float-b" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h1 className="font-bold tracking-tight text-white motion-safe:animate-fade-up">
          {title.startsWith('DxT') ? (
            <>
              <span className="block text-5xl md:text-7xl">
                <span>D</span>
                <span className="text-dxt-primary">x</span>
                <span>T</span>
              </span>
              <span className="mt-1 block text-2xl md:text-4xl">
                {title.slice(3).trim()}
              </span>
            </>
          ) : (
            <span className="text-4xl md:text-6xl">{title}</span>
          )}
        </h1>
        <p className="mt-6 bg-gradient-to-r from-dxt-accent to-dxt-primary bg-clip-text text-2xl font-semibold text-transparent motion-safe:animate-fade-up-delay-1 md:text-3xl">
          {subtitle}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 motion-safe:animate-fade-up-delay-2">
          {description}
        </p>
        <div className="mt-10 motion-safe:animate-fade-up-delay-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-dxt-primary to-dxt-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-dxt-primary/25 hover:shadow-xl hover:shadow-dxt-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 motion-safe:transition-all motion-safe:duration-200"
          >
            Get Started
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Bottom gradient fade for smooth section transition */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
    </section>
  )
}
