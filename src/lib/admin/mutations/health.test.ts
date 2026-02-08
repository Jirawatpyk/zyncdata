import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useUpdateHealthConfig } from './health'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useUpdateHealthConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should call PATCH endpoint with correct URL and body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { checkInterval: 120, timeoutThreshold: null, failureThreshold: null },
        error: null,
      }),
    } as Response)

    const { result } = renderHook(() => useUpdateHealthConfig('sys-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      checkInterval: 120,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/systems/sys-123/health-config',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInterval: 120,
          timeoutThreshold: null,
          failureThreshold: null,
        }),
      }),
    )
  })

  it('should show success toast on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { checkInterval: null, timeoutThreshold: null, failureThreshold: null },
        error: null,
      }),
    } as Response)

    const { result } = renderHook(() => useUpdateHealthConfig('sys-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('Health check settings saved')
  })

  it('should show error toast on failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        data: null,
        error: { message: 'Server error', code: 'UPDATE_ERROR' },
      }),
    } as Response)

    const { result } = renderHook(() => useUpdateHealthConfig('sys-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      checkInterval: 60,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Failed to update health check settings')
  })
})
