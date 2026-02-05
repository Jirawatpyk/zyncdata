import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import EditSystemDialog from './EditSystemDialog'
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
    description: 'Original description',
    status: null,
    responseTime: null,
    displayOrder: 0,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    ...overrides,
  }
}

describe('EditSystemDialog', () => {
  const defaultSystem = createMockSystem()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render trigger button by default', () => {
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    expect(
      screen.getByTestId(`edit-system-${defaultSystem.id}`),
    ).toBeInTheDocument()
  })

  it('should render custom trigger when provided', () => {
    render(
      <EditSystemDialog
        system={defaultSystem}
        trigger={<button data-testid="custom-trigger">Edit</button>}
      />,
      { wrapper: createQueryWrapper() },
    )

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument()
    expect(
      screen.queryByTestId(`edit-system-${defaultSystem.id}`),
    ).not.toBeInTheDocument()
  })

  it('should have accessible trigger with sr-only text', () => {
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    const trigger = screen.getByTestId(`edit-system-${defaultSystem.id}`)
    expect(trigger).toHaveTextContent(`Edit ${defaultSystem.name}`)
  })

  // =======================
  // AC #1: Pre-populated form
  // =======================

  it('should open dialog with pre-populated form (AC #1)', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-dialog')).toBeInTheDocument()
    })
    expect(screen.getByText('Edit System')).toBeInTheDocument()

    // Verify pre-populated values
    expect(screen.getByTestId('system-name-input')).toHaveValue(
      defaultSystem.name,
    )
    expect(screen.getByTestId('system-url-input')).toHaveValue(defaultSystem.url)
    expect(screen.getByTestId('system-description-input')).toHaveValue(
      defaultSystem.description,
    )
    expect(screen.getByTestId('system-enabled-switch')).toHaveAttribute(
      'data-state',
      'checked',
    )
  })

  it('should pre-populate form with disabled system (AC #1)', async () => {
    const user = userEvent.setup()
    const disabledSystem = createMockSystem({ enabled: false })

    render(<EditSystemDialog system={disabledSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${disabledSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('system-enabled-switch')).toHaveAttribute(
        'data-state',
        'unchecked',
      )
    })
  })

  it('should handle null description correctly (AC #1)', async () => {
    const user = userEvent.setup()
    const systemNoDesc = createMockSystem({ description: null })

    render(<EditSystemDialog system={systemNoDesc} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${systemNoDesc.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('system-description-input')).toHaveValue('')
    })
  })

  // =======================
  // AC #3: Validation errors
  // =======================

  it('should show validation error when name cleared (AC #3)', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    // Clear the name
    await user.clear(screen.getByTestId('system-name-input'))
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Name required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid URL (AC #3)', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    // Clear URL and type invalid
    await user.clear(screen.getByTestId('system-url-input'))
    await user.type(screen.getByTestId('system-url-input'), 'not-a-valid-url')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Valid URL required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // =======================
  // AC #5: Save button disabled when no changes
  // =======================

  it('should have submit button disabled when no changes made (AC #5)', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    // Button should be disabled when isDirty = false
    expect(screen.getByTestId('submit-button')).toBeDisabled()
  })

  it('should enable submit button after field modification (AC #5)', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    // Make a change
    await user.type(screen.getByTestId('system-name-input'), ' Updated')

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  // =======================
  // AC #2: Submit and success
  // =======================

  it('should submit form and close dialog on success (AC #2)', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { toast } = await import('sonner')

    const updatedSystem = createMockSystem({
      name: 'Updated Name',
      updatedAt: '2026-02-05T15:00:00Z',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    render(<EditSystemDialog system={defaultSystem} onSuccess={onSuccess} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    // Modify name
    await user.clear(screen.getByTestId('system-name-input'))
    await user.type(screen.getByTestId('system-name-input'), 'Updated Name')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('System updated', {
        description: 'Updated Name has been updated.',
      })
    })

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId('edit-system-dialog')).not.toBeInTheDocument()
    })

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should call PATCH with correct URL and body', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: createMockSystem(), error: null }),
    })

    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    // Modify fields
    await user.clear(screen.getByTestId('system-name-input'))
    await user.type(screen.getByTestId('system-name-input'), 'New Name')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/systems/${defaultSystem.id}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"name":"New Name"'),
        }),
      )
    })
  })

  // =======================
  // Error handling
  // =======================

  it('should show error toast on submission failure', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'UPDATE_ERROR' },
        }),
    })

    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), ' Changed')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to update system', {
        description: 'Server error',
      })
    })

    // Dialog should stay open on error
    expect(screen.getByTestId('edit-system-dialog')).toBeInTheDocument()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()

    let resolveRequest: (value: unknown) => void
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), ' Loading')
    await user.click(screen.getByTestId('submit-button'))

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
    expect(screen.getByTestId('submit-button')).toBeDisabled()

    // Resolve the request
    resolveRequest!({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem(),
          error: null,
        }),
    })

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })

  // =======================
  // Form reset behavior
  // =======================

  it('should reset form to original values on cancel/close', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    // Open and modify form
    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))
    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    await user.clear(screen.getByTestId('system-name-input'))
    await user.type(screen.getByTestId('system-name-input'), 'Modified Name')

    // Close dialog via cancel
    await user.click(screen.getByTestId('cancel-button'))
    await waitFor(() => {
      expect(screen.queryByTestId('edit-system-dialog')).not.toBeInTheDocument()
    })

    // Reopen - form should have original values
    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))
    await waitFor(() => {
      expect(screen.getByTestId('system-name-input')).toHaveValue(
        defaultSystem.name,
      )
    })
  })

  it('should reset form to original values on escape', async () => {
    const user = userEvent.setup()
    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    // Open and modify
    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))
    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    await user.clear(screen.getByTestId('system-url-input'))
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://modified.com',
    )

    // Close with escape
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByTestId('edit-system-dialog')).not.toBeInTheDocument()
    })

    // Reopen - URL should be original
    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))
    await waitFor(() => {
      expect(screen.getByTestId('system-url-input')).toHaveValue(
        defaultSystem.url,
      )
    })
  })

  // =======================
  // Duplicate name error (409)
  // =======================

  it('should show duplicate name error in toast', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: {
            message: 'A system with this name already exists',
            code: 'DUPLICATE_NAME',
          },
        }),
    })

    render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-form')).toBeInTheDocument()
    })

    await user.clear(screen.getByTestId('system-name-input'))
    await user.type(screen.getByTestId('system-name-input'), 'Duplicate Name')
    await user.click(screen.getByTestId('submit-button'))

    // Duplicate name error shown inline via serverError state (survives form resets)
    await waitFor(() => {
      expect(screen.getByText('A system with this name already exists')).toBeInTheDocument()
    })

    // Dialog stays open
    expect(screen.getByTestId('edit-system-dialog')).toBeInTheDocument()
  })

  // =======================
  // Accessibility
  // =======================

  it('should have no accessibility violations', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditSystemDialog system={defaultSystem} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId(`edit-system-${defaultSystem.id}`))

    await waitFor(() => {
      expect(screen.getByTestId('edit-system-dialog')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
