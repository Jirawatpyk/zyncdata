import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SystemsHealthTable from './SystemsHealthTable'
import { createMockSystemHealth, createMockSystemHealthList } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/admin/queries/health', () => ({
  systemHealthConfigQueryOptions: vi.fn((systemId: string) => ({
    queryKey: ['admin', 'health', 'config', systemId],
    queryFn: vi.fn(),
    enabled: false,
  })),
  healthHistoryQueryOptions: vi.fn((systemId: string, filters: Record<string, unknown>) => ({
    queryKey: ['admin', 'health', 'history', systemId, filters],
    queryFn: vi.fn(),
    enabled: false,
  })),
}))

vi.mock('@/lib/admin/mutations/health', () => ({
  useUpdateHealthConfig: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('SystemsHealthTable', () => {
  it('renders systems with name, status badge, response time, and last checked', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Alpha', status: 'online', responseTime: 120, lastCheckedAt: '2026-01-01T00:00:00Z' }),
      createMockSystemHealth({ id: '2', name: 'Beta', status: 'offline', responseTime: null, lastCheckedAt: '2026-01-01T00:00:00Z' }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('120 ms')).toBeInTheDocument()
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('renders status badges for each system', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Online Sys', status: 'online' }),
      createMockSystemHealth({ id: '2', name: 'Offline Sys', status: 'offline' }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('highlights offline rows with red background', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Down', status: 'offline' }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    const row = screen.getByTestId('health-row-1')
    expect(row.className).toContain('bg-destructive/10')
  })

  it('shows empty state when no systems', () => {
    render(<SystemsHealthTable systems={[]} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-table-empty')).toBeInTheDocument()
    expect(screen.getByText('No systems found.')).toBeInTheDocument()
  })

  it('shows "Never" when lastCheckedAt is null', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Unchecked', lastCheckedAt: null }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('renders table with correct structure including History and Config columns', () => {
    const systems = createMockSystemHealthList(3)

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-table')).toBeInTheDocument()
    // Header columns
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Response Time')).toBeInTheDocument()
    expect(screen.getByText('Last Checked')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Config')).toBeInTheDocument()
  })

  it('renders config values with (default) suffix for null values', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Default Config', checkInterval: null, timeoutThreshold: null, failureThreshold: null }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByText(/60s \(default\)/)).toBeInTheDocument()
    expect(screen.getByText(/10000ms \(default\)/)).toBeInTheDocument()
    expect(screen.getByText(/3 failures \(default\)/)).toBeInTheDocument()
  })

  it('renders custom config values without (default) suffix', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Custom Config', checkInterval: 120, timeoutThreshold: 5000, failureThreshold: 5 }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByText(/120s/)).toBeInTheDocument()
    expect(screen.getByText(/5000ms/)).toBeInTheDocument()
    expect(screen.getByText(/5 failures/)).toBeInTheDocument()
  })

  it('renders history icon button for each system', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'System A' }),
      createMockSystemHealth({ id: '2', name: 'System B' }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-history-trigger-1')).toBeInTheDocument()
    expect(screen.getByTestId('health-history-trigger-2')).toBeInTheDocument()
  })

  it('renders settings gear icon for each system', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'System A' }),
      createMockSystemHealth({ id: '2', name: 'System B' }),
    ]

    render(<SystemsHealthTable systems={systems} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('health-config-trigger-1')).toBeInTheDocument()
    expect(screen.getByTestId('health-config-trigger-2')).toBeInTheDocument()
  })
})
