import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import MfaVerifyForm from './MfaVerifyForm'

// Mock browser client (supabase.auth.mfa.listFactors)
const mockListFactors = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      mfa: {
        listFactors: (...args: unknown[]) => mockListFactors(...args),
      },
    },
  }),
}))

// Mock mutations
const mockVerifyMfaEnrollment = vi.fn()

vi.mock('@/lib/auth/mutations', () => ({
  verifyMfaEnrollment: (...args: unknown[]) => mockVerifyMfaEnrollment(...args),
}))

// Mock server action
const mockVerifyMfaEnrollmentAction = vi.fn()

vi.mock('@/lib/actions/mfa', () => ({
  verifyMfaEnrollmentAction: (...args: unknown[]) => mockVerifyMfaEnrollmentAction(...args),
}))

// Mock BackupCodeVerifyForm
const mockBackupCodeOnSuccess = vi.fn()

vi.mock('./BackupCodeVerifyForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => {
    mockBackupCodeOnSuccess.mockImplementation(onSuccess)
    return (
      <div data-testid="backup-code-verify-form">
        <button
          type="button"
          data-testid="mock-backup-success"
          onClick={onSuccess}
        >
          Mock Backup Success
        </button>
      </div>
    )
  },
}))

// Mock next/navigation
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const mockTotpFactors = {
  data: {
    totp: [{ id: 'factor-123', factor_type: 'totp', status: 'verified' }],
    phone: [],
  },
  error: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockListFactors.mockResolvedValue(mockTotpFactors)
  mockVerifyMfaEnrollmentAction.mockResolvedValue({ error: null, rateLimited: false })
  mockVerifyMfaEnrollment.mockResolvedValue({ user: { id: 'u1' }, session: {} })
})

