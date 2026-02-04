import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'
import ErrorPage from '@/app/error'

describe('ErrorPage', () => {
  const mockReset = vi.fn()
  const mockError = new Error('Test error')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error message heading', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should render error description', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(screen.getByText('Please try again later.')).toBeInTheDocument()
  })

  it('should render "Try again" button', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('should call reset when "Try again" button is clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mockReset).toHaveBeenCalledOnce()
  })

  it('should report error to Sentry via captureException', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(Sentry.captureException).toHaveBeenCalledWith(mockError)
  })

  it('should report error with digest to Sentry', () => {
    const digestError = Object.assign(new Error('Digest error'), {
      digest: 'abc123',
    })
    render(<ErrorPage error={digestError} reset={mockReset} />)

    expect(Sentry.captureException).toHaveBeenCalledWith(digestError)
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ErrorPage error={mockError} reset={mockReset} />,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
