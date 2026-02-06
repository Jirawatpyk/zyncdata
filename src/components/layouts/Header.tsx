import Link from 'next/link'
import Image from 'next/image'
import AuthButton from './AuthButton'

interface HeaderProps {
  logoUrl?: string | null
}

export default function Header({ logoUrl }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary"
          aria-label="DxT Smart Platform & Solutions - Home"
        >
          {logoUrl ? (
            <Image src={logoUrl} alt="DxT Smart Platform & Solutions" width={160} height={40} className="h-10 w-auto" />
          ) : (
            <span className="text-lg tracking-tight">
              <span className="font-bold text-gray-800">D</span>
              <span className="font-bold text-dxt-primary">x</span>
              <span className="font-bold text-gray-800">T</span>
              <span className="font-medium text-gray-600"> Smart Platform &amp; Solutions</span>
            </span>
          )}
        </Link>
        <nav aria-label="Main">
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}
