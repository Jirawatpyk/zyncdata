import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConnectionStatus from './ConnectionStatus'

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:05:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders polling badge', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
      />,
    )

    expect(screen.getByText('Polling')).toBeInTheDocument()
  })

  it('displays last updated relative time', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
      />,
    )

    expect(screen.getByTestId('last-updated')).toHaveTextContent(/ago/)
  })

  it('shows auto-refresh interval', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
      />,
    )

    expect(screen.getByTestId('refresh-interval')).toHaveTextContent('auto-refresh every 60s')
  })

  it('renders connection status container', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
      />,
    )

    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
  })
})
