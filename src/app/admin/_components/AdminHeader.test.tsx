import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import AdminHeader from './AdminHeader'

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

describe('AdminHeader', () => {
  const defaultProps = {
    userName: 'Test User',
    userRole: 'admin' as const,
    onMenuClick: vi.fn(),
    isSidebarOpen: false,
  }

  it('should render logo with correct text', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('header-logo')).toBeInTheDocument()
    expect(screen.getByText('zyncdata')).toBeInTheDocument()
  })

  it('should render user name', () => {
    render(<AdminHeader {...defaultProps} userName="John Doe" />)

    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe')
  })

  it('should render role badge with correct display name', () => {
    render(<AdminHeader {...defaultProps} userRole="super_admin" />)

    expect(screen.getByTestId('role-badge')).toHaveTextContent('Super Admin')
  })

  it('should render admin role badge', () => {
    render(<AdminHeader {...defaultProps} userRole="admin" />)

    expect(screen.getByTestId('role-badge')).toHaveTextContent('Admin')
  })

  it('should render logout button', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('should render skip link for accessibility', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('skip-link')).toBeInTheDocument()
    expect(screen.getByTestId('skip-link')).toHaveAttribute('href', '#main-content')
  })

  it('should render menu toggle button', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('menu-toggle')).toBeInTheDocument()
  })

  it('should call onMenuClick when menu toggle clicked', () => {
    const onMenuClick = vi.fn()
    render(<AdminHeader {...defaultProps} onMenuClick={onMenuClick} />)

    fireEvent.click(screen.getByTestId('menu-toggle'))
    expect(onMenuClick).toHaveBeenCalledOnce()
  })

  it('should have correct aria-expanded state when sidebar open', () => {
    render(<AdminHeader {...defaultProps} isSidebarOpen={true} />)

    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-expanded', 'true')
  })

  it('should have correct aria-expanded state when sidebar closed', () => {
    render(<AdminHeader {...defaultProps} isSidebarOpen={false} />)

    expect(screen.getByTestId('menu-toggle')).toHaveAttribute('aria-expanded', 'false')
  })

  it('should have logo linking to home', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('header-logo')).toHaveAttribute('href', '/')
  })

  it('should have min-h-11 touch target on menu toggle', () => {
    render(<AdminHeader {...defaultProps} />)

    expect(screen.getByTestId('menu-toggle')).toHaveClass('min-h-11')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<AdminHeader {...defaultProps} />)

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
