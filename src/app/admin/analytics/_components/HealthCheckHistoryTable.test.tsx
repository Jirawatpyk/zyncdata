import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HealthCheckHistoryTable from './HealthCheckHistoryTable'
import { createMockHealthCheckList, createMockHealthCheck } from '@/lib/test-utils/mock-factories'

const defaultProps = {
  checks: createMockHealthCheckList(3),
  total: 50,
  hasMore: true,
  isLoadingMore: false,
  statusFilter: undefined as 'success' | 'failure' | undefined,
  onStatusFilterChange: vi.fn(),
  onLoadMore: vi.fn(),
}

describe('HealthCheckHistoryTable', () => {
  it('renders table with health check records', () => {
    render(<HealthCheckHistoryTable {...defaultProps} />)

    expect(screen.getByTestId('health-history-table')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Response Time')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Timestamp')).toBeInTheDocument()
  })

  it('displays record count', () => {
    render(<HealthCheckHistoryTable {...defaultProps} />)

    expect(screen.getByTestId('record-count')).toHaveTextContent('Showing 3 of 50')
  })

  it('renders filter buttons', () => {
    render(<HealthCheckHistoryTable {...defaultProps} />)

    expect(screen.getByTestId('filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-success')).toBeInTheDocument()
    expect(screen.getByTestId('filter-failure')).toBeInTheDocument()
  })

  it('calls onStatusFilterChange when filter clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HealthCheckHistoryTable {...defaultProps} onStatusFilterChange={onChange} />)

    await user.click(screen.getByTestId('filter-failure'))

    expect(onChange).toHaveBeenCalledWith('failure')
  })

  it('renders Load More button when hasMore is true', () => {
    render(<HealthCheckHistoryTable {...defaultProps} />)

    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument()
    expect(screen.getByTestId('load-more-btn')).toHaveTextContent('Load More')
  })

  it('hides Load More button when hasMore is false', () => {
    render(<HealthCheckHistoryTable {...defaultProps} hasMore={false} />)

    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument()
  })

  it('calls onLoadMore when Load More clicked', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    render(<HealthCheckHistoryTable {...defaultProps} onLoadMore={onLoadMore} />)

    await user.click(screen.getByTestId('load-more-btn'))

    expect(onLoadMore).toHaveBeenCalled()
  })

  it('shows loading state on Load More button', () => {
    render(<HealthCheckHistoryTable {...defaultProps} isLoadingMore={true} />)

    expect(screen.getByTestId('load-more-btn')).toHaveTextContent('Loading...')
    expect(screen.getByTestId('load-more-btn')).toBeDisabled()
  })

  it('renders empty state when no records', () => {
    render(<HealthCheckHistoryTable {...defaultProps} checks={[]} total={0} hasMore={false} />)

    expect(screen.getByTestId('history-table-empty')).toBeInTheDocument()
    expect(screen.getByText('No records match your filter.')).toBeInTheDocument()
  })

  it('displays response time for success checks', () => {
    const checks = [createMockHealthCheck({ id: 'c1', responseTime: 234, status: 'success' })]
    render(<HealthCheckHistoryTable {...defaultProps} checks={checks} />)

    expect(screen.getByText('234 ms')).toBeInTheDocument()
  })

  it('displays dash for null response time', () => {
    const checks = [createMockHealthCheck({ id: 'c1', responseTime: null, status: 'failure', errorMessage: 'Timeout' })]
    render(<HealthCheckHistoryTable {...defaultProps} checks={checks} />)

    expect(screen.getByText('Timeout')).toBeInTheDocument()
  })

  it('highlights failure rows with destructive background', () => {
    const checks = [createMockHealthCheck({ id: 'c1', status: 'failure' })]
    render(<HealthCheckHistoryTable {...defaultProps} checks={checks} />)

    const row = screen.getByTestId('history-row-c1')
    expect(row.className).toContain('bg-destructive/10')
  })

  it('shows Pass badge for success and Fail badge for failure', () => {
    const checks = [
      createMockHealthCheck({ id: 'c1', status: 'success' }),
      createMockHealthCheck({ id: 'c2', status: 'failure' }),
    ]
    render(<HealthCheckHistoryTable {...defaultProps} checks={checks} />)

    expect(screen.getByText('Pass')).toBeInTheDocument()
    expect(screen.getByText('Fail')).toBeInTheDocument()
  })
})
