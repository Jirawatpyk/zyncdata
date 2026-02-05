'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LogoutButton from '@/components/patterns/LogoutButton'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/auth/guard'

const roleDisplayNames: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

const roleBadgeColors: Record<Role, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-700',
}

interface AdminHeaderProps {
  userName: string
  userRole: Role
  onMenuClick: () => void
  isSidebarOpen: boolean
}

export default function AdminHeader({
  userName,
  userRole,
  onMenuClick,
  isSidebarOpen,
}: AdminHeaderProps) {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4"
      data-testid="admin-header"
    >
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        data-testid="skip-link"
      >
        Skip to main content
      </a>

      <div className="flex items-center gap-3">
        {/* Hamburger menu for mobile/tablet */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
          aria-expanded={isSidebarOpen}
          className="min-h-11 min-w-11 lg:hidden"
          data-testid="menu-toggle"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="zyncdata - Home"
          data-testid="header-logo"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-dxt-primary to-dxt-secondary text-sm font-bold text-white shadow-sm shadow-dxt-primary/25">
            Zn
          </span>
          <span className="text-lg">zyncdata</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-foreground"
            data-testid="user-name"
          >
            {userName}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              roleBadgeColors[userRole],
            )}
            data-testid="role-badge"
          >
            {roleDisplayNames[userRole]}
          </span>
        </div>

        {/* Logout button */}
        <LogoutButton />
      </div>
    </header>
  )
}
