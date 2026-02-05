import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from './layout'

const mockRequireAuth = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/systems',
}))

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call requireAuth with admin role', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', user_metadata: {} },
      role: 'admin',
    })

    const Layout = await AdminLayout({ children: <div>Admin Content</div> })
    render(Layout)

    expect(mockRequireAuth).toHaveBeenCalledWith('admin')
    expect(mockRequireAuth).toHaveBeenCalledTimes(1)
  })

  it('should render children when role is admin', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', user_metadata: {} },
      role: 'admin',
    })

    const Layout = await AdminLayout({
      children: <div data-testid="admin-content">Admin Content</div>,
    })
    render(Layout)

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('should render children when role is super_admin', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'super-admin-1', email: 'superadmin@test.com', user_metadata: {} },
      role: 'super_admin',
    })

    const Layout = await AdminLayout({
      children: <div data-testid="admin-content">Admin Content</div>,
    })
    render(Layout)

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('should render AdminShell with auth context', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com', user_metadata: { display_name: 'Admin User' } },
      role: 'admin',
    })

    const Layout = await AdminLayout({
      children: <div>Content</div>,
    })
    render(Layout)

    expect(screen.getByTestId('admin-shell')).toBeInTheDocument()
    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
  })
})
