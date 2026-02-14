import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateUser, useUpdateUserRole } from './users'
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

describe('useUpdateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call PATCH /api/users/:userId on mutate', async () => {
    const updatedUser = {
      id: 'user-002',
      email: 'target@dxt.com',
      role: 'admin',
      isConfirmed: true,
      lastSignInAt: null,
      createdAt: '2026-01-01T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUser, error: null }),
    })

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ userId: 'user-002', role: 'admin' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/users/user-002', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    })
  })

  it('should return updated user data on success', async () => {
    const updatedUser = {
      id: 'user-003',
      email: 'updated@dxt.com',
      role: 'super_admin',
      isConfirmed: true,
      lastSignInAt: '2026-02-10T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUser, error: null }),
    })

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ userId: 'user-003', role: 'super_admin' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(updatedUser)
  })

  it('should set error state on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'At least one Super Admin is required', code: 'CONFLICT' },
        }),
    })

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ userId: 'sa-only', role: 'admin' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('At least one Super Admin is required')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useUpdateUserRole(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ userId: 'user-001', role: 'user' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
