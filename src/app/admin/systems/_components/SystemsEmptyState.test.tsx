import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import SystemsEmptyState from './SystemsEmptyState'

describe('SystemsEmptyState', () => {
  it('should render empty state component', () => {
    render(<SystemsEmptyState />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should render title', () => {
    render(<SystemsEmptyState />)

    expect(screen.getByRole('heading', { name: 'No Systems Yet' })).toBeInTheDocument()
  })

  it('should render description', () => {
    render(<SystemsEmptyState />)

    expect(
      screen.getByText('Add your first system to get started monitoring.'),
    ).toBeInTheDocument()
  })

  it('should render add system CTA button', () => {
    render(<SystemsEmptyState />)

    const button = screen.getByRole('link', { name: 'Add System' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/admin/systems/new')
  })

  it('should have min-h-11 on CTA button', () => {
    render(<SystemsEmptyState />)

    const button = screen.getByRole('link', { name: 'Add System' })
    expect(button).toHaveClass('min-h-11')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<SystemsEmptyState />)

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
