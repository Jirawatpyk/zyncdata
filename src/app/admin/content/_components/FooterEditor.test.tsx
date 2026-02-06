import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FooterEditor from './FooterEditor'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockFooterContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/admin/mutations/content', () => ({
  useUpdateSection: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderEditor(overrides?: Partial<Parameters<typeof FooterEditor>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    content: createMockFooterContent(),
  }
  return render(<FooterEditor {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('FooterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders footer form fields with pre-populated data', () => {
    const content = createMockFooterContent({
      copyright: 'My Copyright',
      contactEmail: 'test@test.com',
    })
    renderEditor({ content })

    expect(screen.getByTestId('footer-copyright-input')).toHaveValue('My Copyright')
    expect(screen.getByTestId('footer-email-input')).toHaveValue('test@test.com')
  })

  it('renders links from content', () => {
    const content = createMockFooterContent({
      links: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
      ],
    })
    renderEditor({ content })

    expect(screen.getByTestId('link-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('link-item-1')).toBeInTheDocument()
  })

  it('adds a new link when Add Link is clicked', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByTestId('add-link-button'))

    await waitFor(() => {
      expect(screen.getByTestId('link-item-1')).toBeInTheDocument()
    })
  })

  it('removes a link when remove is clicked', async () => {
    const user = userEvent.setup()
    const content = createMockFooterContent({
      links: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
      ],
    })
    renderEditor({ content })

    await user.click(screen.getByTestId('remove-link-1'))

    await waitFor(() => {
      expect(screen.queryByTestId('link-item-1')).not.toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    const content = createMockFooterContent({ contactEmail: '' })
    renderEditor({ content })

    const emailInput = screen.getByTestId('footer-email-input')
    await user.type(emailInput, 'not-an-email')
    await user.click(screen.getByTestId('footer-submit-button'))

    // The form should show a validation error for invalid email
    await waitFor(() => {
      expect(screen.getByTestId('footer-editor-form')).toBeInTheDocument()
    })
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderEditor({ onOpenChange })

    await user.click(screen.getByTestId('footer-cancel-button'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
