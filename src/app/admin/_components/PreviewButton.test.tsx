import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import PreviewButton from './PreviewButton'

describe('PreviewButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Preview button', () => {
    render(<PreviewButton />)
    expect(screen.getByRole('link', { name: /preview/i })).toBeInTheDocument()
  })

  it('should link to /admin/preview', () => {
    render(<PreviewButton />)
    const link = screen.getByRole('link', { name: /preview/i })
    expect(link).toHaveAttribute('href', '/admin/preview')
  })

  it('should have min-h-11 for touch target', () => {
    render(<PreviewButton />)
    const link = screen.getByRole('link', { name: /preview/i })
    expect(link.className).toContain('min-h-11')
  })
})
