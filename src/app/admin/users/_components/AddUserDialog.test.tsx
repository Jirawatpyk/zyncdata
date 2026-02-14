import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddUserDialog from './AddUserDialog'
import { createQueryWrapper } from '@/lib/test-utils'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

/**
 * Helper: open dialog, fill email, and select role.
 * Uses fireEvent for Radix Select (JSDOM pointer-events limitation).
 */
async function openDialogAndFillForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  selectRole = true,
) {
  await user.click(screen.getByTestId('add-user-button'))

  await waitFor(() => {
    expect(screen.getByTestId('user-email-input')).toBeInTheDocument()
  })

  if (email) {
    await user.type(screen.getByTestId('user-email-input'), email)
  }

  if (selectRole) {
    // Radix Select in Dialog has pointer-events issues in JSDOM.
    // Use fireEvent to bypass JSDOM viewport/pointer limitations.
    const selectTrigger = screen.getByTestId('user-role-select')
    fireEvent.pointerDown(selectTrigger, { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      const adminOption = screen.getByRole('option', { name: 'Admin' })
      expect(adminOption).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('option', { name: 'Admin' }))
  }
}

describe('AddUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render trigger button', () => {
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    expect(screen.getByTestId('add-user-button')).toBeInTheDocument()
    expect(screen.getByText('Add User')).toBeInTheDocument()
  })

  it('should open dialog when trigger clicked (AC #2)', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-user-dialog')).toBeInTheDocument()
    })
    expect(screen.getByText('Add New User')).toBeInTheDocument()
  })

  it('should show email and role fields (AC #2)', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByTestId('user-email-input')).toBeInTheDocument()
    })
    expect(screen.getByTestId('user-role-select')).toBeInTheDocument()
  })

  it('should show validation error for empty email (AC #6)', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByTestId('add-user-form')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show validation error for missing role (AC #6)', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByTestId('user-email-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('user-email-input'), 'valid@dxt.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Role is required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid email (AC #6)', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByTestId('user-email-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('user-email-input'), 'not-an-email')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Valid email address required')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should submit successfully and close dialog (AC #3)', async () => {
    const user = userEvent.setup()
    const createdUser = {
      id: 'new-id',
      email: 'new@dxt.com',
      role: 'admin',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-14T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: createdUser, error: null }),
    })

    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await openDialogAndFillForm(user, 'new@dxt.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@dxt.com', role: 'admin' }),
      })
    })
  })

  it('should show inline error for duplicate email (AC #5)', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'A user with this email already exists', code: 'CONFLICT' },
        }),
    })

    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await openDialogAndFillForm(user, 'dup@dxt.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('server-error')).toBeInTheDocument()
      expect(screen.getByText('A user with this email already exists')).toBeInTheDocument()
    })

    // Dialog should stay open
    expect(screen.getByTestId('add-user-dialog')).toBeInTheDocument()
  })

  it('should show loading state during submission (AC #10)', async () => {
    const user = userEvent.setup()

    // Slow fetch that never resolves
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await openDialogAndFillForm(user, 'test@dxt.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
    expect(screen.getByTestId('submit-button')).toBeDisabled()
  })

  it('should have accessible dialog description', async () => {
    const user = userEvent.setup()
    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('add-user-button'))

    await waitFor(() => {
      expect(screen.getByText(/Create a CMS user account/)).toBeInTheDocument()
    })
  })

  it('should have role="alert" on server error', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'A user with this email already exists', code: 'CONFLICT' },
        }),
    })

    render(<AddUserDialog />, { wrapper: createQueryWrapper() })

    await openDialogAndFillForm(user, 'dup@dxt.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      const errorEl = screen.getByRole('alert')
      expect(errorEl).toBeInTheDocument()
    })
  })
})
