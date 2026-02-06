import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { useUpdateSection } from './content'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockHeroContent, createMockLandingPageContent } from '@/lib/test-utils/mock-factories'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useUpdateSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call PATCH /api/content/[section] on mutate', async () => {
    const heroContent = createMockHeroContent()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { id: '1', section_name: 'hero', content: heroContent },
        error: null,
      }),
    })

    const { result } = renderHook(() => useUpdateSection(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      section: 'hero',
      content: heroContent as unknown as Record<string, unknown>,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/content/hero', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(heroContent),
    })
  })

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        data: null,
        error: { message: 'Failed', code: 'UPDATE_ERROR' },
      }),
    })

    const { result } = renderHook(() => useUpdateSection(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      section: 'hero',
      content: createMockHeroContent() as unknown as Record<string, unknown>,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should call toast.success on success', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { id: '1', section_name: 'hero', content: {} },
        error: null,
      }),
    })

    const { result } = renderHook(() => useUpdateSection(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      section: 'hero',
      content: createMockHeroContent() as unknown as Record<string, unknown>,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(toast.success).toHaveBeenCalledWith('Content updated')
  })

  it('should optimistically update query cache on mutate', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const originalContent = createMockLandingPageContent()
    queryClient.setQueryData(['admin', 'content'], originalContent)

    // Never resolve — we inspect cache during onMutate
    mockFetch.mockReturnValueOnce(new Promise(() => {}))

    const { result } = renderHook(() => useUpdateSection(), {
      wrapper: createQueryWrapper(queryClient),
    })

    const updatedHero = { title: 'New Title', subtitle: 'New Sub', description: 'New Desc' }
    result.current.mutate({
      section: 'hero',
      content: updatedHero as unknown as Record<string, unknown>,
    })

    // Wait for onMutate to run
    await waitFor(() => {
      const cached = queryClient.getQueryData<Record<string, unknown>>(['admin', 'content'])
      expect(cached?.hero).toEqual(updatedHero)
    })
  })

  it('should rollback query cache on error', async () => {
    const { toast } = await import('sonner')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const originalContent = createMockLandingPageContent()
    queryClient.setQueryData(['admin', 'content'], originalContent)

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        data: null,
        error: { message: 'Server error', code: 'UPDATE_ERROR' },
      }),
    })

    const { result } = renderHook(() => useUpdateSection(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({
      section: 'hero',
      content: { title: 'Will Fail' } as unknown as Record<string, unknown>,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Cache should be rolled back to original content
    const cached = queryClient.getQueryData<Record<string, unknown>>(['admin', 'content'])
    expect(cached?.hero).toEqual(originalContent.hero)
    expect(toast.error).toHaveBeenCalledWith('Failed to update content')
  })
})
