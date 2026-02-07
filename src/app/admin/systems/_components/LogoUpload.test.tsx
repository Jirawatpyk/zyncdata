import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LogoUpload from './LogoUpload'

describe('LogoUpload', () => {
  const defaultProps = {
    currentLogoUrl: null,
    pendingPreview: null,
    systemName: 'Test System',
    isUploading: false,
    onFileSelect: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the Logo label', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.getByText('Logo')).toBeInTheDocument()
  })

  it('should show letter fallback when no logo URL', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should show first letter of system name as fallback', () => {
    render(<LogoUpload {...defaultProps} systemName="ENEOS" />)

    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('should show "?" when system name is empty', () => {
    render(<LogoUpload {...defaultProps} systemName="" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('should show "Upload" button when no current logo', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.getByTestId('upload-logo-button')).toHaveTextContent('Upload')
  })

  it('should show "Replace" button when current logo exists', () => {
    render(
      <LogoUpload
        {...defaultProps}
        currentLogoUrl="https://example.com/logo.png"
      />,
    )

    expect(screen.getByTestId('upload-logo-button')).toHaveTextContent('Replace')
  })

  it('should show Remove button when current logo exists', () => {
    render(
      <LogoUpload
        {...defaultProps}
        currentLogoUrl="https://example.com/logo.png"
      />,
    )

    expect(screen.getByTestId('remove-logo-button')).toBeInTheDocument()
  })

  it('should not show Remove button when no logo', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.queryByTestId('remove-logo-button')).not.toBeInTheDocument()
  })

  it('should show logo image when currentLogoUrl is set', () => {
    render(
      <LogoUpload
        {...defaultProps}
        currentLogoUrl="https://example.com/logo.png"
      />,
    )

    const img = screen.getByAltText('Test System logo')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
  })

  it('should show file type and size hint', () => {
    render(<LogoUpload {...defaultProps} />)

    expect(screen.getByText('JPEG, PNG, SVG, or WebP. Max 512KB.')).toBeInTheDocument()
  })

  it('should show spinner when uploading', () => {
    render(<LogoUpload {...defaultProps} isUploading={true} />)

    // Upload button should be disabled
    expect(screen.getByTestId('upload-logo-button')).toBeDisabled()
  })

  it('should show error message from prop', () => {
    render(<LogoUpload {...defaultProps} error="Upload failed" />)

    expect(screen.getByTestId('logo-error')).toHaveTextContent('Upload failed')
  })

  it('should show validation error for invalid file type', async () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('logo-file-input')
    const invalidFile = new File(['pdf content'], 'document.pdf', {
      type: 'application/pdf',
    })

    // Use fireEvent.change to bypass the accept attribute filtering in userEvent
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(screen.getByTestId('logo-error')).toHaveTextContent(
        'File must be JPEG, PNG, SVG, or WebP',
      )
    })

    // Should NOT call onFileSelect
    expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
  })

  it('should show validation error for file too large', async () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('logo-file-input')
    // Create a file larger than 512KB
    const content = new Uint8Array(512 * 1024 + 1)
    const largeFile = new File([content], 'large.png', {
      type: 'image/png',
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByTestId('logo-error')).toHaveTextContent(
        'File must be less than 512KB',
      )
    })

    expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
  })

  it('should call onFileSelect with valid file', async () => {
    const user = userEvent.setup()
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('logo-file-input')
    const validFile = new File(['image content'], 'logo.png', {
      type: 'image/png',
    })

    await user.upload(fileInput, validFile)

    expect(defaultProps.onFileSelect).toHaveBeenCalledWith(validFile)
  })

  it('should call onRemove when Remove button clicked', async () => {
    const user = userEvent.setup()
    render(
      <LogoUpload
        {...defaultProps}
        currentLogoUrl="https://example.com/logo.png"
      />,
    )

    await user.click(screen.getByTestId('remove-logo-button'))

    expect(defaultProps.onRemove).toHaveBeenCalled()
  })

  it('should accept valid MIME types via file input accept attribute', () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('logo-file-input')
    expect(fileInput).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/svg+xml,image/webp',
    )
  })

  it('should have hidden file input', () => {
    render(<LogoUpload {...defaultProps} />)

    const fileInput = screen.getByTestId('logo-file-input')
    expect(fileInput).toHaveClass('hidden')
  })

  it('should have error message with alert role', () => {
    render(<LogoUpload {...defaultProps} error="Something went wrong" />)

    const errorEl = screen.getByRole('alert')
    expect(errorEl).toHaveTextContent('Something went wrong')
  })
})
