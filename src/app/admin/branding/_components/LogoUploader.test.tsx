import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LogoUploader from './LogoUploader'
import { createQueryWrapper } from '@/lib/test-utils'

const mockUploadMutateAsync = vi.fn().mockResolvedValue({})
const mockDeleteMutateAsync = vi.fn().mockResolvedValue({})

vi.mock('@/lib/admin/mutations/branding', () => ({
  useUploadLogo: vi.fn(() => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: false,
  })),
  useDeleteLogo: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderUploader(overrides?: Partial<Parameters<typeof LogoUploader>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentLogoUrl: null as string | null,
  }
  return render(<LogoUploader {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('LogoUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload button', () => {
    renderUploader()

    expect(screen.getByTestId('upload-logo-button')).toBeInTheDocument()
  })

  it('shows placeholder when no logo exists', () => {
    renderUploader()

    expect(screen.getByText(/text-based/i)).toBeInTheDocument()
  })

  it('shows current logo preview when logo exists', () => {
    renderUploader({ currentLogoUrl: 'https://example.com/logo.png' })

    expect(screen.getByTestId('current-logo-preview')).toBeInTheDocument()
  })

  it('shows remove button when logo exists', () => {
    renderUploader({ currentLogoUrl: 'https://example.com/logo.png' })

    expect(screen.getByTestId('delete-logo-button')).toBeInTheDocument()
  })

  it('hides remove button when no logo exists', () => {
    renderUploader()

    expect(screen.queryByTestId('delete-logo-button')).not.toBeInTheDocument()
  })

  it('calls delete mutation and closes dialog when remove is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUploader({ currentLogoUrl: 'https://example.com/logo.png', onOpenChange })

    await user.click(screen.getByTestId('delete-logo-button'))

    expect(mockDeleteMutateAsync).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('has hidden file input', () => {
    renderUploader()

    const input = screen.getByTestId('logo-file-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('hidden')
  })

  it('calls upload mutation when file is selected', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUploader({ onOpenChange })

    const file = new File(['logo-data'], 'logo.png', { type: 'image/png' })
    const input = screen.getByTestId('logo-file-input')

    await user.upload(input, file)

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.any(FormData))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows toast error when file exceeds max size', async () => {
    const { toast } = await import('sonner')
    vi.spyOn(toast, 'error')

    const user = userEvent.setup()
    renderUploader()

    // Create a file larger than 512 KB
    const largeContent = new Uint8Array(513 * 1024)
    const file = new File([largeContent], 'large.png', { type: 'image/png' })
    const input = screen.getByTestId('logo-file-input')

    await user.upload(input, file)

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('File must be less than 512 KB')
  })
})
