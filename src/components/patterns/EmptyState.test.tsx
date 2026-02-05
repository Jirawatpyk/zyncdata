import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Monitor } from 'lucide-react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('should render icon', () => {
    render(
      <EmptyState
        icon={<Monitor data-testid="test-icon" className="h-12 w-12" />}
        title="No Items"
      />,
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should render title', () => {
    render(<EmptyState icon={<Monitor />} title="No Items Found" />)

    expect(screen.getByRole('heading', { name: 'No Items Found' })).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(
      <EmptyState
        icon={<Monitor />}
        title="No Items"
        description="Add your first item to get started."
      />,
    )

    expect(screen.getByText('Add your first item to get started.')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    render(<EmptyState icon={<Monitor />} title="No Items" />)

    expect(screen.queryByText(/get started/)).not.toBeInTheDocument()
  })

  it('should render link button when action has href', () => {
    render(
      <EmptyState
        icon={<Monitor />}
        title="No Items"
        action={{ label: 'Add Item', href: '/items/new' }}
      />,
    )

    const link = screen.getByRole('link', { name: 'Add Item' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/items/new')
  })

  it('should render button when action has onClick', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={<Monitor />}
        title="No Items"
        action={{ label: 'Add Item', onClick }}
      />,
    )

    const button = screen.getByRole('button', { name: 'Add Item' })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should not render action when not provided', () => {
    render(<EmptyState icon={<Monitor />} title="No Items" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should have min-h-11 on action button', () => {
    render(
      <EmptyState
        icon={<Monitor />}
        title="No Items"
        action={{ label: 'Add Item', href: '/items/new' }}
      />,
    )

    expect(screen.getByRole('link')).toHaveClass('min-h-11')
  })

  it('should have data-testid empty-state', () => {
    render(<EmptyState icon={<Monitor />} title="No Items" />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<EmptyState icon={<Monitor />} title="No Items" className="custom-class" />)

    expect(screen.getByTestId('empty-state')).toHaveClass('custom-class')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <EmptyState
        icon={<Monitor />}
        title="No Items"
        description="Add your first item."
        action={{ label: 'Add Item', href: '/items/new' }}
      />,
    )

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
