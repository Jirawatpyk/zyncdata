import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import AddSystemDialog from './AddSystemDialog'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockSystem } from '@/lib/test-utils/mock-factories'

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AddSystemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render trigger button by default', () => {
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    expect(screen.getByTestId('add-system-button')).toBeInTheDocument()
    expect(screen.getByText('Add System')).toBeInTheDocument()
  })

  it('should render custom trigger when provided', () => {
    render(
      <AddSystemDialog
        trigger={<button data-testid="custom-trigger">Custom</button>}
      />,
      { wrapper: createQueryWrapper() },
    )

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument()
    expect(screen.queryByTestId('add-system-button')).not.toBeInTheDocument()
  })

  it('should open dialog when trigger clicked (AC #1)', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
    })
    expect(screen.getByText('Add New System')).toBeInTheDocument()
  })

  it('should show all form fields (AC #1)', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('system-name-input')).toBeInTheDocument()
    })
    expect(screen.getByTestId('system-url-input')).toBeInTheDocument()
    expect(screen.getByTestId('system-description-input')).toBeInTheDocument()
    expect(screen.getByTestId('system-enabled-switch')).toBeInTheDocument()
  })

  it('should show enabled toggle defaulting to true (AC #1)', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      const switchEl = screen.getByTestId('system-enabled-switch')
      expect(switchEl).toHaveAttribute('data-state', 'checked')
    })
  })

  it('should show validation error for empty name (AC #4)', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    // Fill URL but leave name empty
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://example.com',
    )
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Name required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid URL (AC #3)', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    // Fill name and truly invalid URL (even after https:// auto-prepend)
    await user.type(screen.getByTestId('system-name-input'), 'Test System')
    await user.type(screen.getByTestId('system-url-input'), '://missing-host')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Valid URL required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should submit form and close dialog on success (AC #2)', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { toast } = await import('sonner')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ name: 'New System' }),
          error: null,
        }),
    })

    render(<AddSystemDialog onSuccess={onSuccess} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), 'New System')
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://new.example.com',
    )
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('System added', {
        description: 'New System is now available.',
      })
    })

    // Dialog should close
    await waitFor(() => {
      expect(
        screen.queryByTestId('add-system-dialog'),
      ).not.toBeInTheDocument()
    })

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should show error toast on submission failure (AC #5)', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'CREATE_ERROR' },
        }),
    })

    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), 'Fail System')
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://fail.example.com',
    )
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to add system', {
        description: 'Server error',
      })
    })

    // Dialog should stay open on error
    expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()

    // Slow response to verify loading state
    let resolveRequest: (value: unknown) => void
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), 'Loading System')
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://loading.example.com',
    )
    await user.click(screen.getByTestId('submit-button'))

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument()
    })
    expect(screen.getByTestId('submit-button')).toBeDisabled()

    // Resolve the request
    resolveRequest!({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ name: 'Loading System' }),
          error: null,
        }),
    })

    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument()
    })
  })

  it('should close dialog when cancel clicked', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('cancel-button'))

    await waitFor(() => {
      expect(
        screen.queryByTestId('add-system-dialog'),
      ).not.toBeInTheDocument()
    })
  })

  it('should reset form when dialog closes', async () => {
    const user = userEvent.setup()
    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    // Open and fill form
    await user.click(screen.getByTestId('add-system-button'))
    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })
    await user.type(screen.getByTestId('system-name-input'), 'Temp Name')

    // Verify the value was typed
    expect(screen.getByTestId('system-name-input')).toHaveValue('Temp Name')

    // Close dialog via X button or overlay - cancel button keeps form open in some implementations
    // Use the dialog close by pressing escape
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(
        screen.queryByTestId('add-system-dialog'),
      ).not.toBeInTheDocument()
    })

    // Reopen - form should be empty (reset happens on close)
    await user.click(screen.getByTestId('add-system-button'))
    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    // Wait a bit for form.reset() to take effect after reopen
    await waitFor(() => {
      expect(screen.getByTestId('system-name-input')).toHaveValue('')
    })
  })

  it('should allow optional description', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ description: 'A test description' }),
          error: null,
        }),
    })

    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))
    await waitFor(() => {
      expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('system-name-input'), 'With Desc')
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://desc.example.com',
    )
    await user.type(
      screen.getByTestId('system-description-input'),
      'A test description',
    )
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/systems',
        expect.objectContaining({
          body: expect.stringContaining('"description":"A test description"'),
        }),
      )
    })
  })

  it('should toggle enabled state', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ enabled: false }),
          error: null,
        }),
    })

    render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-system-button'))
    await waitFor(() => {
      expect(screen.getByTestId('system-enabled-switch')).toBeInTheDocument()
    })

    // Toggle off
    await user.click(screen.getByTestId('system-enabled-switch'))

    await waitFor(() => {
      expect(screen.getByTestId('system-enabled-switch')).toHaveAttribute(
        'data-state',
        'unchecked',
      )
    })

    // Fill and submit
    await user.type(screen.getByTestId('system-name-input'), 'Disabled')
    await user.type(
      screen.getByTestId('system-url-input'),
      'https://disabled.example.com',
    )
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/systems',
        expect.objectContaining({
          body: expect.stringContaining('"enabled":false'),
        }),
      )
    })
  })

  it('should have no accessibility violations', async () => {
    const user = userEvent.setup()
    const { container } = render(<AddSystemDialog />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(screen.getByTestId('add-system-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  // ===============================================
  // GUARDRAIL TESTS - Error Handling (AC #5)
  // ===============================================

  describe('duplicate name error (409) handling', () => {
    it('should show duplicate name as inline form error', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' },
          }),
      })

      render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

      await user.click(screen.getByTestId('add-system-button'))

      await waitFor(() => {
        expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('system-name-input'), 'Duplicate System')
      await user.type(
        screen.getByTestId('system-url-input'),
        'https://duplicate.example.com',
      )
      await user.click(screen.getByTestId('submit-button'))

      // Duplicate name error shown inline via serverError state
      await waitFor(() => {
        expect(screen.getByText('A system with this name already exists')).toBeInTheDocument()
      })

      // Dialog should stay open so user can change name
      expect(screen.getByTestId('add-system-dialog')).toBeInTheDocument()
    })
  })

  describe('network/timeout handling', () => {
    it('should show generic error for network failure', async () => {
      const user = userEvent.setup()
      const { toast } = await import('sonner')

      // Simulate network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

      await user.click(screen.getByTestId('add-system-button'))

      await waitFor(() => {
        expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('system-name-input'), 'Network Test')
      await user.type(
        screen.getByTestId('system-url-input'),
        'https://network.example.com',
      )
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Unable to add system', {
          description: expect.stringContaining('Network'),
        })
      })
    })

    it('should re-enable submit button after error', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Server error', code: 'CREATE_ERROR' },
          }),
      })

      render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

      await user.click(screen.getByTestId('add-system-button'))

      await waitFor(() => {
        expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('system-name-input'), 'Retry Test')
      await user.type(
        screen.getByTestId('system-url-input'),
        'https://retry.example.com',
      )
      await user.click(screen.getByTestId('submit-button'))

      // Wait for error state - submit button should be re-enabled
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled()
      })

      // Verify submit button shows "Add System" text (not "Adding...")
      // Use within() to scope to the dialog content to avoid matching trigger button
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toHaveTextContent('Add System')
    })
  })

  describe('form field retention on error', () => {
    it('should retain form values after submission error', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' },
          }),
      })

      render(<AddSystemDialog />, { wrapper: createQueryWrapper() })

      await user.click(screen.getByTestId('add-system-button'))

      await waitFor(() => {
        expect(screen.getByTestId('add-system-form')).toBeInTheDocument()
      })

      // Fill form with values
      await user.type(screen.getByTestId('system-name-input'), 'My System Name')
      await user.type(
        screen.getByTestId('system-url-input'),
        'https://mysystem.example.com',
      )
      await user.type(
        screen.getByTestId('system-description-input'),
        'My description',
      )

      await user.click(screen.getByTestId('submit-button'))

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled()
      })

      // Form values should be retained so user can edit
      expect(screen.getByTestId('system-name-input')).toHaveValue('My System Name')
      expect(screen.getByTestId('system-url-input')).toHaveValue('https://mysystem.example.com')
      expect(screen.getByTestId('system-description-input')).toHaveValue('My description')
    })
  })
})
