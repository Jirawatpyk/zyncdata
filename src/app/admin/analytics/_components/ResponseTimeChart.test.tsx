import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResponseTimeChart from './ResponseTimeChart'
import { createMockSystemHealthList } from '@/lib/test-utils/mock-factories'

// Mock next/dynamic to render the inner component synchronously in tests
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Eagerly load the module for testing
    let Component: React.ComponentType | null = null
    const promise = loader()
    promise.then((mod) => {
      Component = mod.default
    })
    // Return a wrapper that shows loading initially
    return function DynamicMock(props: Record<string, unknown>) {
      if (Component) return <Component {...props} />
      return <div data-testid="chart-loading" />
    }
  },
}))

// Mock recharts components to avoid SVG rendering in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}))

describe('ResponseTimeChart', () => {
  it('renders the chart container', () => {
    const systems = createMockSystemHealthList(3)

    render(<ResponseTimeChart systems={systems} />)

    expect(screen.getByTestId('response-time-chart')).toBeInTheDocument()
  })

  it('handles empty systems array', () => {
    render(<ResponseTimeChart systems={[]} />)

    expect(screen.getByTestId('response-time-chart')).toBeInTheDocument()
  })
})
