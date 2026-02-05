'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Monitor, FileText, BarChart3, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Systems', href: '/admin/systems', icon: Monitor },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        data-testid="admin-sidebar"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end border-b border-border p-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation"
            className="min-h-11 min-w-11"
            data-testid="sidebar-close-button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <nav
          className="flex flex-col gap-1 p-4"
          role="navigation"
          aria-label="Admin navigation"
        >
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
