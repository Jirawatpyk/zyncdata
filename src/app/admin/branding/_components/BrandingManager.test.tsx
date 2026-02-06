import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BrandingManager from './BrandingManager'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockLandingPageContent, createMockThemeContent } from '@/lib/test-utils/mock-factories'
import { useSuspenseQuery } from '@tanstack/react-query'

const mockContent = createMockLandingPageContent()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useSuspenseQuery: vi.fn(() => ({ data: mockContent })),
  }
})

vi.mock('@/lib/admin/mutations/content', () => ({
  useUpdateSection: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}))

vi.mock('@/lib/admin/mutations/branding', () => ({
  useUploadLogo: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteLogo: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUploadFavicon: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteFavicon: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

const Wrapper = createQueryWrapper()

describe('BrandingManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSuspenseQuery).mockReturnValue({ data: mockContent } as ReturnType<typeof useSuspenseQuery>)
  })

  it('renders 4 setting cards', () => {
    render(<BrandingManager />, { wrapper: Wrapper })

    expect(screen.getByTestId('card-color-scheme')).toBeInTheDocument()
    expect(screen.getByTestId('card-font')).toBeInTheDocument()
    expect(screen.getByTestId('card-logo')).toBeInTheDocument()
    expect(screen.getByTestId('card-favicon')).toBeInTheDocument()
  })

  it('shows current color scheme name', () => {
    render(<BrandingManager />, { wrapper: Wrapper })

    expect(screen.getByText('dxt-default')).toBeInTheDocument()
  })

  it('shows logo placeholder when no logo URL', () => {
    render(<BrandingManager />, { wrapper: Wrapper })

    expect(screen.getByTestId('logo-placeholder')).toBeInTheDocument()
  })

  it('shows logo preview when logo URL exists', () => {
    vi.mocked(useSuspenseQuery).mockReturnValue({
      data: createMockLandingPageContent({
        theme: createMockThemeContent({ logoUrl: 'https://example.com/logo.png' }),
      }),
    } as ReturnType<typeof useSuspenseQuery>)

    render(<BrandingManager />, { wrapper: Wrapper })

    expect(screen.getByTestId('logo-preview')).toBeInTheDocument()
  })

  it('opens color scheme editor on Change click', async () => {
    const user = userEvent.setup()
    render(<BrandingManager />, { wrapper: Wrapper })

    await user.click(screen.getByTestId('edit-color-scheme-button'))

    expect(screen.getByTestId('color-scheme-editor')).toBeInTheDocument()
  })

  it('opens font selector on Change click', async () => {
    const user = userEvent.setup()
    render(<BrandingManager />, { wrapper: Wrapper })

    await user.click(screen.getByTestId('edit-font-button'))

    expect(screen.getByTestId('font-selector')).toBeInTheDocument()
  })

  it('opens logo uploader on Change click', async () => {
    const user = userEvent.setup()
    render(<BrandingManager />, { wrapper: Wrapper })

    await user.click(screen.getByTestId('edit-logo-button'))

    expect(screen.getByTestId('logo-uploader')).toBeInTheDocument()
  })

  it('opens favicon uploader on Change click', async () => {
    const user = userEvent.setup()
    render(<BrandingManager />, { wrapper: Wrapper })

    await user.click(screen.getByTestId('edit-favicon-button'))

    expect(screen.getByTestId('favicon-uploader')).toBeInTheDocument()
  })
})
