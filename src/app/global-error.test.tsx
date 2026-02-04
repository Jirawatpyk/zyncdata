import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'
import GlobalError from '@/app/global-error'

describe('GlobalError', () => {
  const mockReset = vi.fn()
  const mockError = new Error('Test error')

  beforeEach(() => {
    vi.clearAllMocks()
    // GlobalError renders <html>/<body> (Next.js global-error convention) which
    // triggers a jsdom nesting warning when rendered inside Testing Library's <div>
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render error message', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText('An unexpected error occurred. Please try reloading the page.'),
    ).toBeInTheDocument()
  })

  it('should render reload button', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('should call reset when reload button is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(mockReset).toHaveBeenCalledOnce()
  })

  it('should report error to Sentry', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(Sentry.captureException).toHaveBeenCalledWith(mockError)
  })
})
