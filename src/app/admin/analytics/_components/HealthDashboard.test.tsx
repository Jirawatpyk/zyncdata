import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import HealthDashboard from './HealthDashboard'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockHealthDashboard, createMockSystemHealth } from '@/lib/test-utils/mock-factories'

// Mock next/dynamic to render synchronously
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    let Component: React.ComponentType | null = null
    const promise = loader()
    promise.then((mod) => {
      Component = mod.default
    })
    return function DynamicMock(props: Record<string, unknown>) {
      if (Component) return <Component {...props} />
      return <div data-testid="chart-loading" />
    }
  },
}))

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}))

// Mock useHealthMonitor hook
const mockConnectionState = vi.fn().mockReturnValue('disconnected')
vi.mock('@/lib/hooks/useHealthMonitor', () => ({
  useHealthMonitor: () => ({ connectionState: mockConnectionState() }),
}))

let mockFetch: ReturnType<typeof vi.fn>

describe('HealthDashboard', () => {
  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.useFakeTimers()
    mockConnectionState.mockReturnValue('disconnected')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders loading skeleton initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument()
  })

  it('renders full dashboard with summary cards, table, and chart', async () => {
    vi.useRealTimers()
    const data = createMockHealthDashboard()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    // Summary cards
    expect(screen.getByTestId('health-summary-cards')).toBeInTheDocument()
    expect(screen.getByTestId('summary-total')).toHaveTextContent('3')

    // Table
    expect(screen.getByTestId('health-table')).toBeInTheDocument()

    // Chart container
    expect(screen.getByTestId('response-time-chart')).toBeInTheDocument()

    // Connection status
    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    expect(screen.getByText('Polling')).toBeInTheDocument()
  })

  it('renders error state when API fails', async () => {
    vi.useRealTimers()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ data: null, error: { message: 'Error', code: 'FETCH_ERROR' } }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to load health data/)).toBeInTheDocument()
  })

  it('renders empty table when no systems', async () => {
    vi.useRealTimers()
    const data = createMockHealthDashboard({ systems: [] })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    expect(screen.getByTestId('health-table-empty')).toBeInTheDocument()
  })

  it('highlights offline systems in table', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystemHealth({ id: 'off-1', name: 'Down', status: 'offline', responseTime: null }),
      createMockSystemHealth({ id: 'on-1', name: 'Up', status: 'online', responseTime: 100 }),
    ]
    const data = createMockHealthDashboard({ systems })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    const offlineRow = screen.getByTestId('health-row-off-1')
    expect(offlineRow.className).toContain('bg-red-50')
  })

  // Task 7 tests: useHealthMonitor integration

  it('calls useHealthMonitor hook on mount (7.1)', async () => {
    vi.useRealTimers()
    const data = createMockHealthDashboard()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    // The mock was called — proves hook is invoked on mount
    expect(mockConnectionState).toHaveBeenCalled()
  })

  it('passes connected state to ConnectionStatus (7.2)', async () => {
    vi.useRealTimers()
    mockConnectionState.mockReturnValue('connected')
    const data = createMockHealthDashboard()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Real-time')).toBeInTheDocument()
  })

  it('passes reconnecting state to ConnectionStatus (7.2)', async () => {
    vi.useRealTimers()
    mockConnectionState.mockReturnValue('reconnecting')
    const data = createMockHealthDashboard()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
  })

  it('shows Polling badge when disconnected (default state) (7.2)', async () => {
    vi.useRealTimers()
    mockConnectionState.mockReturnValue('disconnected')
    const data = createMockHealthDashboard()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data, error: null }),
    })

    render(<HealthDashboard />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('health-dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Polling')).toBeInTheDocument()
  })
})
