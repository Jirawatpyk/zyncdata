import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpdatePasswordPage from './page'

const mockUpdateUser = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
  }),
}))

const mockRouterReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}))

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Default: no session, no event
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render password form when session exists from recovery', async () => {
    // Simulate PASSWORD_RECOVERY event
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('should render password form when getSession returns recovery session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-001' } } },
      error: null,
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })
  })

  it('should show validation errors for short password', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(screen.getByLabelText(/new password/i), '12345')
    await user.type(screen.getByLabelText(/confirm password/i), '12345')
    await user.click(screen.getByTestId('update-password-submit'))

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should show mismatch error for non-matching passwords', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(screen.getByLabelText(/new password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different456')
    await user.click(screen.getByTestId('update-password-submit'))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should call updateUser and show success on valid submit', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123')
    await user.click(screen.getByTestId('update-password-submit'))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    })

    expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument()
  })

  it('should show error when updateUser fails', async () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback('PASSWORD_RECOVERY')
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Password too weak' },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123')
    await user.click(screen.getByTestId('update-password-submit'))

    await waitFor(() => {
      expect(screen.getByText(/password too weak/i)).toBeInTheDocument()
    })
  })

  it('should redirect to login when no session after timeout', async () => {
    render(<UpdatePasswordPage />)

    // Advance timer past the session timeout
    vi.advanceTimersByTime(4000)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/auth/login?error=session_expired')
    })
  })
})
