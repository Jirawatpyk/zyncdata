import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="rounded-sm text-lg font-bold text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary"
          aria-label="DxT AI Platform - Home"
        >
          DxT AI Platform
        </Link>
        <nav>
          <Link
            href="/login"
            className="rounded-sm text-sm font-medium text-gray-600 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
