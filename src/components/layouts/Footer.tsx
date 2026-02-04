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
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {links.length > 0 && (
            <nav aria-label="Footer navigation" className="flex gap-4">
              {links.map((link) =>
                link.url.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.url}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>
          )}
          <p className="text-sm text-gray-600">
            Contact:{' '}
            <a href={`mailto:${contactEmail}`} className="hover:text-gray-800">
              {contactEmail}
            </a>
          </p>
          <p className="text-sm text-gray-600">&copy; {copyright}</p>
        </div>
      </div>
    </footer>
  )
}
