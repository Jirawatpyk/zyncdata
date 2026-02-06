import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HeroEditor from './HeroEditor'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockHeroContent } from '@/lib/test-utils/mock-factories'

// Mock TipTap with textarea (per WYSIWYG testing patterns)
vi.mock('@/components/patterns/DynamicTipTapEditor', () => ({
  DynamicTipTapEditor: ({ content, onChange, disabled }: { content?: string; onChange?: (html: string) => void; disabled?: boolean }) => (
    <textarea
      data-testid="mock-editor"
      defaultValue={content}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

vi.mock('@/lib/admin/mutations/content', () => ({
  useUpdateSection: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderEditor(overrides?: Partial<Parameters<typeof HeroEditor>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    content: createMockHeroContent(),
  }
  return render(<HeroEditor {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('HeroEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with pre-populated data', () => {
    const content = createMockHeroContent({ title: 'My Title', subtitle: 'My Sub' })
    renderEditor({ content })

    expect(screen.getByTestId('hero-title-input')).toHaveValue('My Title')
    expect(screen.getByTestId('hero-subtitle-input')).toHaveValue('My Sub')
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    const content = createMockHeroContent({ title: 'Has Title', subtitle: 'Has Sub', description: 'Has Desc' })
    renderEditor({ content })

    // Clear title to make it empty and dirty
    const titleInput = screen.getByTestId('hero-title-input')
    await user.clear(titleInput)
    await user.click(screen.getByTestId('hero-submit-button'))

    // Now with .min(1) validation, empty title triggers error
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('renders the WYSIWYG editor for description field', () => {
    renderEditor()

    expect(screen.getByTestId('mock-editor')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderEditor({ onOpenChange })

    await user.click(screen.getByTestId('hero-cancel-button'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('submits form data with useUpdateSection', async () => {
    const { useUpdateSection } = await import('@/lib/admin/mutations/content')
    const mockMutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useUpdateSection).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSection>)

    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const content = createMockHeroContent({ title: 'Original', subtitle: 'Sub', description: '<p>Desc</p>' })
    renderEditor({ content, onOpenChange })

    // Modify title to make form dirty (isDirty check on submit button)
    const titleInput = screen.getByTestId('hero-title-input')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')

    await user.click(screen.getByTestId('hero-submit-button'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        section: 'hero',
        content: expect.objectContaining({ title: 'Updated Title' }),
      })
    })
  })
})
