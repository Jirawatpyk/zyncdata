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

  it('calls delete mutation when remove is clicked', async () => {
    const user = userEvent.setup()
    renderUploader({ currentLogoUrl: 'https://example.com/logo.png' })

    await user.click(screen.getByTestId('delete-logo-button'))

    expect(mockDeleteMutateAsync).toHaveBeenCalled()
  })

  it('has hidden file input', () => {
    renderUploader()

    const input = screen.getByTestId('logo-file-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('hidden')
  })
})
