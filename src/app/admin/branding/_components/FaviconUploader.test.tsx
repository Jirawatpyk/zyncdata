import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FaviconUploader from './FaviconUploader'
import { createQueryWrapper } from '@/lib/test-utils'

const mockUploadMutateAsync = vi.fn().mockResolvedValue({})
const mockDeleteMutateAsync = vi.fn().mockResolvedValue({})

vi.mock('@/lib/admin/mutations/branding', () => ({
  useUploadFavicon: vi.fn(() => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: false,
  })),
  useDeleteFavicon: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderUploader(overrides?: Partial<Parameters<typeof FaviconUploader>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentFaviconUrl: null as string | null,
  }
  return render(<FaviconUploader {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('FaviconUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload button', () => {
    renderUploader()

    expect(screen.getByTestId('upload-favicon-button')).toBeInTheDocument()
  })

  it('shows placeholder when no favicon exists', () => {
    renderUploader()

    expect(screen.getByText(/Default SVG favicon/i)).toBeInTheDocument()
  })

  it('shows current favicon preview when favicon exists', () => {
    renderUploader({ currentFaviconUrl: 'https://example.com/favicon.png' })

    expect(screen.getByTestId('current-favicon-preview')).toBeInTheDocument()
  })

  it('shows remove button when favicon exists', () => {
    renderUploader({ currentFaviconUrl: 'https://example.com/favicon.png' })

    expect(screen.getByTestId('delete-favicon-button')).toBeInTheDocument()
  })

  it('hides remove button when no favicon exists', () => {
    renderUploader()

    expect(screen.queryByTestId('delete-favicon-button')).not.toBeInTheDocument()
  })

  it('calls delete mutation when remove is clicked', async () => {
    const user = userEvent.setup()
    renderUploader({ currentFaviconUrl: 'https://example.com/favicon.png' })

    await user.click(screen.getByTestId('delete-favicon-button'))

    expect(mockDeleteMutateAsync).toHaveBeenCalled()
  })

  it('has hidden file input with correct accept attribute', () => {
    renderUploader()

    const input = screen.getByTestId('favicon-file-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/png,image/svg+xml,image/x-icon')
  })
})
