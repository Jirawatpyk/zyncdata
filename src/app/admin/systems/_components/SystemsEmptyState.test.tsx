import { describe, it, expect } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import SystemsEmptyState from './SystemsEmptyState'
import { createQueryWrapper } from '@/lib/test-utils'

describe('SystemsEmptyState', () => {
  it('should render title', () => {
    render(<SystemsEmptyState />, { wrapper: createQueryWrapper() })

    expect(
      screen.getByRole('heading', { name: 'No Systems Yet' }),
    ).toBeInTheDocument()
  })

  it('should render description', () => {
    render(<SystemsEmptyState />, { wrapper: createQueryWrapper() })

    expect(
      screen.getByText('Add your first system to get started monitoring.'),
    ).toBeInTheDocument()
  })

  it('should render add system CTA button that opens dialog', async () => {
    const user = userEvent.setup()
    render(<SystemsEmptyState />, { wrapper: createQueryWrapper() })

    const button = screen.getByTestId('empty-state-add-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Add System')

    // Click should open dialog
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
    })
  })

  it('should have min-h-11 on CTA button', () => {
    render(<SystemsEmptyState />, { wrapper: createQueryWrapper() })

    const button = screen.getByTestId('empty-state-add-button')
    expect(button).toHaveClass('min-h-11')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<SystemsEmptyState />, {
      wrapper: createQueryWrapper(),
    })

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
