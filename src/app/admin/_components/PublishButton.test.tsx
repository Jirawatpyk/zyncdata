import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock publish mutations module
const mockMutateAsync = vi.fn()
vi.mock('@/lib/admin/mutations/publish', () => ({
  publishStatusQueryOptions: {
    queryKey: ['admin', 'publish-status'] as const,
    queryFn: vi.fn(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  },
  usePublishChanges: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import PublishButton from './PublishButton'
import { usePublishChanges } from '@/lib/admin/mutations/publish'

interface PublishStatus {
  hasDrafts: boolean
  draftSections: string[]
}

function createTestQueryClient(status: PublishStatus) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['admin', 'publish-status'], status)
  return client
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('PublishButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ publishedAt: '2026-02-07T10:00:00Z' })
    vi.mocked(usePublishChanges).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as never)
  })

  it('should render "Publish Changes" button', () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.getByTestId('publish-button')).toBeInTheDocument()
    expect(screen.getByTestId('publish-button')).toHaveTextContent('Publish Changes')
  })

  it('should be disabled when hasDrafts is false', () => {
    const queryClient = createTestQueryClient({ hasDrafts: false, draftSections: [] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.getByTestId('publish-button')).toBeDisabled()
  })

  it('should be enabled when hasDrafts is true', () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.getByTestId('publish-button')).not.toBeDisabled()
  })

  it('should open confirmation dialog on click', async () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    fireEvent.click(screen.getByTestId('publish-button'))

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to publish these changes? They will be live immediately.')).toBeInTheDocument()
    })
  })

  it('should call mutateAsync on confirm', async () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    fireEvent.click(screen.getByTestId('publish-button'))

    await waitFor(() => {
      expect(screen.getByTestId('publish-confirm')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('publish-confirm'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })
  })

  it('should close dialog on cancel without publishing', async () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    fireEvent.click(screen.getByTestId('publish-button'))

    await waitFor(() => {
      expect(screen.getByTestId('publish-cancel')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('publish-cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to publish these changes?')).not.toBeInTheDocument()
    })

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('should show loading state during publish', () => {
    vi.mocked(usePublishChanges).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as never)

    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    // Open dialog first
    fireEvent.click(screen.getByTestId('publish-button'))

    // The confirm button shows "Publishing..." when isPending
    expect(screen.getByTestId('publish-confirm')).toHaveTextContent('Publishing...')
    expect(screen.getByTestId('publish-confirm')).toBeDisabled()
  })

  it('should show "Unpublished changes" badge when hasDrafts is true', () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.getByTestId('draft-badge')).toBeInTheDocument()
    expect(screen.getByTestId('draft-badge')).toHaveTextContent('Unpublished changes')
  })

  it('should NOT show draft badge when hasDrafts is false', () => {
    const queryClient = createTestQueryClient({ hasDrafts: false, draftSections: [] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.queryByTestId('draft-badge')).not.toBeInTheDocument()
  })

  it('should keep dialog open on error for retry', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Publish failed'))
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    fireEvent.click(screen.getByTestId('publish-button'))

    await waitFor(() => {
      expect(screen.getByTestId('publish-confirm')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('publish-confirm'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })

    // Dialog stays open on error for retry
    expect(screen.getByTestId('publish-confirm')).toBeInTheDocument()
  })

  it('should close dialog on successful publish', async () => {
    mockMutateAsync.mockResolvedValueOnce({ publishedAt: '2026-02-07T10:00:00Z' })
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    fireEvent.click(screen.getByTestId('publish-button'))

    await waitFor(() => {
      expect(screen.getByTestId('publish-confirm')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('publish-confirm'))

    await waitFor(() => {
      expect(screen.queryByTestId('publish-confirm')).not.toBeInTheDocument()
    })
  })

  it('should have min-h-11 for touch target', () => {
    const queryClient = createTestQueryClient({ hasDrafts: true, draftSections: ['hero'] })

    render(createElement(PublishButton), { wrapper: createWrapper(queryClient) })

    expect(screen.getByTestId('publish-button').className).toContain('min-h-11')
  })
})
