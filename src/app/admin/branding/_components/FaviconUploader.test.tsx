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

  it('calls delete mutation and closes dialog when remove is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUploader({ currentFaviconUrl: 'https://example.com/favicon.png', onOpenChange })

    await user.click(screen.getByTestId('delete-favicon-button'))

    expect(mockDeleteMutateAsync).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has hidden file input with correct accept attribute', () => {
    renderUploader()

    const input = screen.getByTestId('favicon-file-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/png,image/svg+xml,image/x-icon')
  })

  it('calls upload mutation when file is selected', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUploader({ onOpenChange })

    const file = new File(['favicon-data'], 'favicon.png', { type: 'image/png' })
    const input = screen.getByTestId('favicon-file-input')

    await user.upload(input, file)

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.any(FormData))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows toast error when file exceeds max size', async () => {
    const { toast } = await import('sonner')
    vi.spyOn(toast, 'error')

    const user = userEvent.setup()
    renderUploader()

    // Create a file larger than 64 KB
    const largeContent = new Uint8Array(65 * 1024)
    const file = new File([largeContent], 'large.png', { type: 'image/png' })
    const input = screen.getByTestId('favicon-file-input')

    await user.upload(input, file)

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('File must be less than 64 KB')
  })
})
