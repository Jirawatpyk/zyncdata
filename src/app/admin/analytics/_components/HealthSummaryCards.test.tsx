import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthSummaryCards from './HealthSummaryCards'
import type { HealthDashboardSummary } from '@/lib/validations/health'

const defaultSummary: HealthDashboardSummary = {
  total: 5,
  online: 3,
  offline: 1,
  unknown: 1,
  avgResponseTime: 200,
}

describe('HealthSummaryCards', () => {
  it('renders all four summary cards with correct values', () => {
    render(<HealthSummaryCards summary={defaultSummary} />)

    expect(screen.getByTestId('summary-total')).toHaveTextContent('5')
    expect(screen.getByTestId('summary-online')).toHaveTextContent('3')
    expect(screen.getByTestId('summary-offline')).toHaveTextContent('1')
    expect(screen.getByTestId('summary-avg-response')).toHaveTextContent('200 ms')
  })

  it('renders N/A when avgResponseTime is null', () => {
    render(<HealthSummaryCards summary={{ ...defaultSummary, avgResponseTime: null }} />)

    expect(screen.getByTestId('summary-avg-response')).toHaveTextContent('N/A')
  })

  it('handles zero counts correctly', () => {
    const zeroed: HealthDashboardSummary = {
      total: 0,
      online: 0,
      offline: 0,
      unknown: 0,
      avgResponseTime: null,
    }
    render(<HealthSummaryCards summary={zeroed} />)

    expect(screen.getByTestId('summary-total')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-online')).toHaveTextContent('0')
    expect(screen.getByTestId('summary-offline')).toHaveTextContent('0')
  })

  it('handles all-offline state', () => {
    const allOffline: HealthDashboardSummary = {
      total: 3,
      online: 0,
      offline: 3,
      unknown: 0,
      avgResponseTime: null,
    }
    render(<HealthSummaryCards summary={allOffline} />)

    expect(screen.getByTestId('summary-offline')).toHaveTextContent('3')
    expect(screen.getByTestId('summary-online')).toHaveTextContent('0')
  })

  it('renders the cards container', () => {
    render(<HealthSummaryCards summary={defaultSummary} />)

    expect(screen.getByTestId('health-summary-cards')).toBeInTheDocument()
  })
})
