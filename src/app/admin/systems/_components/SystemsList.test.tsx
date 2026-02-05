import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import SystemsList from './SystemsList'
import { createQueryWrapper } from '@/lib/test-utils'
import type { System } from '@/lib/validations/system'

const mockFetch = vi.fn()
global.fetch = mockFetch

function createMockSystem(overrides?: Partial<System>): System {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Test System',
    url: 'https://example.com',
    logoUrl: null,
    description: null,
    status: 'operational',
    responseTime: 100,
    displayOrder: 0,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('SystemsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render loading spinner initially after delay', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<SystemsList />, { wrapper: createQueryWrapper() })

    // LoadingSpinner has 200ms delay
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render systems list when data loaded', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1' }),
      createMockSystem({ id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012', name: 'System 2' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('systems-list')).toBeInTheDocument()
    })

    expect(
      screen.getByTestId('system-row-f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('system-row-a23bc45d-67ef-8901-b234-5c6d7e8f9012'),
    ).toBeInTheDocument()
    expect(screen.getByText('System 1')).toBeInTheDocument()
    expect(screen.getByText('System 2')).toBeInTheDocument()
  })

  it('should render empty state when no systems', async () => {
    vi.useRealTimers()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('No Systems Yet')).toBeInTheDocument()
    })
    expect(screen.getByTestId('empty-state-add-button')).toBeInTheDocument()
  })

  it('should render error state when fetch fails', async () => {
    vi.useRealTimers()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'FETCH_ERROR' },
        }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('systems-error')).toBeInTheDocument()
    })
  })

  it('should display system URL', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ url: 'https://my-app.com' })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('https://my-app.com')).toBeInTheDocument()
    })
  })

  it('should display enabled badge when enabled', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ enabled: true })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument()
    })
  })

  it('should display disabled badge when disabled', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ enabled: false })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })
  })

  it('should display status badge when status available', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ status: 'degraded' })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('degraded')).toBeInTheDocument()
    })
  })

  it('should have no accessibility violations when loaded', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem()]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    const { container } = render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('systems-list')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should display Add System button when systems exist', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem()]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('add-system-button')).toBeInTheDocument()
    })
  })

  it('should display system count in header', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1' }),
      createMockSystem({ id: 'id-2', name: 'System 2' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('2 systems')).toBeInTheDocument()
    })
  })

  it('should display singular when only 1 system', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem()]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('1 system')).toBeInTheDocument()
    })
  })
})
