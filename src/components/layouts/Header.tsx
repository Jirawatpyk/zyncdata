import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm font-bold text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary"
          aria-label="DxT AI Platform - Home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-dxt-primary to-dxt-secondary text-sm font-bold text-white">
            Dx
          </span>
          <span className="text-lg">DxT AI Platform</span>
        </Link>
        <nav>
          <Link
            href="/login"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-dxt-primary/30 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary motion-safe:transition-colors motion-safe:duration-150"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
