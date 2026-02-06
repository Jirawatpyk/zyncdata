import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { JSX } from 'react'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import SystemCard from '@/components/patterns/SystemCard'

describe('SystemCard', () => {
  const defaultProps = {
    name: 'TINEDY',
    url: 'https://tinedy.dxt-ai.com',
    logoUrl: null,
    description: 'Task management system',
    status: null,
    lastCheckedAt: null,
  }

  it('should render system name and description', () => {
    const jsx = SystemCard(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('TINEDY')
    expect(rendered).toContain('Task management system')
  })

  it('should render link with correct href and target', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props.href).toBe('https://tinedy.dxt-ai.com')
    expect(props.target).toBe('_blank')
    expect(props.rel).toBe('noopener noreferrer')
  })

  it('should render ARIA label with name and description', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props['aria-label']).toBe('Visit TINEDY - Task management system')
  })

  it('should render ARIA label without description when null', () => {
    const jsx = SystemCard({ ...defaultProps, description: null }) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props['aria-label']).toBe('Visit TINEDY')
  })

  it('should render letter avatar when logoUrl is null', () => {
    const jsx = SystemCard(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('aria-hidden')
    expect(rendered).toContain('T')
  })

  it('should render img element when logoUrl is provided', () => {
    const jsx = SystemCard({
      ...defaultProps,
      logoUrl: 'https://example.com/logo.png',
    })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('https://example.com/logo.png')
    expect(rendered).toContain('TINEDY logo')
  })

  it('should include focus-visible ring classes', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, string>

    expect(props.className).toContain('focus-visible:ring-2')
    expect(props.className).toContain('focus-visible:ring-dxt-primary')
  })

  it('should include motion-safe hover classes', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, string>

    expect(props.className).toContain('motion-safe:hover:')
    expect(props.className).toContain('motion-safe:hover:shadow-')
  })

  it('should link to coming-soon page when status is coming_soon', () => {
    const jsx = SystemCard({ ...defaultProps, status: 'coming_soon' }) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props.href).toBe('/coming-soon?system=TINEDY')
    expect(props.target).toBeUndefined()
    expect(props.rel).toBeUndefined()
  })

  it('should render coming_soon ARIA label correctly', () => {
    const jsx = SystemCard({ ...defaultProps, status: 'coming_soon' }) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props['aria-label']).toBe('TINEDY - Coming Soon - Task management system')
  })

  it('should pass status prop to StatusBadge child', () => {
    const jsx = SystemCard(defaultProps)
    const rendered = JSON.stringify(jsx)
    expect(rendered).toContain('"status":null')
  })

  // Story 3.8: Status indicator rendering tests (use render() + fake timers)

  describe('status indicators', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should render StatusBadge with "Status unknown" for null status', () => {
      const { container } = render(SystemCard(defaultProps))
      expect(container.textContent).toContain('Status unknown')
    })

    it('should render StatusBadge with "Online" for online status', () => {
      const { container } = render(
        SystemCard({
          ...defaultProps,
          status: 'online',
          lastCheckedAt: '2026-02-07T11:55:00.000Z',
        }),
      )
      expect(container.textContent).toContain('Online')
    })

    it('should render StatusBadge with "Offline" for offline status', () => {
      const { container } = render(
        SystemCard({
          ...defaultProps,
          status: 'offline',
          lastCheckedAt: '2026-02-07T11:55:00.000Z',
        }),
      )
      expect(container.textContent).toContain('Offline')
    })

    it('should render "Coming Soon" badge for coming_soon status', () => {
      const { container } = render(
        SystemCard({ ...defaultProps, status: 'coming_soon' }),
      )
      expect(container.textContent).toContain('Coming Soon')
    })

    it('should render RelativeTime "Never checked" for null lastCheckedAt', () => {
      const { container } = render(SystemCard(defaultProps))
      expect(container.textContent).toContain('Never checked')
    })

    it('should render RelativeTime with timestamp', () => {
      const { container } = render(
        SystemCard({
          ...defaultProps,
          status: 'online',
          lastCheckedAt: '2026-02-07T11:55:00.000Z',
        }),
      )
      expect(container.textContent).toContain('Last checked:')
      expect(container.textContent).toContain('5 minutes ago')
    })

    it('should NOT render RelativeTime for coming_soon status', () => {
      const { container } = render(
        SystemCard({ ...defaultProps, status: 'coming_soon' }),
      )
      expect(container.textContent).not.toContain('Never checked')
      expect(container.textContent).not.toContain('Last checked')
    })
  })

  // Accessibility tests (use real timers for axe compatibility)

  it('should have no accessibility violations', async () => {
    const { container } = render(
      SystemCard({
        name: 'TINEDY',
        url: 'https://example.com',
        logoUrl: null,
        description: 'Test',
        status: null,
        lastCheckedAt: null,
      }),
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations for coming_soon card', async () => {
    const { container } = render(
      SystemCard({
        name: 'VOCA',
        url: 'https://voca.dxt-ai.com',
        logoUrl: null,
        description: 'AI vocabulary system',
        status: 'coming_soon',
        lastCheckedAt: null,
      }),
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations for online status card', async () => {
    const { container } = render(
      SystemCard({
        name: 'TINEDY',
        url: 'https://tinedy.dxt-ai.com',
        logoUrl: null,
        description: 'Task management system',
        status: 'online',
        lastCheckedAt: '2026-02-07T11:55:00.000Z',
      }),
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations for offline status card', async () => {
    const { container } = render(
      SystemCard({
        name: 'TINEDY',
        url: 'https://tinedy.dxt-ai.com',
        logoUrl: null,
        description: 'Task management system',
        status: 'offline',
        lastCheckedAt: '2026-02-07T10:00:00.000Z',
      }),
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
