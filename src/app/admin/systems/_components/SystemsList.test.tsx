import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
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
    deletedAt: null,
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

  it('should display Visible label and checked Switch when enabled', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ enabled: true })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Visible')).toBeInTheDocument()
    })

    const toggle = screen.getByTestId('toggle-system-f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('data-state', 'checked')
  })

  it('should display Hidden label and unchecked Switch when disabled', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ enabled: false })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Hidden')).toBeInTheDocument()
    })

    const toggle = screen.getByTestId('toggle-system-f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('data-state', 'unchecked')
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

  // =======================
  // Edit button integration (Story 3.3, AC #1)
  // =======================

  it('should display Edit button for each system (AC #1)', async () => {
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
      expect(
        screen.getByTestId('edit-system-f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByTestId('edit-system-a23bc45d-67ef-8901-b234-5c6d7e8f9012'),
    ).toBeInTheDocument()
  })

  it('should have Edit button positioned before status badges', async () => {
    vi.useRealTimers()
    const systems = [createMockSystem({ id: 'test-id', status: 'operational', enabled: true })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-test-id')).toBeInTheDocument()
    })

    // Verify edit button and badges are in the same row
    const row = screen.getByTestId('system-row-test-id')
    expect(row).toContainElement(screen.getByTestId('edit-system-test-id'))
    expect(row).toContainElement(screen.getByText('operational'))
    expect(row).toContainElement(screen.getByText('Visible'))
  })

  it('should render delete button for non-deleted systems (Story 3.4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'active-id', name: 'Active System', deletedAt: null }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('delete-system-active-id')).toBeInTheDocument()
    })
  })

  it('should NOT render delete button for already-deleted systems (Story 3.4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({
        id: 'deleted-id',
        name: 'Deleted System',
        enabled: false,
        deletedAt: '2026-02-05T12:00:00Z',
      }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('system-row-deleted-id')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('delete-system-deleted-id')).not.toBeInTheDocument()
  })

  it('should show "Deleted" badge for soft-deleted systems (Story 3.4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({
        id: 'deleted-id',
        name: 'Deleted System',
        enabled: false,
        deletedAt: '2026-02-05T12:00:00Z',
      }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('deleted-badge-deleted-id')).toBeInTheDocument()
    })

    expect(screen.getByTestId('deleted-badge-deleted-id')).toHaveTextContent('Deleted')
  })

  it('should NOT show "Deleted" badge for non-deleted systems', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'active-id', name: 'Active System', deletedAt: null }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('system-row-active-id')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('deleted-badge-active-id')).not.toBeInTheDocument()
  })

  // =======================
  // Reorder buttons (Story 3.5, AC #1, #4)
  // =======================

  it('should render move up/down buttons for each system (AC #1)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 0 }),
      createMockSystem({ id: 'id-2', name: 'System 2', displayOrder: 1 }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('move-up-id-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('move-down-id-1')).toBeInTheDocument()
    expect(screen.getByTestId('move-up-id-2')).toBeInTheDocument()
    expect(screen.getByTestId('move-down-id-2')).toBeInTheDocument()
  })

  it('should disable move-up button for first system (AC #4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 0 }),
      createMockSystem({ id: 'id-2', name: 'System 2', displayOrder: 1 }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('move-up-id-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('move-up-id-1')).toBeDisabled()
    expect(screen.getByTestId('move-down-id-1')).not.toBeDisabled()
  })

  it('should disable move-down button for last system (AC #4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 0 }),
      createMockSystem({ id: 'id-2', name: 'System 2', displayOrder: 1 }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('move-down-id-2')).toBeInTheDocument()
    })

    expect(screen.getByTestId('move-down-id-2')).toBeDisabled()
    expect(screen.getByTestId('move-up-id-2')).not.toBeDisabled()
  })

  it('should disable both move buttons for deleted systems', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 0, deletedAt: null }),
      createMockSystem({
        id: 'deleted-id',
        name: 'Deleted System',
        displayOrder: 1,
        enabled: false,
        deletedAt: '2026-02-05T12:00:00Z',
      }),
      createMockSystem({ id: 'id-3', name: 'System 3', displayOrder: 2, deletedAt: null }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('move-up-deleted-id')).toBeInTheDocument()
    })

    expect(screen.getByTestId('move-up-deleted-id')).toBeDisabled()
    expect(screen.getByTestId('move-down-deleted-id')).toBeDisabled()
  })

  it('should call reorder mutation when move-down is clicked (AC #1)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 0 }),
      createMockSystem({ id: 'id-2', name: 'System 2', displayOrder: 1 }),
    ]

    // First fetch: load systems
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('move-down-id-1')).toBeInTheDocument()
    })

    // Second fetch: reorder mutation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            createMockSystem({ id: 'id-2', name: 'System 2', displayOrder: 0 }),
            createMockSystem({ id: 'id-1', name: 'System 1', displayOrder: 1 }),
          ],
          error: null,
        }),
    })

    fireEvent.click(screen.getByTestId('move-down-id-1'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/systems/reorder', expect.objectContaining({
        method: 'PATCH',
      }))
    })
  })

  it('should have accessible labels on move buttons', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'ENEOS', displayOrder: 0 }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText('Move ENEOS up')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Move ENEOS down')).toBeInTheDocument()
  })

  // =======================
  // Toggle Switch (Story 3.6, AC #1, #4)
  // =======================

  it('should render toggle Switch for each system', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', enabled: true }),
      createMockSystem({ id: 'id-2', name: 'System 2', enabled: false }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('toggle-system-id-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('toggle-system-id-2')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-system-id-1')).toHaveAttribute('data-state', 'checked')
    expect(screen.getByTestId('toggle-system-id-2')).toHaveAttribute('data-state', 'unchecked')
  })

  it('should disable Switch for soft-deleted systems (AC #4)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({
        id: 'deleted-id',
        name: 'Deleted System',
        enabled: false,
        deletedAt: '2026-02-05T12:00:00Z',
      }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('toggle-system-deleted-id')).toBeInTheDocument()
    })

    expect(screen.getByTestId('toggle-system-deleted-id')).toBeDisabled()
  })

  it('should trigger toggle mutation when Switch is clicked (AC #1)', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'System 1', enabled: true }),
    ]

    // First fetch: load systems
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('toggle-system-id-1')).toBeInTheDocument()
    })

    // Second fetch: toggle mutation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ id: 'id-1', enabled: false }),
          error: null,
        }),
    })

    fireEvent.click(screen.getByTestId('toggle-system-id-1'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/systems/id-1/toggle', expect.objectContaining({
        method: 'PATCH',
      }))
    })
  })

  it('should have accessible label on Switch', async () => {
    vi.useRealTimers()
    const systems = [
      createMockSystem({ id: 'id-1', name: 'ENEOS', enabled: true }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: systems, error: null }),
    })

    render(<SystemsList />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByLabelText('Toggle ENEOS visibility')).toBeInTheDocument()
    })
  })
})
