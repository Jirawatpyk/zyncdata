import Link from 'next/link'

interface FooterLink {
  label: string
  url: string
}

interface FooterProps {
  copyright: string
  contactEmail: string
  links: FooterLink[]
}

export default function Footer({ copyright, contactEmail, links }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Brand mark */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-dxt-primary to-dxt-secondary text-xs font-bold text-white">
              Dx
            </span>
            <span className="text-sm font-semibold text-slate-300">DxT AI Platform</span>
          </div>

          {links.length > 0 && (
            <nav aria-label="Footer navigation" className="flex gap-6">
              {links.map((link) =>
                link.url.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.url}
                    className="text-sm text-slate-400 hover:text-white motion-safe:transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-white motion-safe:transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>
          )}
          <p className="text-sm text-slate-400">
            Contact:{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="text-dxt-accent hover:text-white motion-safe:transition-colors"
            >
              {contactEmail}
            </a>
          </p>
          <p className="text-xs text-slate-500">&copy; {copyright}</p>
        </div>
      </div>
    </footer>
  )
}
