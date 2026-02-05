import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from './layout'

const mockRequireAuth = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

describe('DashboardLayout', () => {
  it('should call requireAuth() without role parameter', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1' },
      role: 'user',
    })

    const Layout = await DashboardLayout({ children: <div>Dashboard Content</div> })
    render(Layout)

    expect(mockRequireAuth).toHaveBeenCalledWith()
    expect(mockRequireAuth).toHaveBeenCalledTimes(1)
  })

  it('should render children when authenticated', async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1' },
      role: 'user',
    })

    const Layout = await DashboardLayout({
      children: <div data-testid="dashboard-content">Dashboard Content</div>,
    })
    render(Layout)

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument()
  })
})
