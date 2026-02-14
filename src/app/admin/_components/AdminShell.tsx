'use client'

import { useState, useCallback } from 'react'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import type { AuthResult } from '@/lib/auth/guard'

interface AdminShellProps {
  auth: AuthResult
  children: React.ReactNode
}

export default function AdminShell({ auth, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  // Extract display name from user metadata or email
  const userName =
    auth.user.user_metadata?.display_name ||
    auth.user.user_metadata?.full_name ||
    auth.user.email?.split('@')[0] ||
    'User'

  return (
    <div className="min-h-screen bg-background" data-testid="admin-shell">
      <AdminHeader
        userName={userName}
        userRole={auth.role}
        onMenuClick={handleMenuClick}
        isSidebarOpen={isSidebarOpen}
      />

      <AdminSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} role={auth.role} />

      <main
        id="main-content"
        className="min-h-[calc(100vh-4rem)] pt-16 lg:ml-64"
        data-testid="admin-main-content"
      >
        {children}
      </main>
    </div>
  )
}
