import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import AdminSidebar from './AdminSidebar'

const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/admin/systems')
  })

  it('should render all navigation links', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    expect(screen.getByTestId('nav-link-systems')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-content')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-analytics')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-settings')).toBeInTheDocument()
  })

  it('should show active state for current route', () => {
    mockPathname.mockReturnValue('/admin/systems')
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    const systemsLink = screen.getByTestId('nav-link-systems')
    expect(systemsLink).toHaveAttribute('aria-current', 'page')
    expect(systemsLink).toHaveClass('bg-accent')
  })

  it('should not show active state for inactive routes', () => {
    mockPathname.mockReturnValue('/admin/systems')
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    const contentLink = screen.getByTestId('nav-link-content')
    expect(contentLink).not.toHaveAttribute('aria-current')
    expect(contentLink).not.toHaveClass('bg-accent')
  })

  it('should render navigation landmark with aria-label', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    const nav = screen.getByRole('navigation', { name: 'Admin navigation' })
    expect(nav).toBeInTheDocument()
  })

  it('should show backdrop when open on mobile', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('should not show backdrop when closed', () => {
    render(<AdminSidebar isOpen={false} onClose={vi.fn()} role="super_admin" />)

    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<AdminSidebar isOpen={true} onClose={onClose} role="super_admin" />)

    fireEvent.click(screen.getByTestId('sidebar-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<AdminSidebar isOpen={true} onClose={onClose} role="super_admin" />)

    fireEvent.click(screen.getByTestId('sidebar-close-button'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should call onClose when nav link clicked', () => {
    const onClose = vi.fn()
    render(<AdminSidebar isOpen={true} onClose={onClose} role="super_admin" />)

    fireEvent.click(screen.getByTestId('nav-link-content'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should have correct href for each nav link', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    expect(screen.getByTestId('nav-link-systems')).toHaveAttribute('href', '/admin/systems')
    expect(screen.getByTestId('nav-link-content')).toHaveAttribute('href', '/admin/content')
    expect(screen.getByTestId('nav-link-analytics')).toHaveAttribute('href', '/admin/analytics')
    expect(screen.getByTestId('nav-link-settings')).toHaveAttribute('href', '/admin/settings')
  })

  it('should have min-h-11 touch targets on all links', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-11')
    })
  })

  it('should show Users link for super_admin role', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    expect(screen.getByTestId('nav-link-users')).toBeInTheDocument()
    expect(screen.getByTestId('nav-link-users')).toHaveAttribute('href', '/admin/users')
  })

  it('should hide Users link for admin role', () => {
    render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="admin" />)

    expect(screen.queryByTestId('nav-link-users')).not.toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<AdminSidebar isOpen={true} onClose={vi.fn()} role="super_admin" />)

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