describe('MfaVerifyForm', () => {
  describe('TOTP mode rendering', () => {
    it('should render 6-digit TOTP input on mount', async () => {
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      const input = screen.getByTestId('mfa-verify-code-input')
      expect(input).toHaveAttribute('inputMode', 'numeric')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
      expect(input).toHaveAttribute('autoComplete', 'one-time-code')
      expect(input).toHaveAttribute('maxLength', '6')
    })

    it('should display "Verify Your Identity" heading and description', async () => {
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeInTheDocument()
      })

      expect(
        screen.getByText('Enter the 6-digit code from your authenticator app'),
      ).toBeInTheDocument()
    })

    it('should render submit button with "Verify" text', async () => {
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-submit')).toBeInTheDocument()
      })

      expect(screen.getByTestId('mfa-verify-submit')).toHaveTextContent('Verify')
    })

    it('should render "Use backup code" toggle button', async () => {
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-toggle-backup')).toBeInTheDocument()
      })

      expect(screen.getByTestId('mfa-verify-toggle-backup')).toHaveTextContent('Use backup code')
    })
  })

  describe('TOTP verification flow', () => {
    it('should submit TOTP code via server action then client mutation', async () => {
      const user = userEvent.setup()
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockVerifyMfaEnrollmentAction).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith('factor-123', '123456')
      })
    })

    it('should redirect to /dashboard on successful TOTP verification', async () => {
      const user = userEvent.setup()
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display error on invalid TOTP code (client verify failure)', async () => {
      const user = userEvent.setup()
      mockVerifyMfaEnrollment.mockRejectedValueOnce(new Error('Invalid TOTP code'))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '000000')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toBeInTheDocument()
      })
      expect(screen.getByText('Invalid or expired code')).toBeInTheDocument()
    })

    it('should display rate limit message with amber styling', async () => {
      const user = userEvent.setup()
      mockVerifyMfaEnrollmentAction.mockResolvedValue({
        error: 'Too many attempts. Please try again later.',
        rateLimited: true,
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toBeInTheDocument()
      })

      const errorEl = screen.getByTestId('mfa-verify-error')
      expect(errorEl).toHaveTextContent('Too many attempts. Please try again later.')
      expect(errorEl).toHaveClass('border-amber-200', 'bg-amber-50', 'text-amber-800')
    })

    it('should NOT call client mutation when server action returns error', async () => {
      const user = userEvent.setup()
      mockVerifyMfaEnrollmentAction.mockResolvedValue({
        error: 'Code must be 6 digits',
        rateLimited: false,
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '12')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toBeInTheDocument()
      })

      expect(mockVerifyMfaEnrollment).not.toHaveBeenCalled()
    })
  })

  describe('mode toggle', () => {
    it('should toggle to BackupCodeVerifyForm when "Use backup code" is clicked', async () => {
      const user = userEvent.setup()
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-toggle-backup')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('mfa-verify-toggle-backup'))

      expect(screen.getByTestId('backup-code-verify-form')).toBeInTheDocument()
      expect(screen.getByTestId('mfa-verify-backup-mode')).toBeInTheDocument()
    })

    it('should toggle back to TOTP when "Back to authenticator" is clicked', async () => {
      const user = userEvent.setup()
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-toggle-backup')).toBeInTheDocument()
      })

      // Switch to backup mode
      await user.click(screen.getByTestId('mfa-verify-toggle-backup'))
      expect(screen.getByTestId('backup-code-verify-form')).toBeInTheDocument()

      // Switch back to TOTP mode
      await user.click(screen.getByTestId('mfa-verify-toggle-totp'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })
      expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
    })
  })

  describe('backup code success', () => {
    it('should redirect to /dashboard on successful backup code verification', async () => {
      const user = userEvent.setup()
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-toggle-backup')).toBeInTheDocument()
      })

      // Switch to backup mode
      await user.click(screen.getByTestId('mfa-verify-toggle-backup'))

      // Click mock backup success
      await user.click(screen.getByTestId('mock-backup-success'))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('factor loading', () => {
    it('should show loading spinner while factors are loading', () => {
      mockListFactors.mockReturnValue(new Promise(() => {}))

      render(<MfaVerifyForm />)

      expect(screen.getByTestId('mfa-verify-loading')).toBeInTheDocument()
    })

    it('should redirect to /auth/mfa-enroll if no TOTP factors found', async () => {
      mockListFactors.mockResolvedValue({
        data: { totp: [], phone: [] },
        error: null,
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/mfa-enroll')
      })
    })

    it('should show error with retry if listFactors() fails', async () => {
      mockListFactors.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-factor-error')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Failed to load MFA factors. Please try again.'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('mfa-verify-retry')).toBeInTheDocument()
    })

    it('should retry loading factors when retry button is clicked', async () => {
      const user = userEvent.setup()
      // Use mockResolvedValue (not Once) for the error to handle potential double-calls from React strict mode
      mockListFactors.mockResolvedValue({ data: null, error: new Error('Network error') })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-retry')).toBeInTheDocument()
      })

      // Now set success response for retry
      mockListFactors.mockResolvedValue(mockTotpFactors)

      await user.click(screen.getByTestId('mfa-verify-retry'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })
    })

    it('should show error when listFactors throws exception', async () => {
      mockListFactors.mockRejectedValue(new Error('Connection failed'))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-factor-error')).toBeInTheDocument()
      })
    })
  })

  describe('loading/verifying states', () => {
    it('should disable input and button during client verification', async () => {
      const user = userEvent.setup()
      mockVerifyMfaEnrollment.mockReturnValue(new Promise(() => {}))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-submit')).toBeDisabled()
      })

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeDisabled()
      })
    })
  })

  describe('accessibility', () => {
    it('should pass accessibility audit (no violations)', async () => {
      const { container } = render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have aria-describedby linking error to input when client verify fails', async () => {
      const user = userEvent.setup()
      mockVerifyMfaEnrollment.mockRejectedValueOnce(new Error('Invalid TOTP code'))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('mfa-verify-code-input'), '000000')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toBeInTheDocument()
      })

      const errorEl = screen.getByTestId('mfa-verify-error')
      expect(errorEl).toHaveAttribute('id', 'mfa-verify-error-message')
      expect(errorEl).toHaveAttribute('role', 'alert')

      // Verify input links to error via aria-describedby
      const input = screen.getByTestId('mfa-verify-code-input')
      expect(input).toHaveAttribute('aria-describedby', 'mfa-verify-error-message')
    })

    it('should have proper aria-label on code input', async () => {
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('6-digit verification code')).toBeInTheDocument()
      })
    })
  })
})
