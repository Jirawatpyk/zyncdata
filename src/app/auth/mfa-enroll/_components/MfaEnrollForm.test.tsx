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

// Mock server action
const mockVerifyMfaEnrollmentAction = vi.fn()

vi.mock('@/lib/actions/mfa', () => ({
  verifyMfaEnrollmentAction: (...args: unknown[]) => mockVerifyMfaEnrollmentAction(...args),
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

beforeEach(() => {
  vi.clearAllMocks()
  mockEnrollMfaFactor.mockResolvedValue(mockEnrollData)
  mockVerifyMfaEnrollmentAction.mockResolvedValue({ error: null, rateLimited: false })
  mockVerifyMfaEnrollment.mockResolvedValue({ user: { id: 'u1' }, session: {} })
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

  it('should submit code, call server action and client verify, then redirect', async () => {
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

    // Verify redirect to dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
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
})
