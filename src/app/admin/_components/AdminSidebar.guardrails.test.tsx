/**
 * AdminSidebar Guardrail Tests
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
import AdminSidebar from './AdminSidebar'

// Mock next/navigation
const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('AdminSidebar Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue('/admin/systems')
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] MUST have min-h-11 (44px touch target) on all nav links - Epic 2 retro requirement', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      // All 4 navigation links must have 44px minimum touch target
      const navLinks = [
        screen.getByTestId('nav-link-systems'),
        screen.getByTestId('nav-link-content'),
        screen.getByTestId('nav-link-analytics'),
        screen.getByTestId('nav-link-settings'),
      ]

      navLinks.forEach((link, index) => {
        expect(
          link,
          `Nav link ${index + 1} MUST have min-h-11 class for 44px touch target`,
        ).toHaveClass('min-h-11')
      })
    })

    it('[P0] MUST have min-h-11 (44px touch target) on close button', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      const closeButton = screen.getByTestId('sidebar-close-button')
      expect(
        closeButton,
        'Close button MUST have min-h-11 class for 44px touch target',
      ).toHaveClass('min-h-11')
    })

    it('[P0] MUST render navigation landmark with aria-label for screen readers', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      // Navigation landmark MUST exist
      const nav = screen.getByRole('navigation')
      expect(nav, 'Navigation landmark MUST exist').toBeInTheDocument()

      // MUST have aria-label for identification
      expect(
        nav,
        'Navigation MUST have aria-label for screen reader identification',
      ).toHaveAttribute('aria-label', 'Admin navigation')
    })

    it('[P0] MUST have no accessibility violations (axe)', async () => {
      const { container } = render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      await act(async () => {
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] MUST render all 4 nav items: Systems, Content, Analytics, Settings', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      // These exact 4 nav items are required for CMS admin
      const requiredNavItems = [
        { testId: 'nav-link-systems', label: 'Systems' },
        { testId: 'nav-link-content', label: 'Content' },
        { testId: 'nav-link-analytics', label: 'Analytics' },
        { testId: 'nav-link-settings', label: 'Settings' },
      ]

      requiredNavItems.forEach(({ testId, label }) => {
        const link = screen.getByTestId(testId)
        expect(link, `Nav item '${label}' MUST be rendered`).toBeInTheDocument()
        expect(link, `Nav item MUST display '${label}' text`).toHaveTextContent(label)
      })
    })

    it('[P1] MUST have correct href for each nav item', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      // Routes MUST match expected admin routes
      const expectedRoutes = [
        { testId: 'nav-link-systems', href: '/admin/systems' },
        { testId: 'nav-link-content', href: '/admin/content' },
        { testId: 'nav-link-analytics', href: '/admin/analytics' },
        { testId: 'nav-link-settings', href: '/admin/settings' },
      ]

      expectedRoutes.forEach(({ testId, href }) => {
        expect(
          screen.getByTestId(testId),
          `Nav link MUST route to ${href}`,
        ).toHaveAttribute('href', href)
      })
    })

    it('[P1] Active route MUST have aria-current="page" for accessibility', () => {
      mockPathname.mockReturnValue('/admin/systems')
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      // Active link MUST have aria-current="page"
      const activeLink = screen.getByTestId('nav-link-systems')
      expect(
        activeLink,
        'Active route MUST have aria-current="page" attribute',
      ).toHaveAttribute('aria-current', 'page')

      // Inactive links MUST NOT have aria-current
      const inactiveLinks = [
        screen.getByTestId('nav-link-content'),
        screen.getByTestId('nav-link-analytics'),
        screen.getByTestId('nav-link-settings'),
      ]

      inactiveLinks.forEach((link) => {
        expect(
          link,
          'Inactive route MUST NOT have aria-current attribute',
        ).not.toHaveAttribute('aria-current')
      })
    })

    it('[P1] Active state MUST update when pathname changes', () => {
      // Test Content route active
      mockPathname.mockReturnValue('/admin/content')
      const { rerender } = render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('nav-link-content')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('nav-link-systems')).not.toHaveAttribute('aria-current')

      // Test Settings route active
      mockPathname.mockReturnValue('/admin/settings')
      rerender(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByTestId('nav-link-settings')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('nav-link-content')).not.toHaveAttribute('aria-current')
    })

    it('[P1] Close button MUST have accessible label', () => {
      render(<AdminSidebar isOpen={true} onClose={vi.fn()} />)

      const closeButton = screen.getByTestId('sidebar-close-button')
      expect(
        closeButton,
        'Close button MUST have aria-label for screen readers',
      ).toHaveAttribute('aria-label', 'Close navigation')
    })
  })
})
