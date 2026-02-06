import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { createMockLandingPageContent } from '@/lib/test-utils/mock-factories'
import type { LandingPageContent } from '@/lib/content/queries'

// Mock the content query module
vi.mock('@/lib/admin/queries/content', () => ({
  contentQueryOptions: {
    queryKey: ['admin', 'content'] as const,
    queryFn: vi.fn(),
    staleTime: 60_000,
  },
}))

import { usePreviewData } from '@/lib/admin/queries/preview'

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

describe('usePreviewData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should aggregate all content sections into PreviewPayload', async () => {
    const mockContent = createMockLandingPageContent()
    const queryClient = createTestQueryClient(mockContent)

    const { result } = renderHook(() => usePreviewData(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    expect(result.current).toEqual({
      hero: mockContent.hero,
      pillars: mockContent.pillars,
      footer: mockContent.footer,
      systems: mockContent.systems,
      theme: mockContent.theme,
    })
  })

  it('should reflect updated cache state after optimistic update', async () => {
    const mockContent = createMockLandingPageContent()
    const queryClient = createTestQueryClient(mockContent)

    const { result, rerender } = renderHook(() => usePreviewData(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    // Simulate optimistic update to hero
    queryClient.setQueryData<LandingPageContent>(['admin', 'content'], (old) =>
      old ? { ...old, hero: { ...old.hero, title: 'Updated Title' } } : old,
    )

    rerender()

    await waitFor(() => {
      expect(result.current.hero.title).toBe('Updated Title')
    })
  })

  it('should include theme data with colorScheme and font', async () => {
    const mockContent = createMockLandingPageContent({
      theme: {
        colorScheme: 'ocean-blue',
        font: 'inter',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: null,
      },
    })
    const queryClient = createTestQueryClient(mockContent)

    const { result } = renderHook(() => usePreviewData(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.theme).toEqual({
        colorScheme: 'ocean-blue',
        font: 'inter',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: null,
      })
    })
  })

  it('should include footer with camelCase fields from cache', async () => {
    const mockContent = createMockLandingPageContent({
      footer: {
        copyright: '2026 Test',
        contactEmail: 'test@example.com',
        links: [{ label: 'About', url: '/about' }],
      },
    })
    const queryClient = createTestQueryClient(mockContent)

    const { result } = renderHook(() => usePreviewData(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.footer).toEqual({
        copyright: '2026 Test',
        contactEmail: 'test@example.com',
        links: [{ label: 'About', url: '/about' }],
      })
    })
  })
})
