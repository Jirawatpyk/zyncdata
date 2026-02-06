import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import RelativeTime from '@/components/patterns/RelativeTime'

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-07T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render "Never checked" when lastCheckedAt is null', () => {
    render(<RelativeTime lastCheckedAt={null} />)
    expect(screen.getByText('Never checked')).toBeDefined()
  })

  it('should render relative time for valid timestamp', () => {
    render(<RelativeTime lastCheckedAt="2026-02-07T11:55:00.000Z" />)
    expect(screen.getByText('Last checked: 5 minutes ago')).toBeDefined()
  })

  it('should render "just now" for very recent timestamp', () => {
    render(<RelativeTime lastCheckedAt="2026-02-07T11:59:55.000Z" />)
    expect(screen.getByText('Last checked: just now')).toBeDefined()
  })

  it('should include aria-label with time text', () => {
    render(<RelativeTime lastCheckedAt="2026-02-07T11:55:00.000Z" />)
    const el = screen.getByLabelText('Last checked: 5 minutes ago')
    expect(el).toBeDefined()
  })

  it('should include aria-label for null timestamp', () => {
    render(<RelativeTime lastCheckedAt={null} />)
    const el = screen.getByLabelText('Last checked: Never checked')
    expect(el).toBeDefined()
  })

  it('should auto-refresh after 60 seconds', () => {
    render(<RelativeTime lastCheckedAt="2026-02-07T11:55:00.000Z" />)
    expect(screen.getByText('Last checked: 5 minutes ago')).toBeDefined()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('Last checked: 6 minutes ago')).toBeDefined()
  })

  it('should NOT set interval when lastCheckedAt is null', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    render(<RelativeTime lastCheckedAt={null} />)
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<RelativeTime lastCheckedAt="2026-02-07T11:55:00.000Z" />)
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
