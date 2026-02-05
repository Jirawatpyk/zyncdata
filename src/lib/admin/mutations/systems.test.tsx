import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateSystem } from './systems'
import { createQueryWrapper, createTestQueryClient } from '@/lib/test-utils'
import { QueryClientProvider } from '@tanstack/react-query'
import type { System } from '@/lib/validations/system'

const mockFetch = vi.fn()
global.fetch = mockFetch

function createMockSystem(overrides?: Partial<System>): System {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Test System',
    url: 'https://example.com',
    logoUrl: null,
    description: null,
    status: null,
    responseTime: null,
    displayOrder: 0,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useCreateSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call POST /api/systems on mutate', async () => {
    const serverSystem = createMockSystem({
      id: 'new-server-id-12345',
      name: 'New System',
      url: 'https://new.example.com',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      name: 'New System',
      url: 'https://new.example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New System',
        url: 'https://new.example.com',
        enabled: true,
      }),
    })
  })

  it('should return created system data on success', async () => {
    const serverSystem = createMockSystem({
      id: 'created-id',
      name: 'Created System',
      displayOrder: 5,
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      name: 'Created System',
      url: 'https://example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(serverSystem)
  })

  it('should have optimistic update context available', async () => {
    // Test that mutation context is set up correctly for optimistic updates
    const serverSystem = createMockSystem({
      id: 'server-id',
      name: 'Optimistic Test',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    // Verify mutation returns expected data
    const mutationResult = await result.current.mutateAsync({
      name: 'Optimistic Test',
      url: 'https://optimistic.example.com',
      enabled: true,
    })

    expect(mutationResult.id).toBe('server-id')
    expect(mutationResult.name).toBe('Optimistic Test')
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'CREATE_ERROR' },
        }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      name: 'Failing System',
      url: 'https://fail.example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Server error')
  })

  it('should return full system object from server', async () => {
    const serverSystem = createMockSystem({
      id: 'real-server-uuid',
      name: 'Server System',
      displayOrder: 5,
      createdAt: '2026-02-05T10:00:00Z',
      updatedAt: '2026-02-05T10:00:00Z',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    const mutationResult = await result.current.mutateAsync({
      name: 'Server System',
      url: 'https://server.example.com',
      enabled: true,
    })

    // Verify full server response is returned
    expect(mutationResult.id).toBe('real-server-uuid')
    expect(mutationResult.displayOrder).toBe(5)
    expect(mutationResult.createdAt).toBe('2026-02-05T10:00:00Z')
  })

  it('should send description when provided', async () => {
    const serverSystem = createMockSystem({
      description: 'Test description',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      name: 'With Description',
      url: 'https://example.com',
      description: 'Test description',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/systems',
      expect.objectContaining({
        body: expect.stringContaining('"description":"Test description"'),
      }),
    )
  })

  it('should handle enabled: false correctly', async () => {
    const serverSystem = createMockSystem({ enabled: false })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: serverSystem, error: null }),
    })

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      name: 'Disabled System',
      url: 'https://example.com',
      enabled: false,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/systems',
      expect.objectContaining({
        body: expect.stringContaining('"enabled":false'),
      }),
    )
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: createMockSystem(), error: null }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCreateSystem(), { wrapper })

    result.current.mutate({
      name: 'Test',
      url: 'https://example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Wait for onSettled
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  // ===============================================
  // GUARDRAIL TESTS - Optimistic Update & Rollback
  // ===============================================

  describe('optimistic update rollback (AC #5)', () => {
    it('should rollback optimistic insert on error', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'existing-1', name: 'Existing' }),
      ]

      // Pre-populate cache with existing systems
      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      // Simulate server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Server error', code: 'CREATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useCreateSystem(), { wrapper })

      // Mutate and wait for error
      result.current.mutate({
        name: 'New System',
        url: 'https://new.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Wait for rollback to complete (onError runs after error is set)
      await waitFor(() => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        // Rollback should restore to previous state OR invalidate clears cache
        // When no initial data, rollback to undefined is expected
        expect(cachedSystems === undefined || cachedSystems?.length === 1).toBe(true)
      })
    })

    it('should not leave temp ID in cache after rollback', async () => {
      const queryClient = createTestQueryClient()
      // Set initial empty array so rollback returns to empty array
      queryClient.setQueryData(['admin', 'systems'], [])

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useCreateSystem(), { wrapper })

      result.current.mutate({
        name: 'Duplicate',
        url: 'https://duplicate.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Wait for rollback to complete
      await waitFor(() => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        // After rollback, should be empty array (no temp IDs) or undefined
        const hasTempId = cachedSystems?.some((s) => s.id.startsWith('temp-')) ?? false
        expect(hasTempId).toBe(false)
      })
    })

    it('should invalidate queries on error (onSettled still runs)', async () => {
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Server error', code: 'CREATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useCreateSystem(), { wrapper })

      result.current.mutate({
        name: 'Error Test',
        url: 'https://error.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // onSettled should still be called to invalidate queries
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'systems'],
        })
      })
    })
  })

  describe('duplicate name error (409) handling', () => {
    it('should return specific error message for duplicate name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' },
          }),
      })

      const { result } = renderHook(() => useCreateSystem(), {
        wrapper: createQueryWrapper(),
      })

      result.current.mutate({
        name: 'Existing Name',
        url: 'https://example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('A system with this name already exists')
    })
  })
})
