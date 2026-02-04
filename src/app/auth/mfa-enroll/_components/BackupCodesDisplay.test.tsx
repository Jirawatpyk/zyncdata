import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
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

describe('BackupCodesDisplay', () => {
  it('should render all 8 codes in formatted display', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    expect(screen.getByTestId('backup-codes-list')).toBeInTheDocument()
    expect(screen.getByTestId('backup-code-0')).toHaveTextContent('A1B2-C3D4')
    expect(screen.getByTestId('backup-code-1')).toHaveTextContent('E5F6-A7B8')
    expect(screen.getByTestId('backup-code-7')).toHaveTextContent('6677-8899')

    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`backup-code-${i}`)).toBeInTheDocument()
    }
  })

  it('should display title and description', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    expect(screen.getByTestId('backup-codes-title')).toHaveTextContent('Save Your Backup Codes')
    expect(screen.getByTestId('backup-codes-description')).toHaveTextContent(
      'These codes can be used to access your account',
    )
  })

  it('should copy all codes to clipboard when Copy All is clicked', async () => {
    const user = userEvent.setup()

    // Re-apply clipboard mock after userEvent.setup (which may override it)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const copyButton = screen.getByTestId('backup-codes-copy')
    await user.click(copyButton)

    // Verify clipboard write happened by checking "Copied!" feedback
    await waitFor(() => {
      expect(copyButton).toHaveTextContent('Copied!')
    })

    // Verify correct formatted content was written to clipboard
    expect(mockWriteText).toHaveBeenCalledWith(
      'A1B2-C3D4\nE5F6-A7B8\n1122-3344\n5566-7788\nAABB-CCDD\nEEFF-0011\n2233-4455\n6677-8899',
    )
  })

  it('should show "Copied!" feedback after copy', async () => {
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const copyButton = screen.getByTestId('backup-codes-copy')
    expect(copyButton).toHaveTextContent('Copy All')

    await user.click(copyButton)

    await waitFor(() => {
      expect(copyButton).toHaveTextContent('Copied!')
    })
  })

  it('should have Continue button disabled until checkbox is checked', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const continueButton = screen.getByTestId('backup-codes-continue')
    expect(continueButton).toBeDisabled()
  })

  it('should enable Continue button after checkbox is checked', async () => {
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const checkbox = screen.getByTestId('backup-codes-acknowledge')
    await user.click(checkbox)

    const continueButton = screen.getByTestId('backup-codes-continue')
    expect(continueButton).not.toBeDisabled()
  })

  it('should call onContinue when Continue is clicked', async () => {
    const user = userEvent.setup()
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    await user.click(screen.getByTestId('backup-codes-acknowledge'))
    await user.click(screen.getByTestId('backup-codes-continue'))

    expect(mockOnContinue).toHaveBeenCalledTimes(1)
  })

  it('should display codes with font-mono styling', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const firstCode = screen.getByTestId('backup-code-0')
    expect(firstCode.className).toContain('font-mono')
  })

  it('should render codes container with role="list"', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('should render each code with role="listitem"', () => {
    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(8)
  })

  it('should create and trigger download when Download is clicked', async () => {
    const user = userEvent.setup()

    // Track anchor element creation
    const originalCreateElement = document.createElement.bind(document)
    let createdAnchor: HTMLAnchorElement | null = null
    const mockClick = vi.fn()

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        createdAnchor = el as HTMLAnchorElement
        vi.spyOn(createdAnchor, 'click').mockImplementation(mockClick)
      }
      return el
    })

    render(<BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />)

    await user.click(screen.getByTestId('backup-codes-download'))

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(createdAnchor).not.toBeNull()
    expect(createdAnchor!.download).toContain('zyncdata-backup-codes-')
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should pass accessibility audit', async () => {
    const { container } = render(
      <main>
        <BackupCodesDisplay codes={mockCodes} onContinue={mockOnContinue} />
      </main>,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
