import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import BackupCodeVerifyForm from './BackupCodeVerifyForm'

const mockVerifyBackupCodeAction = vi.fn()
const mockOnSuccess = vi.fn()

vi.mock('@/lib/actions/backup-codes', () => ({
  verifyBackupCodeAction: (...args: unknown[]) => mockVerifyBackupCodeAction(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BackupCodeVerifyForm', () => {
  it('should render backup code input field', () => {
    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    expect(screen.getByTestId('backup-code-input')).toBeInTheDocument()
    expect(screen.getByTestId('backup-code-submit')).toBeInTheDocument()
    expect(screen.getByLabelText('Backup code')).toBeInTheDocument()
  })

  it('should have correct input attributes', () => {
    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    const input = screen.getByTestId('backup-code-input')
    expect(input).toHaveAttribute('autoComplete', 'off')
    expect(input).toHaveAttribute('maxLength', '9')
    expect(input).toHaveAttribute('placeholder', 'A1B2-C3D4')
  })

  it('should submit code and call server action', async () => {
    const user = userEvent.setup()
    mockVerifyBackupCodeAction.mockResolvedValue({
      error: null,
      rateLimited: false,
      success: true,
      remainingCodes: 5,
    })

    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    const input = screen.getByTestId('backup-code-input')
    await user.type(input, 'A1B2C3D4')

    await user.click(screen.getByTestId('backup-code-submit'))

    await waitFor(() => {
      expect(mockVerifyBackupCodeAction).toHaveBeenCalled()
    })
  })

  it('should display error on invalid code', async () => {
    const user = userEvent.setup()
    mockVerifyBackupCodeAction.mockResolvedValue({
      error: 'Invalid or already used backup code',
      rateLimited: false,
      success: false,
      remainingCodes: null,
    })

    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    const input = screen.getByTestId('backup-code-input')
    await user.type(input, 'DEADBEEF')
    await user.click(screen.getByTestId('backup-code-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('backup-code-error')).toBeInTheDocument()
    })
    expect(screen.getByText('Invalid or already used backup code')).toBeInTheDocument()
  })

  it('should display rate limit message with amber styling', async () => {
    const user = userEvent.setup()
    mockVerifyBackupCodeAction.mockResolvedValue({
      error: 'Too many attempts. Please try again later.',
      rateLimited: true,
      success: false,
      remainingCodes: null,
    })

    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    const input = screen.getByTestId('backup-code-input')
    await user.type(input, 'A1B2C3D4')
    await user.click(screen.getByTestId('backup-code-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('backup-code-error')).toBeInTheDocument()
    })

    const errorElement = screen.getByTestId('backup-code-error')
    expect(errorElement).toHaveTextContent('Too many attempts. Please try again later.')
    expect(errorElement.className).toContain('amber')
  })

  it('should call onSuccess on successful verification', async () => {
    const user = userEvent.setup()
    mockVerifyBackupCodeAction.mockResolvedValue({
      error: null,
      rateLimited: false,
      success: true,
      remainingCodes: 5,
    })

    render(<BackupCodeVerifyForm onSuccess={mockOnSuccess} />)

    const input = screen.getByTestId('backup-code-input')
    await user.type(input, 'A1B2C3D4')
    await user.click(screen.getByTestId('backup-code-submit'))

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('should pass accessibility audit', async () => {
    const { container } = render(
      <main>
        <BackupCodeVerifyForm onSuccess={mockOnSuccess} />
      </main>,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
