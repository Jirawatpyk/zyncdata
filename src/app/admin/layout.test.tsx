import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from './layout'

const mockRequireAuth = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

describe('AdminLayout', () => {
  it('should call requireAuth with admin role', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'admin-1' },
      role: 'admin',
    })

    const Layout = await AdminLayout({ children: <div>Admin Content</div> })
    render(Layout)

    expect(mockRequireAuth).toHaveBeenCalledWith('admin')
    expect(mockRequireAuth).toHaveBeenCalledTimes(1)
  })

  it('should render children when role is admin', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'admin-1' },
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
      user: { id: 'super-admin-1' },
      role: 'super_admin',
    })

    const Layout = await AdminLayout({
      children: <div data-testid="admin-content">Admin Content</div>,
    })
    render(Layout)

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })
})
