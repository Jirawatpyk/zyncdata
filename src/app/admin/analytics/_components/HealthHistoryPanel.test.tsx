import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HealthHistoryPanel from './HealthHistoryPanel'
import { healthHistoryQueryOptions } from '@/lib/admin/queries/health'

vi.mock('@/lib/admin/queries/health', () => ({
  healthHistoryQueryOptions: vi.fn((systemId: string, filters: Record<string, unknown>) => ({
    queryKey: ['admin', 'health', 'history', systemId, filters],
    queryFn: vi.fn(),
    enabled: false,
  })),
}))

// Mock child components to isolate panel testing
vi.mock('./HealthCheckHistoryTable', () => ({
  __esModule: true,
  default: (props: { checks: unknown[]; total: number }) => (
    <div data-testid="mock-history-table">
      Table: {props.checks.length} checks, {props.total} total
    </div>
  ),
}))

vi.mock('./HealthTrendChart', () => ({
  __esModule: true,
  default: (props: { checks: unknown[] }) => (
    <div data-testid="mock-trend-chart">
      Chart: {props.checks.length} checks
    </div>
  ),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('HealthHistoryPanel', () => {
  const defaultProps = {
    systemId: 'sys-1',
    systemName: 'Test System',
    systemStatus: 'online' as const,
    timeoutThreshold: null,
  }

  it('renders trigger button with history icon', () => {
    render(<HealthHistoryPanel {...defaultProps} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-history-trigger-sys-1')).toBeInTheDocument()
    expect(screen.getByText('View health history for Test System')).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<HealthHistoryPanel {...defaultProps} />, { wrapper: createWrapper() })

    await user.click(screen.getByTestId('health-history-trigger-sys-1'))

    expect(screen.getByTestId('health-history-dialog')).toBeInTheDocument()
    expect(screen.getByText('Health History: Test System')).toBeInTheDocument()
  })

  it('shows loading skeleton while query is pending', async () => {
    // Override mock to return a never-resolving queryFn so isPending stays true
    vi.mocked(healthHistoryQueryOptions).mockReturnValue({
      queryKey: ['admin', 'health', 'history', 'sys-1', { limit: 20, offset: 0 }],
      queryFn: () => new Promise(() => {}), // never resolves
    } as unknown as ReturnType<typeof healthHistoryQueryOptions>)

    const user = userEvent.setup()
    render(<HealthHistoryPanel {...defaultProps} />, { wrapper: createWrapper() })

    await user.click(screen.getByTestId('health-history-trigger-sys-1'))

    expect(screen.getByTestId('health-history-loading')).toBeInTheDocument()
  })

  it('displays system name in dialog title', async () => {
    const user = userEvent.setup()
    render(<HealthHistoryPanel {...defaultProps} systemName="Production API" />, { wrapper: createWrapper() })

    await user.click(screen.getByTestId('health-history-trigger-sys-1'))

    expect(screen.getByText('Health History: Production API')).toBeInTheDocument()
  })
})
