import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import StatusBadge from '@/components/patterns/StatusBadge'

describe('StatusBadge', () => {
  it('should render "Online" with green dot for online status', () => {
    const { container } = render(StatusBadge({ status: 'online' }))

    expect(screen.getByText('Online')).toBeDefined()
    expect(container.querySelector('.bg-emerald-500')).not.toBeNull()
    expect(container.innerHTML).toContain('bg-emerald-50')
  })

  it('should render ping animation for online status', () => {
    const { container } = render(StatusBadge({ status: 'online' }))

    expect(container.querySelector('.motion-safe\\:animate-ping')).not.toBeNull()
  })

  it('should render "Offline" with red dot and visual prominence for offline status', () => {
    const { container } = render(StatusBadge({ status: 'offline' }))

    expect(screen.getByText('Offline')).toBeDefined()
    expect(container.querySelector('.bg-red-500')).not.toBeNull()
    expect(container.innerHTML).toContain('bg-red-50')
    expect(container.innerHTML).toContain('font-semibold')
    expect(container.innerHTML).toContain('border-red-300')
  })

  it('should NOT render ping animation for offline status', () => {
    const { container } = render(StatusBadge({ status: 'offline' }))

    expect(container.querySelector('.motion-safe\\:animate-ping')).toBeNull()
  })

  it('should render "Status unknown" with gray dot for null status', () => {
    const { container } = render(StatusBadge({ status: null }))

    expect(screen.getByText('Status unknown')).toBeDefined()
    expect(container.querySelector('.bg-gray-400')).not.toBeNull()
    expect(container.innerHTML).toContain('bg-gray-50')
  })

  it('should render "Status unknown" for unrecognized status value', () => {
    const { container } = render(StatusBadge({ status: 'degraded' }))

    expect(screen.getByText('Status unknown')).toBeDefined()
    expect(container.querySelector('.bg-gray-400')).not.toBeNull()
  })

  it('should render "Coming Soon" with indigo dot for coming_soon status', () => {
    const { container } = render(StatusBadge({ status: 'coming_soon' }))

    expect(screen.getByText('Coming Soon')).toBeDefined()
    expect(container.querySelector('.bg-indigo-500')).not.toBeNull()
    expect(container.innerHTML).toContain('bg-indigo-50')
  })

  it('should NOT render ping animation for coming_soon status', () => {
    const { container } = render(StatusBadge({ status: 'coming_soon' }))

    expect(container.querySelector('.motion-safe\\:animate-ping')).toBeNull()
  })

  it('should include aria-label for online status', () => {
    render(StatusBadge({ status: 'online' }))
    expect(screen.getByLabelText('System status: Online')).toBeDefined()
  })

  it('should include aria-label for offline status', () => {
    render(StatusBadge({ status: 'offline' }))
    expect(screen.getByLabelText('System status: Offline')).toBeDefined()
  })

  it('should include aria-label for unknown status', () => {
    render(StatusBadge({ status: null }))
    expect(screen.getByLabelText('System status: Status unknown')).toBeDefined()
  })

  it('should include aria-label for coming_soon status', () => {
    render(StatusBadge({ status: 'coming_soon' }))
    expect(screen.getByLabelText('System status: Coming Soon')).toBeDefined()
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
