import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import MfaEnrollForm from './MfaEnrollForm'

// Mock mutations
const mockEnrollMfaFactor = vi.fn()
const mockVerifyMfaEnrollment = vi.fn()

vi.mock('@/lib/auth/mutations', () => ({
  enrollMfaFactor: (...args: unknown[]) => mockEnrollMfaFactor(...args),
  verifyMfaEnrollment: (...args: unknown[]) => mockVerifyMfaEnrollment(...args),
}))

// Mock server actions
const mockVerifyMfaEnrollmentAction = vi.fn()
const mockGenerateBackupCodesAction = vi.fn()

vi.mock('@/lib/actions/mfa', () => ({
  verifyMfaEnrollmentAction: (...args: unknown[]) => mockVerifyMfaEnrollmentAction(...args),
}))

vi.mock('@/lib/actions/backup-codes', () => ({
  generateBackupCodesAction: (...args: unknown[]) => mockGenerateBackupCodesAction(...args),
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

const mockEnrollData = {
  id: 'factor-123',
  totp: {
    qr_code: 'data:image/svg+xml;utf8,<svg></svg>',
    secret: 'JBSWY3DPEHPK3PXP',
    uri: 'otpauth://totp/test?secret=JBSWY3DPEHPK3PXP',
  },
}

const mockBackupCodes = [
  'A1B2C3D4', 'E5F6A7B8', '11223344', '55667788',
  'AABBCCDD', 'EEFF0011', '22334455', '66778899',
]

beforeEach(() => {
  vi.clearAllMocks()
  mockEnrollMfaFactor.mockResolvedValue(mockEnrollData)
  mockVerifyMfaEnrollmentAction.mockResolvedValue({ error: null, rateLimited: false })
  mockVerifyMfaEnrollment.mockResolvedValue({ user: { id: 'u1' }, session: {} })
  mockGenerateBackupCodesAction.mockResolvedValue({ codes: mockBackupCodes, error: null })
})

describe('MfaEnrollForm', () => {
  it('should show loading spinner during enrollment', () => {
    // Don't resolve enrollment immediately
    mockEnrollMfaFactor.mockReturnValue(new Promise(() => {}))

    render(<MfaEnrollForm />)

    expect(screen.getByTestId('mfa-enrolling-spinner')).toBeInTheDocument()
  })

  it('should render QR code after enrollment', async () => {
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const qrImage = screen.getByTestId('mfa-qr-code') as HTMLImageElement
    expect(qrImage.src).toContain('data:image/svg+xml')
    expect(qrImage).toHaveAttribute('alt', 'Scan this QR code with your authenticator app')
    expect(qrImage).toHaveAttribute('width', '200')
    expect(qrImage).toHaveAttribute('height', '200')
  })

  it('should show error and retry button when enrollment fails', async () => {
    mockEnrollMfaFactor.mockRejectedValueOnce(new Error('Network error'))

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-enroll-error')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to set up MFA. Please try again.')).toBeInTheDocument()
    expect(screen.getByTestId('mfa-retry-enroll')).toBeInTheDocument()
  })

  it('should retry enrollment when retry button is clicked', async () => {
    const user = userEvent.setup()
    mockEnrollMfaFactor
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockEnrollData)

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-retry-enroll')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('mfa-retry-enroll'))

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    expect(mockEnrollMfaFactor).toHaveBeenCalledTimes(2)
  })

  it('should show secret text when "Can\'t scan?" is clicked', async () => {
    const user = userEvent.setup()
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-toggle-secret')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('mfa-toggle-secret'))

    expect(screen.getByTestId('mfa-secret-text')).toBeInTheDocument()
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
  })

  it('should hide secret text when toggle is clicked again', async () => {
    const user = userEvent.setup()
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-toggle-secret')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('mfa-toggle-secret'))
    expect(screen.getByTestId('mfa-secret-text')).toBeInTheDocument()

    await user.click(screen.getByTestId('mfa-toggle-secret'))
    expect(screen.queryByTestId('mfa-secret-text')).not.toBeInTheDocument()
  })

  it('should render verification form after enrollment', async () => {
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-code-input')).toBeInTheDocument()
    })

    expect(screen.getByTestId('mfa-verify-submit')).toBeInTheDocument()
    expect(screen.getByLabelText('6-digit verification code')).toBeInTheDocument()
  })

  it('should have correct input attributes for mobile', async () => {
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-code-input')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    expect(input).toHaveAttribute('inputMode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]*')
    expect(input).toHaveAttribute('autoComplete', 'one-time-code')
    expect(input).toHaveAttribute('maxLength', '6')
  })

  it('should display heading and description', async () => {
    render(<MfaEnrollForm />)

    expect(screen.getByRole('heading', { name: 'Set Up MFA' })).toBeInTheDocument()
    expect(screen.getByText('Scan the QR code with your authenticator app')).toBeInTheDocument()

    // Wait for enrollment to settle to avoid act() warnings
    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })
  })

  it('should submit code, call server action and client verify, then show backup codes', async () => {
    const user = userEvent.setup()
    render(<MfaEnrollForm />)

    // Wait for enrollment to complete
    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    // Enter a 6-digit code
    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '123456')

    // Submit the form
    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    // Verify server action was called
    await waitFor(() => {
      expect(mockVerifyMfaEnrollmentAction).toHaveBeenCalled()
    })

    // Verify client-side verify was called with factorId and code
    await waitFor(() => {
      expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith('factor-123', '123456')
    })

    // Verify backup codes generation was called
    await waitFor(() => {
      expect(mockGenerateBackupCodesAction).toHaveBeenCalled()
    })

    // Verify BackupCodesDisplay is shown instead of redirect
    await waitFor(() => {
      expect(screen.getByTestId('backup-codes-title')).toBeInTheDocument()
    })

    // Dashboard redirect should NOT have happened yet
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should display client-side verify error on invalid code', async () => {
    const user = userEvent.setup()
    mockVerifyMfaEnrollment.mockRejectedValueOnce(new Error('Invalid TOTP code'))

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '000000')

    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-error')).toBeInTheDocument()
    })
    expect(screen.getByText('Invalid code. Please try again.')).toBeInTheDocument()
  })

  it('should pass accessibility audit', async () => {
    const { container } = render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('[P1] should display rate limited error and NOT call client verify', async () => {
    const user = userEvent.setup()
    mockVerifyMfaEnrollmentAction.mockResolvedValue({
      error: 'Too many attempts. Please try again later.',
      rateLimited: true,
    })

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '123456')

    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-error')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Too many attempts. Please try again later.'),
    ).toBeInTheDocument()
    expect(mockVerifyMfaEnrollment).not.toHaveBeenCalled()
  })

  it('[P1] should display validation error and NOT call client verify', async () => {
    const user = userEvent.setup()
    mockVerifyMfaEnrollmentAction.mockResolvedValue({
      error: 'Code must be 6 digits',
      rateLimited: false,
    })

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '123')

    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-error')).toBeInTheDocument()
    })

    expect(screen.getByText('Code must be 6 digits')).toBeInTheDocument()
    expect(mockVerifyMfaEnrollment).not.toHaveBeenCalled()
  })

  it('[P2] should toggle secret button aria-label between show and hide', async () => {
    const user = userEvent.setup()
    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-toggle-secret')).toBeInTheDocument()
    })

    const toggleButton = screen.getByTestId('mfa-toggle-secret')

    // Initial state: aria-label should be "Show secret key"
    expect(toggleButton).toHaveAttribute('aria-label', 'Show secret key')
    expect(toggleButton).toHaveTextContent("Can't scan? Show secret key")

    // After click: aria-label should switch to "Hide secret key"
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide secret key')
    expect(toggleButton).toHaveTextContent('Hide secret key')

    // After second click: back to "Show secret key"
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-label', 'Show secret key')
  })

  it('should redirect to dashboard if backup code generation fails', async () => {
    const user = userEvent.setup()
    mockGenerateBackupCodesAction.mockResolvedValue({
      codes: null,
      error: 'Failed to generate backup codes.',
    })

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '123456')

    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockGenerateBackupCodesAction).toHaveBeenCalled()
    })

    // Should redirect to dashboard on backup code failure
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('[P2] should disable submit button while client verify is in progress', async () => {
    const user = userEvent.setup()
    // Make verifyMfaEnrollment hang forever (never resolves)
    mockVerifyMfaEnrollment.mockReturnValue(new Promise(() => {}))

    render(<MfaEnrollForm />)

    await waitFor(() => {
      expect(screen.getByTestId('mfa-qr-code')).toBeInTheDocument()
    })

    const input = screen.getByTestId('mfa-code-input')
    await user.type(input, '123456')

    const submitButton = screen.getByTestId('mfa-verify-submit')
    await user.click(submitButton)

    // Wait for the server action to resolve and client verify to start
    await waitFor(() => {
      expect(mockVerifyMfaEnrollment).toHaveBeenCalledWith('factor-123', '123456')
    })

    // Submit button should be disabled while client verify is in progress
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})
