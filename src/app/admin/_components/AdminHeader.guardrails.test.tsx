/**
 * AdminHeader Guardrail Tests
 *
 * These tests verify INVARIANTS that must never change.
 * P0 = Critical (breaks accessibility or security)
 * P1 = Important (breaks functionality or UX)
 *
 * @see Story 3.1 - CMS Admin Panel Layout & Navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import AdminHeader from './AdminHeader'

// Mock logout action
vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

describe('AdminHeader Guardrails', () => {
  const defaultProps = {
    userName: 'Test User',
    userRole: 'admin' as const,
    onMenuClick: vi.fn(),
    isSidebarOpen: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] MUST have skip link for keyboard accessibility', () => {
      render(<AdminHeader {...defaultProps} />)

      const skipLink = screen.getByTestId('skip-link')

      // Skip link MUST exist
      expect(skipLink, 'Skip link MUST exist for keyboard users').toBeInTheDocument()

      // Skip link MUST point to main content
      expect(
        skipLink,
        'Skip link MUST have href="#main-content"',
      ).toHaveAttribute('href', '#main-content')

      // Skip link MUST have meaningful text
      expect(
        skipLink,
        'Skip link MUST have descriptive text',
      ).toHaveTextContent('Skip to main content')
    })

    it('[P0] MUST render logout button for security', () => {
      render(<AdminHeader {...defaultProps} />)

      const logoutButton = screen.getByTestId('logout-button')

      // Logout button MUST exist
      expect(
        logoutButton,
        'Logout button MUST be present for authenticated users',
      ).toBeInTheDocument()

      // Logout button MUST be a submit button (inside form)
      expect(
        logoutButton,
        'Logout button MUST be type="submit" for form action',
      ).toHaveAttribute('type', 'submit')
    })

    it('[P0] MUST have min-h-11 (44px touch target) on menu toggle button', () => {
      render(<AdminHeader {...defaultProps} />)

      const menuToggle = screen.getByTestId('menu-toggle')
      expect(
        menuToggle,
        'Menu toggle MUST have min-h-11 class for 44px touch target',
      ).toHaveClass('min-h-11')
    })

    it('[P0] MUST have no accessibility violations (axe)', async () => {
      const { container } = render(<AdminHeader {...defaultProps} />)

      await act(async () => {
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })

    it('[P0] Menu toggle MUST have accessible label and aria-expanded', () => {
      render(<AdminHeader {...defaultProps} isSidebarOpen={true} />)

      const menuToggle = screen.getByTestId('menu-toggle')

      expect(
        menuToggle,
        'Menu toggle MUST have aria-label',
      ).toHaveAttribute('aria-label', 'Toggle navigation')

      expect(
        menuToggle,
        'Menu toggle MUST have aria-expanded attribute',
      ).toHaveAttribute('aria-expanded')
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] MUST display user name via data-testid="user-name"', () => {
      render(<AdminHeader {...defaultProps} userName="John Smith" />)

      const userName = screen.getByTestId('user-name')

      // User name element MUST exist
      expect(userName, 'User name element MUST exist').toBeInTheDocument()

      // User name MUST display the provided name
      expect(
        userName,
        'User name MUST display the provided userName prop',
      ).toHaveTextContent('John Smith')
    })

    it('[P1] MUST display role badge with correct text for admin role', () => {
      render(<AdminHeader {...defaultProps} userRole="admin" />)

      const roleBadge = screen.getByTestId('role-badge')

      expect(roleBadge, 'Role badge MUST exist').toBeInTheDocument()
      expect(
        roleBadge,
        'Role badge MUST display "Admin" for admin role',
      ).toHaveTextContent('Admin')
    })

    it('[P1] MUST display role badge with correct text for super_admin role', () => {
      render(<AdminHeader {...defaultProps} userRole="super_admin" />)

      const roleBadge = screen.getByTestId('role-badge')

      expect(roleBadge, 'Role badge MUST exist').toBeInTheDocument()
      expect(
        roleBadge,
        'Role badge MUST display "Super Admin" for super_admin role',
      ).toHaveTextContent('Super Admin')
    })

    it('[P1] MUST display role badge with correct text for user role', () => {
      render(<AdminHeader {...defaultProps} userRole="user" />)

      const roleBadge = screen.getByTestId('role-badge')

      expect(roleBadge, 'Role badge MUST exist').toBeInTheDocument()
      expect(
        roleBadge,
        'Role badge MUST display "User" for user role',
      ).toHaveTextContent('User')
    })

    it('[P1] Logo MUST link to home page', () => {
      render(<AdminHeader {...defaultProps} />)

      const logo = screen.getByTestId('header-logo')

      expect(logo, 'Logo MUST exist').toBeInTheDocument()
      expect(
        logo,
        'Logo MUST link to home page "/"',
      ).toHaveAttribute('href', '/')
    })

    it('[P1] Logo MUST have accessible label', () => {
      render(<AdminHeader {...defaultProps} />)

      const logo = screen.getByTestId('header-logo')
      expect(
        logo,
        'Logo MUST have aria-label for accessibility',
      ).toHaveAttribute('aria-label', 'zyncdata - Home')
    })

    it('[P1] aria-expanded MUST reflect sidebar state', () => {
      const { rerender } = render(
        <AdminHeader {...defaultProps} isSidebarOpen={false} />,
      )

      const menuToggle = screen.getByTestId('menu-toggle')

      // When closed
      expect(
        menuToggle,
        'aria-expanded MUST be "false" when sidebar is closed',
      ).toHaveAttribute('aria-expanded', 'false')

      // When open
      rerender(<AdminHeader {...defaultProps} isSidebarOpen={true} />)
      expect(
        menuToggle,
        'aria-expanded MUST be "true" when sidebar is open',
      ).toHaveAttribute('aria-expanded', 'true')
    })
  })
})
