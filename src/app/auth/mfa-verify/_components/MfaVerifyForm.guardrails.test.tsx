import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  verifyMfaEnrollmentAction: (...args: unknown[]) =>
    mockVerifyMfaEnrollmentAction(...args),
}))

// Mock BackupCodeVerifyForm
vi.mock('./BackupCodeVerifyForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="backup-code-verify-form">
      <button
        type="button"
        data-testid="mock-backup-success"
        onClick={onSuccess}
      >
        Mock Backup Success
      </button>
    </div>
  ),
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
  mockVerifyMfaEnrollmentAction.mockResolvedValue({
    error: null,
    rateLimited: false,
  })
  mockVerifyMfaEnrollment.mockResolvedValue({
    user: { id: 'u1' },
    session: {},
  })
})

describe('MfaVerifyForm — guardrail edge cases', () => {
  describe('double-submit prevention', () => {
    it('[P0] should not call verifyMfaEnrollment twice when form is submitted rapidly', async () => {
      const user = userEvent.setup()
      let resolveVerify: (value: unknown) => void
      mockVerifyMfaEnrollment.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveVerify = resolve
          }),
      )

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      // When the user types a code and submits
      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      // Then the first verifyMfaEnrollment call should be in progress
      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalledTimes(1)
      })

      // Submit button should be disabled during verification
      expect(screen.getByTestId('mfa-verify-submit')).toBeDisabled()

      // Resolve the first call
      resolveVerify!({ user: { id: 'u1' }, session: {} })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      // Then verifyMfaEnrollment should only have been called once
      expect(mockVerifyMfaEnrollment).toHaveBeenCalledTimes(1)
    })
  })

  describe('factorId null safety', () => {
    it('[P1] should enable submit button only when factorId is loaded', async () => {
      // The component guards null factorId with:
      // <SubmitButton disabled={verifying || !factorId} />
      // Loading spinner prevents form render until factors load.
      mockListFactors.mockResolvedValue(mockTotpFactors)

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })

      // When factorId IS set, the button should be enabled
      expect(screen.getByTestId('mfa-verify-submit')).not.toBeDisabled()

      // Verify the component correctly loaded the factor
      const user = userEvent.setup()
      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith(
          'factor-123',
          '123456',
        )
      })
    })

    it('[P1] should not show "MFA setup incomplete" when factorId is properly loaded', async () => {
      // Defense-in-depth guard: if (!factorId) return { error: 'MFA setup incomplete...' }
      // We verify the normal path does NOT trigger the guard.
      mockListFactors.mockResolvedValue(mockTotpFactors)
      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalled()
      })
      expect(
        screen.queryByText(
          'MFA setup incomplete. Please refresh and try again.',
        ),
      ).not.toBeInTheDocument()
    })
  })

  describe('error priority', () => {
    it('[P1] should show actionState.error over clientError when both exist', async () => {
      const user = userEvent.setup()

      // First: make client verify fail to set clientError
      mockVerifyMfaEnrollment.mockRejectedValueOnce(new Error('Invalid TOTP'))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      // Submit — server action passes, but client verify fails
      await user.type(screen.getByTestId('mfa-verify-code-input'), '111111')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired code')).toBeInTheDocument()
      })

      // Now: make the server action return an error for the second submit
      mockVerifyMfaEnrollmentAction.mockResolvedValue({
        error: 'Code must be 6 digits',
        rateLimited: false,
      })

      await user.clear(screen.getByTestId('mfa-verify-code-input'))
      await user.type(screen.getByTestId('mfa-verify-code-input'), '22')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      // Then the server action error should take priority
      // (displayError = actionState.error || clientError)
      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toHaveTextContent(
          'Code must be 6 digits',
        )
      })

      // And the previous client error should NOT be shown
      expect(
        screen.queryByText('Invalid or expired code'),
      ).not.toBeInTheDocument()
    })
  })

  describe('retry with different factor ID', () => {
    it('[P1] should use the new factor ID after retry returns a different factor', async () => {
      const user = userEvent.setup()

      // Given listFactors initially fails
      mockListFactors.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-retry')).toBeInTheDocument()
      })

      // When retry returns a different factor ID
      mockListFactors.mockResolvedValue({
        data: {
          totp: [
            {
              id: 'factor-new-456',
              factor_type: 'totp',
              status: 'verified',
            },
          ],
          phone: [],
        },
        error: null,
      })

      await user.click(screen.getByTestId('mfa-verify-retry'))

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })

      // When the user submits a TOTP code
      await user.type(screen.getByTestId('mfa-verify-code-input'), '789012')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      // Then verifyMfaEnrollment should be called with the NEW factor ID
      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith(
          'factor-new-456',
          '789012',
        )
      })
    })
  })

  describe('retry edge cases', () => {
    it('[P2] should redirect to mfa-enroll when retry returns empty totp array', async () => {
      const user = userEvent.setup()

      // Given listFactors initially fails
      mockListFactors.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-retry')).toBeInTheDocument()
      })

      // When retry returns empty TOTP factors
      mockListFactors.mockResolvedValue({
        data: { totp: [], phone: [] },
        error: null,
      })

      await user.click(screen.getByTestId('mfa-verify-retry'))

      // Then the component should redirect to /auth/mfa-enroll
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/mfa-enroll')
      })
    })

    it('[P2] should settle to a consistent state after retry recovers from error', async () => {
      const user = userEvent.setup()

      // Given listFactors initially fails
      mockListFactors.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      })

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-retry')).toBeInTheDocument()
      })

      // When retry succeeds with valid factors
      mockListFactors.mockResolvedValue({
        data: {
          totp: [
            {
              id: 'factor-final',
              factor_type: 'totp',
              status: 'verified',
            },
          ],
          phone: [],
        },
        error: null,
      })

      await user.click(screen.getByTestId('mfa-verify-retry'))

      // Then the component should settle to a working form state
      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument()
      })

      // And should not have stale error displayed
      expect(
        screen.queryByTestId('mfa-verify-factor-error'),
      ).not.toBeInTheDocument()

      // And the form should be functional with the new factor
      await user.type(screen.getByTestId('mfa-verify-code-input'), '654321')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith(
          'factor-final',
          '654321',
        )
      })
    })
  })

  describe('client error clearing', () => {
    it('[P2] should clear previous clientError when a new submit starts', async () => {
      const user = userEvent.setup()

      // Given the first verification fails with a client error
      mockVerifyMfaEnrollment.mockRejectedValueOnce(new Error('Invalid TOTP'))

      render(<MfaVerifyForm />)

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-code-input')).toBeInTheDocument()
      })

      // When the user submits and gets a client error
      await user.type(screen.getByTestId('mfa-verify-code-input'), '000000')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired code')).toBeInTheDocument()
      })

      // When the user submits again with a valid code
      mockVerifyMfaEnrollment.mockResolvedValueOnce({
        user: { id: 'u1' },
        session: {},
      })

      await user.clear(screen.getByTestId('mfa-verify-code-input'))
      await user.type(screen.getByTestId('mfa-verify-code-input'), '123456')
      await user.click(screen.getByTestId('mfa-verify-submit'))

      // Then the previous client error should be cleared
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      // And the error message should no longer be displayed
      expect(
        screen.queryByText('Invalid or expired code'),
      ).not.toBeInTheDocument()
    })
  })
})
