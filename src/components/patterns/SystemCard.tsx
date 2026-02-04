import { cn } from '@/lib/utils'

interface SystemCardProps {
  name: string
  url: string
  logoUrl: string | null
  description: string | null
}

export default function SystemCard({ name, url, logoUrl, description }: SystemCardProps) {
  return (
    <a
      className={cn(
        'group relative block overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-sm',
        'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
        'motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-xl motion-safe:hover:shadow-dxt-primary/10 motion-safe:hover:border-dxt-primary/30',
        'focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:outline-none',
      )}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${name}${description ? ` - ${description}` : ''}`}
    >
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dxt-primary via-dxt-accent to-dxt-secondary opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:group-hover:opacity-100" />

      <div className="flex items-start gap-4">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- next/image requires remotePatterns config (Story 3.7) */
          <img
            src={logoUrl}
            alt={`${name} logo`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl"
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-dxt-primary/15 to-dxt-secondary/15 text-2xl font-bold text-dxt-primary"
            aria-hidden="true"
          >
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-xl font-semibold text-gray-800">{name}</h4>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
        {/* Arrow indicator */}
        <svg
          className="mt-1 h-5 w-5 shrink-0 text-gray-300 motion-safe:transition-all motion-safe:duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-hover:text-dxt-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
        </svg>
      </div>
    </a>
  )
}
