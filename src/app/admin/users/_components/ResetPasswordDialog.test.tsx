import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ResetPasswordDialog from './ResetPasswordDialog'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockCmsUser } from '@/lib/test-utils/mock-factories'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockMutateAsync = vi.fn()

vi.mock('@/lib/admin/mutations/users', () => ({
  useResetUserPassword: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

import { useResetUserPassword } from '@/lib/admin/mutations/users'

const defaultUser = createMockCmsUser({ id: 'user-001', email: 'target@dxt.com', role: 'admin' })

describe('ResetPasswordDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render confirmation dialog with user email', () => {
    render(
      <ResetPasswordDialog user={defaultUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    expect(screen.getByTestId('reset-password-dialog')).toBeInTheDocument()
    expect(screen.getByText(/target@dxt.com/)).toBeInTheDocument()
    expect(screen.getByText(/password reset email will be sent/i)).toBeInTheDocument()
  })

  it('should show success toast and close on confirm', async () => {
    mockMutateAsync.mockResolvedValue({ email: 'target@dxt.com' })

    render(
      <ResetPasswordDialog user={defaultUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    fireEvent.click(screen.getByTestId('reset-password-confirm'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('user-001')
    })

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Password reset email sent'),
      expect.objectContaining({ description: expect.stringContaining('target@dxt.com') }),
    )
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show error toast on failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('User not found'))

    render(
      <ResetPasswordDialog user={defaultUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    fireEvent.click(screen.getByTestId('reset-password-confirm'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reset password'),
        expect.objectContaining({ description: 'User not found' }),
      )
    })
  })

  it('should not render when open is false', () => {
    render(
      <ResetPasswordDialog user={defaultUser} open={false} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    expect(screen.queryByTestId('reset-password-dialog')).not.toBeInTheDocument()
  })

  it('should call onOpenChange when cancel is clicked', () => {
    render(
      <ResetPasswordDialog user={defaultUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    fireEvent.click(screen.getByTestId('reset-password-cancel'))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show spinner and disable confirm button when pending', () => {
    // Override mock to simulate pending state
    vi.mocked(useResetUserPassword).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useResetUserPassword>)

    render(
      <ResetPasswordDialog user={defaultUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createQueryWrapper() },
    )

    const confirmButton = screen.getByTestId('reset-password-confirm')
    expect(confirmButton).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()
  })
})
