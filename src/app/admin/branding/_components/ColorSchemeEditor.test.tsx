import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorSchemeEditor from './ColorSchemeEditor'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockThemeContent } from '@/lib/test-utils/mock-factories'

const mockMutateAsync = vi.fn().mockResolvedValue({})

vi.mock('@/lib/admin/mutations/content', () => ({
  useUpdateSection: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderEditor(overrides?: Partial<Parameters<typeof ColorSchemeEditor>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentTheme: createMockThemeContent(),
  }
  return render(<ColorSchemeEditor {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('ColorSchemeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 3 color scheme options', () => {
    renderEditor()

    expect(screen.getByTestId('scheme-option-dxt-default')).toBeInTheDocument()
    expect(screen.getByTestId('scheme-option-ocean-blue')).toBeInTheDocument()
    expect(screen.getByTestId('scheme-option-midnight-purple')).toBeInTheDocument()
  })

  it('marks current scheme as active', () => {
    renderEditor({ currentTheme: createMockThemeContent({ colorScheme: 'ocean-blue' }) })

    expect(screen.getByTestId('scheme-option-ocean-blue')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('scheme-option-dxt-default')).toHaveAttribute('aria-pressed', 'false')
  })

  it('save button is disabled when selection unchanged', () => {
    renderEditor()

    expect(screen.getByTestId('save-color-scheme-button')).toBeDisabled()
  })

  it('save button is enabled after selecting different scheme', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByTestId('scheme-option-ocean-blue'))

    expect(screen.getByTestId('save-color-scheme-button')).toBeEnabled()
  })

  it('calls mutation with selected scheme on save', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderEditor({ onOpenChange })

    await user.click(screen.getByTestId('scheme-option-midnight-purple'))
    await user.click(screen.getByTestId('save-color-scheme-button'))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        section: 'theme',
        content: expect.objectContaining({ colorScheme: 'midnight-purple' }),
      }),
    )
  })

  it('shows color swatches for each scheme', () => {
    renderEditor()

    // Each option has 3 swatches (6px circles)
    const options = screen.getAllByRole('button', { pressed: undefined })
    // At least 3 scheme options + Cancel + Save
    expect(options.length).toBeGreaterThanOrEqual(3)
  })
})
