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

  it('renders "Polling" badge when connectionState is disconnected (default)', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
      />,
    )

    expect(screen.getByText('Polling')).toBeInTheDocument()
  })

  it('renders "Polling" badge when connectionState is explicitly disconnected (6.3)', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState="disconnected"
      />,
    )

    expect(screen.getByText('Polling')).toBeInTheDocument()
  })

  it('renders "Real-time" badge when connectionState is connected (6.1)', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState="connected"
      />,
    )

    expect(screen.getByText('Real-time')).toBeInTheDocument()
  })

  it('renders "Reconnecting..." badge when connectionState is reconnecting (6.2)', () => {
    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState="reconnecting"
      />,
    )

    expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
  })

  it('displays last updated relative time (6.4)', () => {
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

  it('always shows last updated timestamp regardless of connection state (6.4)', () => {
    const states = ['connected', 'reconnecting', 'disconnected'] as const
    const { unmount } = render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState={states[0]}
      />,
    )
    expect(screen.getByTestId('last-updated')).toHaveTextContent(/ago/)
    unmount()

    const { unmount: unmount2 } = render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState={states[1]}
      />,
    )
    expect(screen.getByTestId('last-updated')).toHaveTextContent(/ago/)
    unmount2()

    render(
      <ConnectionStatus
        lastUpdated="2026-01-01T00:04:00Z"
        refetchInterval={60_000}
        connectionState={states[2]}
      />,
    )
    expect(screen.getByTestId('last-updated')).toHaveTextContent(/ago/)
  })
})
