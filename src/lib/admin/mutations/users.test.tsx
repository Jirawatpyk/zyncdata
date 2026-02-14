import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateUser } from './users'
import { createQueryWrapper } from '@/lib/test-utils'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call POST /api/users on mutate', async () => {
    const serverUser = {
      id: 'new-user-id',
      email: 'new@dxt.com',
      role: 'admin',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-14T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverUser, error: null }),
    })

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ email: 'new@dxt.com', role: 'admin' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@dxt.com', role: 'admin' }),
    })
  })

  it('should return created user data on success', async () => {
    const serverUser = {
      id: 'created-id',
      email: 'created@dxt.com',
      role: 'user',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-14T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverUser, error: null }),
    })

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ email: 'created@dxt.com', role: 'user' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(serverUser)
  })

  it('should set error state on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'A user with this email already exists', code: 'CONFLICT' },
        }),
    })

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ email: 'dup@dxt.com', role: 'admin' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('A user with this email already exists')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ email: 'test@dxt.com', role: 'admin' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
