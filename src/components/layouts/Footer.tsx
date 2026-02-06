import Link from 'next/link'

interface FooterLink {
  label: string
  url: string
}

interface FooterProps {
  copyright: string
  contactEmail?: string
  links: FooterLink[]
}

export default function Footer({ copyright, contactEmail, links }: FooterProps) {
  return (
    <footer className="bg-slate-900">
      {/* Gradient accent line replacing hard border */}
      <div className="h-px bg-gradient-to-r from-transparent via-dxt-primary/30 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Brand mark */}
          <span className="text-sm tracking-tight">
            <span className="font-bold text-slate-200">D</span>
            <span className="font-bold text-dxt-primary">x</span>
            <span className="font-bold text-slate-200">T</span>
            <span className="font-medium text-slate-400"> Smart Platform &amp; Solutions</span>
          </span>

          {links.length > 0 && (
            <nav aria-label="Footer navigation" className="flex gap-6">
              {links.map((link) =>
                link.url.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.url}
                    className="rounded-sm text-sm text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary motion-safe:transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-sm text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary motion-safe:transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>
          )}
          {contactEmail && (
            <p className="text-sm text-slate-400">
              Contact:{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="rounded-sm text-dxt-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary motion-safe:transition-colors"
              >
                {contactEmail}
              </a>
            </p>
          )}
          <p className="text-xs text-slate-400">&copy; {copyright}</p>
        </div>
      </div>
    </footer>
  )
}
