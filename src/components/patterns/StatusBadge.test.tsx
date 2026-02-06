import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import StatusBadge from '@/components/patterns/StatusBadge'

describe('StatusBadge', () => {
  it('should render "Online" with green dot for online status', () => {
    const jsx = StatusBadge({ status: 'online' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Online')
    expect(rendered).toContain('bg-emerald-500')
    expect(rendered).toContain('bg-emerald-50')
  })

  it('should render ping animation for online status', () => {
    const jsx = StatusBadge({ status: 'online' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('motion-safe:animate-ping')
  })

  it('should render "Offline" with red dot for offline status', () => {
    const jsx = StatusBadge({ status: 'offline' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Offline')
    expect(rendered).toContain('bg-red-500')
    expect(rendered).toContain('bg-red-50')
  })

  it('should NOT render ping animation for offline status', () => {
    const jsx = StatusBadge({ status: 'offline' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).not.toContain('motion-safe:animate-ping')
  })

  it('should render "Status unknown" with gray dot for null status', () => {
    const jsx = StatusBadge({ status: null })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Status unknown')
    expect(rendered).toContain('bg-gray-400')
    expect(rendered).toContain('bg-gray-50')
  })

  it('should render "Status unknown" for unrecognized status value', () => {
    const jsx = StatusBadge({ status: 'degraded' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Status unknown')
    expect(rendered).toContain('bg-gray-400')
  })

  it('should render "Coming Soon" with indigo dot for coming_soon status', () => {
    const jsx = StatusBadge({ status: 'coming_soon' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Coming Soon')
    expect(rendered).toContain('bg-indigo-500')
    expect(rendered).toContain('bg-indigo-50')
  })

  it('should NOT render ping animation for coming_soon status', () => {
    const jsx = StatusBadge({ status: 'coming_soon' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).not.toContain('motion-safe:animate-ping')
  })

  it('should include aria-label for online status', () => {
    const jsx = StatusBadge({ status: 'online' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('System status: Online')
  })

  it('should include aria-label for offline status', () => {
    const jsx = StatusBadge({ status: 'offline' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('System status: Offline')
  })

  it('should include aria-label for unknown status', () => {
    const jsx = StatusBadge({ status: null })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('System status: Status unknown')
  })

  it('should include aria-label for coming_soon status', () => {
    const jsx = StatusBadge({ status: 'coming_soon' })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('System status: Coming Soon')
  })

  it('should have no accessibility violations for online status', async () => {
    const { container } = render(StatusBadge({ status: 'online' }))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations for offline status', async () => {
    const { container } = render(StatusBadge({ status: 'offline' }))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no accessibility violations for null status', async () => {
    const { container } = render(StatusBadge({ status: null }))
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
