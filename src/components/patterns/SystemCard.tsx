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
        'block rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        'motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out',
        'motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-md',
        'focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:outline-none',
      )}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${name}${description ? ` - ${description}` : ''}`}
    >
      <div className="flex items-start gap-4">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- next/image requires remotePatterns config (Story 3.7) */
          <img
            src={logoUrl}
            alt={`${name} logo`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-lg bg-dxt-primary/10 text-2xl font-bold text-dxt-primary"
            aria-hidden="true"
          >
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-xl font-semibold text-gray-800">{name}</h4>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </a>
  )
}
