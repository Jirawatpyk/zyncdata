import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import AdminShell from './AdminShell'
import type { AuthResult } from '@/lib/auth/guard'
import type { User } from '@supabase/supabase-js'

const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

function createMockAuth(overrides?: Partial<AuthResult>): AuthResult {
  return {
    user: {
      id: 'user-123',
      aud: 'authenticated',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
      app_metadata: { role: 'admin' },
      created_at: '2026-01-01T00:00:00Z',
    } as User,
    role: 'admin',
    ...overrides,
  }
}

describe('AdminShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/admin/systems')
  })

  it('should render header and sidebar', () => {
    render(
      <AdminShell auth={createMockAuth()}>
        <div>Test content</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('admin-header')).toBeInTheDocument()
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument()
  })

  it('should render children in main content area', () => {
    render(
      <AdminShell auth={createMockAuth()}>
        <div data-testid="child-content">Test content</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByTestId('admin-main-content')).toContainElement(
      screen.getByTestId('child-content'),
    )
  })

  it('should extract display name from user metadata', () => {
    const auth = createMockAuth()
    auth.user.user_metadata = { display_name: 'John Doe' }
    render(
      <AdminShell auth={auth}>
        <div>Test</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe')
  })

  it('should fallback to full_name if display_name not available', () => {
    const auth = createMockAuth()
    auth.user.user_metadata = { full_name: 'Jane Smith' }
    render(
      <AdminShell auth={auth}>
        <div>Test</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Smith')
  })

  it('should fallback to email prefix if no name metadata', () => {
    const auth = createMockAuth()
    auth.user.user_metadata = {}
    auth.user.email = 'john@example.com'
    render(
      <AdminShell auth={auth}>
        <div>Test</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('user-name')).toHaveTextContent('john')
  })

  it('should toggle sidebar when menu clicked', () => {
    render(
      <AdminShell auth={createMockAuth()}>
        <div>Test</div>
      </AdminShell>,
    )

    // Initially sidebar should be closed (no backdrop visible)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()

    // Click menu toggle
    fireEvent.click(screen.getByTestId('menu-toggle'))

    // Sidebar should now be open (backdrop visible)
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('should close sidebar when backdrop clicked', () => {
    render(
      <AdminShell auth={createMockAuth()}>
        <div>Test</div>
      </AdminShell>,
    )

    // Open sidebar
    fireEvent.click(screen.getByTestId('menu-toggle'))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()

    // Close by clicking backdrop
    fireEvent.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('should have main-content id for skip link', () => {
    render(
      <AdminShell auth={createMockAuth()}>
        <div>Test</div>
      </AdminShell>,
    )

    expect(screen.getByTestId('admin-main-content')).toHaveAttribute('id', 'main-content')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <AdminShell auth={createMockAuth()}>
        <div>Test content</div>
      </AdminShell>,
    )

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
