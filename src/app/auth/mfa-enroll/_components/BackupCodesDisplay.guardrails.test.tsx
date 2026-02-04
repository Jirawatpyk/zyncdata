import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BackupCodesDisplay from './BackupCodesDisplay'

const mockCodes = [
  'A1B2C3D4',
  'E5F6A7B8',
  '11223344',
  '55667788',
  'AABBCCDD',
  'EEFF0011',
  '22334455',
  '66778899',
]

const mockOnContinue = vi.fn()
const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  mockWriteText.mockResolvedValue(undefined)

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  })

  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BackupCodesDisplay — guardrail edge cases', () => {
  it('[P1] should handle clipboard write failure gracefully', async () => {
    // Given clipboard.writeText will reject with an error
    const user = userEvent.setup()

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard access denied')) },
      writable: true,
      configurable: true,
    })

    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const copyButton = screen.getByTestId('backup-codes-copy')

    // When the user clicks Copy All and clipboard fails
    await user.click(copyButton)

    // Then the component should not crash and button text should stay "Copy All"
    // (the catch block silently swallows the error, so setCopied(true) never runs)
    await waitFor(() => {
      expect(copyButton).toHaveTextContent('Copy All')
    })

    // And the component should still be fully rendered
    expect(screen.getByTestId('backup-codes-title')).toBeInTheDocument()
    expect(screen.getByTestId('backup-codes-list')).toBeInTheDocument()
  })

  it('[P1] should not call onContinue when continue is clicked without acknowledging', async () => {
    // Given the component is rendered without checking the acknowledge checkbox
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const continueButton = screen.getByTestId('backup-codes-continue')

    // Then the continue button should be disabled
    expect(continueButton).toBeDisabled()

    // When the user clicks the disabled continue button
    await user.click(continueButton)

    // Then onContinue should NOT have been called
    expect(mockOnContinue).not.toHaveBeenCalled()
  })

  it('[P2] should toggle acknowledge checkbox on and off', async () => {
    // Given the component is rendered
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const checkbox = screen.getByTestId('backup-codes-acknowledge')
    const continueButton = screen.getByTestId('backup-codes-continue')

    // Initially continue should be disabled
    expect(continueButton).toBeDisabled()

    // When the user clicks the checkbox (first click — check)
    await user.click(checkbox)

    // Then the continue button should be enabled
    expect(continueButton).not.toBeDisabled()

    // When the user clicks the checkbox again (second click — uncheck)
    await user.click(checkbox)

    // Then the continue button should be disabled again
    expect(continueButton).toBeDisabled()
  })
})
