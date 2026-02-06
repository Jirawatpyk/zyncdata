import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import DeleteSystemDialog from './DeleteSystemDialog'
import { createQueryWrapper } from '@/lib/test-utils'
import type { System } from '@/lib/validations/system'

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createMockSystem(overrides?: Partial<System>): System {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Test System',
    url: 'https://example.com',
    logoUrl: null,
    description: null,
    status: null,
    responseTime: null,
    displayOrder: 0,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    lastCheckedAt: null,
    ...overrides,
  }
}

describe('DeleteSystemDialog', () => {
  const defaultSystem = createMockSystem()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render trigger button by default', () => {
    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    expect(
      screen.getByTestId(`delete-system-${defaultSystem.id}`),
    ).toBeInTheDocument()
  })

  it('should have accessible sr-only label on trigger', () => {
    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    expect(screen.getByText(`Delete ${defaultSystem.name}`)).toHaveClass(
      'sr-only',
    )
  })

  it('should open dialog on trigger click (AC #1)', async () => {
    const user = userEvent.setup()
    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))

    expect(screen.getByTestId('delete-system-dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete System')).toBeInTheDocument()
    expect(
      screen.getByText(
        `Are you sure you want to delete ${defaultSystem.name}? This can be undone within 30 days.`,
      ),
    ).toBeInTheDocument()
  })

  it('should show confirm and cancel buttons (AC #1)', async () => {
    const user = userEvent.setup()
    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))

    expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument()
    expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument()
  })

  it('should close dialog on cancel click (AC #4)', async () => {
    const user = userEvent.setup()
    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))
    expect(screen.getByTestId('delete-system-dialog')).toBeInTheDocument()

    await user.click(screen.getByTestId('delete-cancel-button'))

    await waitFor(() => {
      expect(screen.queryByTestId('delete-system-dialog')).not.toBeInTheDocument()
    })
  })

  it('should call mutation and show success toast on confirm (AC #3)', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    const deletedSystem = createMockSystem({
      enabled: false,
      deletedAt: '2026-02-05T12:00:00Z',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: deletedSystem, error: null }),
    })

    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))
    await user.click(screen.getByTestId('delete-confirm-button'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('System deleted', {
        description: `${defaultSystem.name} can be recovered within 30 days.`,
      })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/systems/${defaultSystem.id}`,
      { method: 'DELETE' },
    )
  })

  it('should show error toast on failure (dialog stays open)', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'DELETE_ERROR' },
        }),
    })

    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))
    await user.click(screen.getByTestId('delete-confirm-button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to delete system', {
        description: 'Server error',
      })
    })

    // Dialog stays open on error
    expect(screen.getByTestId('delete-system-dialog')).toBeInTheDocument()
  })

  it('should show loading state while deleting', async () => {
    const user = userEvent.setup()

    // Never resolve - stay in loading state
    mockFetch.mockReturnValueOnce(new Promise(() => {}))

    render(<DeleteSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))
    await user.click(screen.getByTestId('delete-confirm-button'))

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument()
    })
  })

  it('should show active system warning when status is not offline (AC #2)', async () => {
    const user = userEvent.setup()
    const activeSystem = createMockSystem({ status: 'operational' })

    render(<DeleteSystemDialog system={activeSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${activeSystem.id}`))

    expect(
      screen.getByText('This system is currently active. Proceed with caution.'),
    ).toBeInTheDocument()
  })

  it('should NOT show active system warning when status is null', async () => {
    const user = userEvent.setup()
    const inactiveSystem = createMockSystem({ status: null })

    render(<DeleteSystemDialog system={inactiveSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${inactiveSystem.id}`))

    expect(
      screen.queryByText('This system is currently active. Proceed with caution.'),
    ).not.toBeInTheDocument()
  })

  it('should NOT show active system warning when status is offline', async () => {
    const user = userEvent.setup()
    const offlineSystem = createMockSystem({ status: 'offline' })

    render(<DeleteSystemDialog system={offlineSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`delete-system-${offlineSystem.id}`))

    expect(
      screen.queryByText('This system is currently active. Proceed with caution.'),
    ).not.toBeInTheDocument()
  })

  it('should accept custom trigger', () => {
    render(
      <DeleteSystemDialog
        system={defaultSystem}
        trigger={<button data-testid="custom-trigger">Custom Delete</button>}
      />,
      { wrapper: createQueryWrapper() },
    )

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DeleteSystemDialog system={defaultSystem} />,
      { wrapper: createQueryWrapper() },
    )

    await user.click(screen.getByTestId(`delete-system-${defaultSystem.id}`))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
