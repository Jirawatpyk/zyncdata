import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render immediately with default delay', () => {
    render(<LoadingSpinner />)

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('should render after 200ms delay by default', async () => {
    render(<LoadingSpinner />)

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render immediately when delay is 0', () => {
    render(<LoadingSpinner delay={0} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should respect custom delay', async () => {
    render(<LoadingSpinner delay={500} />)

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(499)
    })
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should have role="status"', () => {
    render(<LoadingSpinner delay={0} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have aria-label="Loading"', () => {
    render(<LoadingSpinner delay={0} />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('should have aria-live="polite"', () => {
    render(<LoadingSpinner delay={0} />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('should apply custom className', () => {
    render(<LoadingSpinner delay={0} className="custom-class" />)

    expect(screen.getByTestId('loading-spinner')).toHaveClass('custom-class')
  })

  it('should render spinner icon with animate-spin', () => {
    render(<LoadingSpinner delay={0} />)

    const spinner = screen.getByTestId('loading-spinner').querySelector('svg')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { unmount } = render(<LoadingSpinner delay={500} />)

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('should have no accessibility violations when visible', async () => {
    vi.useRealTimers()
    const { container } = render(<LoadingSpinner delay={0} />)

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
