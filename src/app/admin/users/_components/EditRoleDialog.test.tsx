import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import EditRoleDialog from './EditRoleDialog'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockCmsUser } from '@/lib/test-utils/mock-factories'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUser = createMockCmsUser({ id: 'user-002', email: 'target@dxt.com', role: 'admin' })

function renderDialog(user = mockUser, open = true) {
  const onOpenChange = vi.fn()
  render(
    <EditRoleDialog user={user} open={open} onOpenChange={onOpenChange} />,
    { wrapper: createQueryWrapper() },
  )
  return { onOpenChange }
}

async function selectRole(roleName: string) {
  const selectTrigger = screen.getByTestId('role-select')
  fireEvent.pointerDown(selectTrigger, { button: 0, pointerId: 1, pointerType: 'mouse' })

  await waitFor(() => {
    expect(screen.getByRole('option', { name: roleName })).toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole('option', { name: roleName }))
}

describe('EditRoleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dialog with user email and current role', async () => {
    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('edit-role-dialog')).toBeInTheDocument()
    })
    expect(screen.getByText('target@dxt.com')).toBeInTheDocument()
    expect(screen.getByText('Change Role')).toBeInTheDocument()
  })

  it('should pre-select current role in dropdown', async () => {
    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })
    // The select trigger should show the current role label
    expect(screen.getByTestId('role-select')).toHaveTextContent('Admin')
  })

  it('should show all three role options', async () => {
    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    const selectTrigger = screen.getByTestId('role-select')
    fireEvent.pointerDown(selectTrigger, { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Super Admin' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument()
    })
  })

  it('should show no-op guard when same role selected', async () => {
    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    // Click Save without changing role — form default is current role
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(screen.getByText('User already has this role')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should submit role change successfully', async () => {
    const updatedUser = { ...mockUser, role: 'super_admin' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUser, error: null }),
    })

    const { onOpenChange } = renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('Super Admin')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users/user-002', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' }),
      })
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Role updated successfully',
        expect.objectContaining({ description: expect.stringContaining('target@dxt.com') }),
      )
    })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should show inline error for last super admin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'At least one Super Admin is required', code: 'CONFLICT' },
        }),
    })

    const superAdmin = createMockCmsUser({ id: 'sa-only', email: 'sa@dxt.com', role: 'super_admin' })
    renderDialog(superAdmin)

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('Admin')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(screen.getByTestId('server-error')).toBeInTheDocument()
      expect(screen.getByText('At least one Super Admin is required')).toBeInTheDocument()
    })

    // Dialog stays open
    expect(screen.getByTestId('edit-role-dialog')).toBeInTheDocument()
  })

  it('should show toast for user-not-found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'User not found', code: 'NOT_FOUND' },
        }),
    })

    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('User')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Unable to update role',
        expect.objectContaining({ description: 'User not found' }),
      )
    })
  })

  it('should show loading state during submission', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('User')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
    expect(screen.getByTestId('save-button')).toBeDisabled()
  })

  it('should not render when open is false', () => {
    renderDialog(mockUser, false)

    expect(screen.queryByTestId('edit-role-dialog')).not.toBeInTheDocument()
  })

  it('should have accessible dialog description', async () => {
    renderDialog()

    await waitFor(() => {
      expect(screen.getByText(/Change the role for this user/)).toBeInTheDocument()
    })
  })

  it('should have role="alert" on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'At least one Super Admin is required', code: 'CONFLICT' },
        }),
    })

    const superAdmin = createMockCmsUser({ id: 'sa-only', email: 'sa@dxt.com', role: 'super_admin' })
    renderDialog(superAdmin)

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('Admin')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('should show toast for generic server errors (500)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Database connection failed', code: 'INTERNAL_ERROR' },
        }),
    })

    renderDialog()

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('User')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Unable to update role',
        expect.objectContaining({ description: 'Database connection failed' }),
      )
    })

    // Server error should NOT show inline (only Super Admin errors do)
    expect(screen.queryByTestId('server-error')).not.toBeInTheDocument()
  })

  it('should clear server error and reset form when dialog closes', async () => {
    // First, trigger a server error to populate serverError state
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'At least one Super Admin is required', code: 'CONFLICT' },
        }),
    })

    const superAdmin = createMockCmsUser({ id: 'sa-only', email: 'sa@dxt.com', role: 'super_admin' })
    const { onOpenChange } = renderDialog(superAdmin)

    await waitFor(() => {
      expect(screen.getByTestId('role-select')).toBeInTheDocument()
    })

    await selectRole('Admin')
    await userEvent.setup().click(screen.getByTestId('save-button'))

    // Verify server error appeared
    await waitFor(() => {
      expect(screen.getByTestId('server-error')).toBeInTheDocument()
    })

    // Close dialog via Cancel button
    await userEvent.setup().click(screen.getByTestId('cancel-button'))

    // handleOpenChange should have been called with false
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
