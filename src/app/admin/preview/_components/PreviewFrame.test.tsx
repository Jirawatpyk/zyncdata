import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PreviewFrame from './PreviewFrame'

describe('PreviewFrame', () => {
  const defaultProps = {
    previewHtml: '<html><body><h1>Preview</h1></body></html>',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render iframe element', () => {
    render(<PreviewFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toBeInTheDocument()
    expect(iframe.tagName).toBe('IFRAME')
  })

  it('should set iframe sandbox attribute for security', () => {
    render(<PreviewFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts')
  })

  it('should render "PREVIEW - Not Published" banner', () => {
    render(<PreviewFrame {...defaultProps} />)
    expect(screen.getByText('PREVIEW - Not Published')).toBeInTheDocument()
  })

  it('should render device toolbar with three device options', () => {
    render(<PreviewFrame {...defaultProps} />)
    expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tablet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /desktop/i })).toBeInTheDocument()
  })

  it('should default to desktop width (1280px)', () => {
    render(<PreviewFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toHaveStyle({ width: '1280px' })
  })

  it('should switch to mobile width (375px) when mobile button clicked', () => {
    render(<PreviewFrame {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toHaveStyle({ width: '375px' })
  })

  it('should switch to tablet width (768px) when tablet button clicked', () => {
    render(<PreviewFrame {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /tablet/i }))
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toHaveStyle({ width: '768px' })
  })

  it('should show active state indicator on selected device', () => {
    render(<PreviewFrame {...defaultProps} />)
    // Desktop is default active
    const desktopBtn = screen.getByRole('button', { name: /desktop/i })
    expect(desktopBtn).toHaveAttribute('data-active', 'true')

    // Click mobile
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    const mobileBtn = screen.getByRole('button', { name: /mobile/i })
    expect(mobileBtn).toHaveAttribute('data-active', 'true')
    expect(desktopBtn).toHaveAttribute('data-active', 'false')
  })

  it('should set iframe srcDoc with previewHtml', () => {
    render(<PreviewFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Preview')
    expect(iframe).toHaveAttribute('srcdoc', defaultProps.previewHtml)
  })

  it('should have min-h-11 on device toolbar buttons for touch target', () => {
    render(<PreviewFrame {...defaultProps} />)
    const mobileBtn = screen.getByRole('button', { name: /mobile/i })
    expect(mobileBtn.className).toContain('min-h-11')
  })
})
