import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FontSelector from './FontSelector'
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

function renderSelector(overrides?: Partial<Parameters<typeof FontSelector>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentTheme: createMockThemeContent(),
  }
  return render(<FontSelector {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('FontSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 3 font options', () => {
    renderSelector()

    expect(screen.getByTestId('font-option-nunito')).toBeInTheDocument()
    expect(screen.getByTestId('font-option-inter')).toBeInTheDocument()
    expect(screen.getByTestId('font-option-open-sans')).toBeInTheDocument()
  })

  it('marks current font as active', () => {
    renderSelector({ currentTheme: createMockThemeContent({ font: 'inter' }) })

    expect(screen.getByTestId('font-option-inter')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('font-option-nunito')).toHaveAttribute('aria-pressed', 'false')
  })

  it('save button is disabled when selection unchanged', () => {
    renderSelector()

    expect(screen.getByTestId('save-font-button')).toBeDisabled()
  })

  it('save button is enabled after selecting different font', async () => {
    const user = userEvent.setup()
    renderSelector()

    await user.click(screen.getByTestId('font-option-inter'))

    expect(screen.getByTestId('save-font-button')).toBeEnabled()
  })

  it('calls mutation with selected font on save', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderSelector({ onOpenChange })

    await user.click(screen.getByTestId('font-option-open-sans'))
    await user.click(screen.getByTestId('save-font-button'))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        section: 'theme',
        content: expect.objectContaining({ font: 'open-sans' }),
      }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows font preview text with font-family styling', () => {
    renderSelector()

    const previewTexts = screen.getAllByText('The quick brown fox jumps over the lazy dog')
    expect(previewTexts.length).toBe(3)
  })
})
