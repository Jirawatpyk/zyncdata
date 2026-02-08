import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { HealthCheck } from '@/lib/validations/health'
import { createMockHealthCheckList } from '@/lib/test-utils/mock-factories'

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

// Mock next/dynamic to render component synchronously
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: () => Promise<{ default: React.ComponentType<{ checks: HealthCheck[]; timeoutThreshold?: number | null }> }>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic mock for tests
    let Comp: React.ComponentType<any> | null = null
    const loadPromise = importFn().then((mod) => { Comp = mod.default })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic mock for tests
    function DynamicWrapper(props: any) {
      if (!Comp) {
        // Force synchronous load in test
        throw loadPromise
      }
      return <Comp {...props} />
    }
    DynamicWrapper.displayName = 'DynamicWrapper'
    return DynamicWrapper
  },
}))

// Import AFTER mocks are set up
import HealthTrendChart from './HealthTrendChart'
import HealthTrendChartInner from './HealthTrendChartInner'

describe('HealthTrendChart', () => {
  it('renders the chart wrapper with heading', () => {
    const checks = createMockHealthCheckList(5)
    render(<HealthTrendChart checks={checks} />)

    expect(screen.getByTestId('health-trend-chart')).toBeInTheDocument()
    expect(screen.getByText('Response Time Trend')).toBeInTheDocument()
  })

  it('renders chart when data is available', () => {
    const checks = createMockHealthCheckList(5)
    render(<HealthTrendChart checks={checks} />)

    expect(screen.getByTestId('health-trend-chart')).toBeInTheDocument()
  })
})

describe('HealthTrendChartInner', () => {
  it('renders empty state when no checks provided', () => {
    render(<HealthTrendChartInner checks={[]} />)

    expect(screen.getByTestId('trend-chart-empty')).toBeInTheDocument()
    expect(screen.getByText('No response time data available.')).toBeInTheDocument()
  })

  it('renders chart container with data', () => {
    const checks = createMockHealthCheckList(5)
    render(<HealthTrendChartInner checks={checks} />)

    expect(screen.getByTestId('trend-chart-container')).toBeInTheDocument()
  })

  it('renders reference line when timeoutThreshold provided', () => {
    const checks = createMockHealthCheckList(3)
    render(<HealthTrendChartInner checks={checks} timeoutThreshold={5000} />)

    expect(screen.getByTestId('reference-line')).toBeInTheDocument()
  })

  it('does not render reference line when timeoutThreshold is null', () => {
    const checks = createMockHealthCheckList(3)
    render(<HealthTrendChartInner checks={checks} timeoutThreshold={null} />)

    expect(screen.queryByTestId('reference-line')).not.toBeInTheDocument()
  })
})
