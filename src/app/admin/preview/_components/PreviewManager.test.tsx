import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { createMockLandingPageContent } from '@/lib/test-utils/mock-factories'
import type { LandingPageContent } from '@/lib/content/queries'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock content query
vi.mock('@/lib/admin/queries/content', () => ({
  contentQueryOptions: {
    queryKey: ['admin', 'content'] as const,
    queryFn: vi.fn(),
    staleTime: 60_000,
  },
}))

// Mock fetch for preview API
const mockFetch = vi.fn()
global.fetch = mockFetch

import PreviewManager from './PreviewManager'

function createTestQueryClient(initialData?: LandingPageContent) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  if (initialData) {
    client.setQueryData(['admin', 'content'], initialData)
  }
  return client
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('PreviewManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: '<html><body><h1>Preview HTML</h1></body></html>',
          error: null,
        }),
    })
  })

  it('should render preview page with Back to Editor button', async () => {
    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to editor/i })).toBeInTheDocument()
    })
  })

  it('should navigate back when Back to Editor is clicked', async () => {
    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to editor/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /back to editor/i }))
    expect(mockPush).toHaveBeenCalledWith('/admin/content')
  })

  it('should render device toolbar buttons', async () => {
    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /tablet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /desktop/i })).toBeInTheDocument()
  })

  it('should call POST /api/preview with content data', async () => {
    const mockContent = createMockLandingPageContent()
    const queryClient = createTestQueryClient(mockContent)

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/preview', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }))
    })
  })

  it('should render PreviewFrame with HTML from API', async () => {
    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(screen.getByTitle('Preview')).toBeInTheDocument()
    })
  })

  it('should show loading state while fetching preview', () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ data: '<html></html>', error: null }),
      }), 500)),
    )

    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    expect(screen.getByText(/loading preview/i)).toBeInTheDocument()
  })

  it('should show error when preview API fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ data: null, error: { message: 'Failed', code: 'INTERNAL_ERROR' } }),
    })

    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      expect(screen.getByText(/failed to load preview/i)).toBeInTheDocument()
    })
  })

  it('should have min-h-11 on Back to Editor button for touch target', async () => {
    const queryClient = createTestQueryClient(createMockLandingPageContent())

    render(createElement(PreviewManager), { wrapper: createWrapper(queryClient) })

    await waitFor(() => {
      const backBtn = screen.getByRole('button', { name: /back to editor/i })
      expect(backBtn.className).toContain('min-h-11')
    })
  })
})
