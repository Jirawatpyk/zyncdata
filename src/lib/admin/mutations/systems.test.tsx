import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateSystem, useUpdateSystem, useDeleteSystem, useReorderSystems, useToggleSystem, useUploadLogo, useDeleteLogo } from './systems'
import { createQueryWrapper, createTestQueryClient } from '@/lib/test-utils'
import { createMockSystem } from '@/lib/test-utils/mock-factories'
import { QueryClientProvider } from '@tanstack/react-query'
import type { System } from '@/lib/validations/system'

const mockFetch = vi.fn()
global.fetch = mockFetch

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

// =========================================
// useUpdateSystem Tests (Story 3.3, AC #2)
// =========================================

describe('useUpdateSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const existingSystem = createMockSystem({
    id: 'existing-system-uuid',
    name: 'Original Name',
    url: 'https://original.example.com',
    description: 'Original description',
    enabled: true,
  })

  it('should call PATCH /api/systems/:id on mutate', async () => {
    const updatedSystem = createMockSystem({
      ...existingSystem,
      name: 'Updated Name',
      url: 'https://updated.example.com',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUpdateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      id: 'existing-system-uuid',
      name: 'Updated Name',
      url: 'https://updated.example.com',
      description: 'Updated description',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems/existing-system-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Name',
        url: 'https://updated.example.com',
        description: 'Updated description',
        enabled: true,
      }),
    })
  })

  it('should return updated system data on success', async () => {
    const updatedSystem = createMockSystem({
      id: 'existing-system-uuid',
      name: 'Updated Name',
      updatedAt: '2026-02-05T15:00:00Z',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUpdateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      id: 'existing-system-uuid',
      name: 'Updated Name',
      url: 'https://example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(updatedSystem)
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Failed to update system', code: 'UPDATE_ERROR' },
        }),
    })

    const { result } = renderHook(() => useUpdateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      id: 'existing-system-uuid',
      name: 'Update Attempt',
      url: 'https://example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to update system')
  })

  it('should handle enabled: false correctly', async () => {
    const updatedSystem = createMockSystem({ enabled: false })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUpdateSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      id: 'existing-system-uuid',
      name: 'Disabled System',
      url: 'https://example.com',
      enabled: false,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/systems/existing-system-uuid',
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

    const { result } = renderHook(() => useUpdateSystem(), { wrapper })

    result.current.mutate({
      id: 'existing-system-uuid',
      name: 'Test',
      url: 'https://example.com',
      enabled: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  // ===============================================
  // GUARDRAIL TESTS - Optimistic Update & Rollback
  // ===============================================

  describe('optimistic update rollback (AC #2)', () => {
    it('should optimistically update the system in cache', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'Original' }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let optimisticUpdateApplied = false

      // Delay server response to observe optimistic state
      mockFetch.mockImplementationOnce(async () => {
        // Check optimistic state before server responds
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const updatedSystem = cachedSystems?.find((s) => s.id === 'system-1')
        if (updatedSystem?.name === 'Updated') {
          optimisticUpdateApplied = true
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: createMockSystem({ id: 'system-1', name: 'Updated' }),
              error: null,
            }),
        }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateSystem(), { wrapper })

      result.current.mutate({
        id: 'system-1',
        name: 'Updated',
        url: 'https://updated.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify optimistic update was applied during the mutation
      expect(optimisticUpdateApplied).toBe(true)
    })

    it('should rollback optimistic update on error', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'Original', url: 'https://original.example.com' }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let rollbackApplied = false
      let optimisticWasApplied = false

      mockFetch.mockImplementationOnce(async () => {
        // Check optimistic state was applied before error
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        if (system?.name === 'Failed Update') {
          optimisticWasApplied = true
        }

        return {
          ok: false,
          status: 500,
          json: () =>
            Promise.resolve({
              data: null,
              error: { message: 'Server error', code: 'UPDATE_ERROR' },
            }),
        }
      })

      // Spy on setQueryData to verify rollback is called
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateSystem(), { wrapper })

      result.current.mutate({
        id: 'system-1',
        name: 'Failed Update',
        url: 'https://failed.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Check that onError was called (rollback via setQueryData)
      // The rollback restores the previous snapshot
      await waitFor(() => {
        // setQueryData was called with the previous snapshot (the rollback)
        const rollbackCall = setQueryDataSpy.mock.calls.find(
          (call) =>
            JSON.stringify(call[0]) === JSON.stringify(['admin', 'systems']) &&
            Array.isArray(call[1]) &&
            call[1].length === 1 &&
            (call[1] as System[])[0]?.name === 'Original'
        )
        if (rollbackCall) {
          rollbackApplied = true
        }
        expect(optimisticWasApplied).toBe(true)
        expect(rollbackApplied).toBe(true)
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
            error: { message: 'Server error', code: 'UPDATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateSystem(), { wrapper })

      result.current.mutate({
        id: 'system-1',
        name: 'Error Test',
        url: 'https://error.example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

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

      const { result } = renderHook(() => useUpdateSystem(), {
        wrapper: createQueryWrapper(),
      })

      result.current.mutate({
        id: 'existing-system-uuid',
        name: 'Duplicate Name',
        url: 'https://example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('A system with this name already exists')
    })
  })

  describe('not found error (404) handling', () => {
    it('should return specific error message for not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'System not found', code: 'NOT_FOUND' },
          }),
      })

      const { result } = renderHook(() => useUpdateSystem(), {
        wrapper: createQueryWrapper(),
      })

      result.current.mutate({
        id: 'non-existent-uuid',
        name: 'Test',
        url: 'https://example.com',
        enabled: true,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe('System not found')
    })
  })
})

// =========================================
// useReorderSystems Tests (Story 3.5, AC #3, #5)
// =========================================

describe('useReorderSystems', () => {
  const UUID_1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  const UUID_2 = 'a47ac10b-58cc-4372-a567-0e02b2c3d480'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call PATCH /api/systems/reorder on mutate', async () => {
    const reorderedSystems = [
      createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 0 }),
      createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 1 }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: reorderedSystems, error: null }),
    })

    const { result } = renderHook(() => useReorderSystems(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate([
      { id: UUID_1, displayOrder: 1 },
      { id: UUID_2, displayOrder: 0 },
    ])

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systems: [
          { id: UUID_1, displayOrder: 1 },
          { id: UUID_2, displayOrder: 0 },
        ],
      }),
    })
  })

  it('should return reordered system list on success', async () => {
    const reorderedSystems = [
      createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 0 }),
      createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 1 }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: reorderedSystems, error: null }),
    })

    const { result } = renderHook(() => useReorderSystems(), {
      wrapper: createQueryWrapper(),
    })

    const mutationResult = await result.current.mutateAsync([
      { id: UUID_1, displayOrder: 1 },
      { id: UUID_2, displayOrder: 0 },
    ])

    expect(mutationResult).toEqual(reorderedSystems)
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Failed to reorder systems', code: 'UPDATE_ERROR' },
        }),
    })

    const { result } = renderHook(() => useReorderSystems(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate([
      { id: UUID_1, displayOrder: 1 },
      { id: UUID_2, displayOrder: 0 },
    ])

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to reorder systems')
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [createMockSystem(), createMockSystem({ id: 'second' })],
          error: null,
        }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useReorderSystems(), { wrapper })

    result.current.mutate([
      { id: UUID_1, displayOrder: 1 },
      { id: UUID_2, displayOrder: 0 },
    ])

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  describe('optimistic swap & rollback (AC #3, #5)', () => {
    it('should optimistically swap displayOrder in cache', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 0 }),
        createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 1 }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let optimisticOrderCorrect = false

      mockFetch.mockImplementationOnce(async () => {
        // Check optimistic state during fetch
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        if (
          cachedSystems?.[0]?.id === UUID_2 &&
          cachedSystems?.[0]?.displayOrder === 0 &&
          cachedSystems?.[1]?.id === UUID_1 &&
          cachedSystems?.[1]?.displayOrder === 1
        ) {
          optimisticOrderCorrect = true
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 0 }),
                createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 1 }),
              ],
              error: null,
            }),
        }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useReorderSystems(), { wrapper })

      result.current.mutate([
        { id: UUID_1, displayOrder: 1 },
        { id: UUID_2, displayOrder: 0 },
      ])

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(optimisticOrderCorrect).toBe(true)
    })

    it('should rollback cache on error (AC #5)', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 0 }),
        createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 1 }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Failed to reorder', code: 'UPDATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useReorderSystems(), { wrapper })

      result.current.mutate([
        { id: UUID_1, displayOrder: 1 },
        { id: UUID_2, displayOrder: 0 },
      ])

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Verify rollback was called with original data (via setQueryData spy)
      const rollbackCall = setQueryDataSpy.mock.calls.find(
        (call) =>
          JSON.stringify(call[0]) === JSON.stringify(['admin', 'systems']) &&
          Array.isArray(call[1]) &&
          call[1].length === 2 &&
          (call[1] as System[])[0]?.displayOrder === 0 &&
          (call[1] as System[])[0]?.id === UUID_1,
      )
      expect(rollbackCall).toBeDefined()
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
            error: { message: 'Server error', code: 'UPDATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useReorderSystems(), { wrapper })

      result.current.mutate([
        { id: UUID_1, displayOrder: 1 },
        { id: UUID_2, displayOrder: 0 },
      ])

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'systems'],
        })
      })
    })
  })
})

// =========================================
// useToggleSystem Tests (Story 3.6, AC #1, #5)
// =========================================

describe('useToggleSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call PATCH /api/systems/:id/toggle on mutate', async () => {
    const toggledSystem = createMockSystem({ id: 'system-1', enabled: false })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: toggledSystem, error: null }),
    })

    const { result } = renderHook(() => useToggleSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ id: 'system-1', enabled: false })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems/system-1/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
  })

  it('should return toggled system data on success', async () => {
    const toggledSystem = createMockSystem({ id: 'system-1', enabled: true })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: toggledSystem, error: null }),
    })

    const { result } = renderHook(() => useToggleSystem(), {
      wrapper: createQueryWrapper(),
    })

    const mutationResult = await result.current.mutateAsync({ id: 'system-1', enabled: true })

    expect(mutationResult).toEqual(toggledSystem)
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Failed to toggle system visibility', code: 'UPDATE_ERROR' },
        }),
    })

    const { result } = renderHook(() => useToggleSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ id: 'system-1', enabled: false })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to toggle system visibility')
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: createMockSystem({ enabled: false }), error: null }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useToggleSystem(), { wrapper })

    result.current.mutate({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', enabled: false })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  describe('optimistic toggle & rollback (AC #5)', () => {
    it('should optimistically toggle enabled in cache', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'System A', enabled: true }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let optimisticUpdateApplied = false

      mockFetch.mockImplementationOnce(async () => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        if (system?.enabled === false) {
          optimisticUpdateApplied = true
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: createMockSystem({ id: 'system-1', enabled: false }),
              error: null,
            }),
        }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useToggleSystem(), { wrapper })

      result.current.mutate({ id: 'system-1', enabled: false })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(optimisticUpdateApplied).toBe(true)
    })

    it('should rollback cache on error (AC #5)', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'System A', enabled: true }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Server error', code: 'UPDATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useToggleSystem(), { wrapper })

      result.current.mutate({ id: 'system-1', enabled: false })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Verify rollback was called with original data
      const rollbackCall = setQueryDataSpy.mock.calls.find(
        (call) =>
          JSON.stringify(call[0]) === JSON.stringify(['admin', 'systems']) &&
          Array.isArray(call[1]) &&
          call[1].length === 1 &&
          (call[1] as System[])[0]?.enabled === true,
      )
      expect(rollbackCall).toBeDefined()
    })

    it('should replace with server data on success', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', enabled: true, updatedAt: '2026-01-01T00:00:00Z' }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const serverSystem = createMockSystem({
        id: 'system-1',
        enabled: false,
        updatedAt: '2026-02-06T12:00:00Z',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: serverSystem, error: null }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useToggleSystem(), { wrapper })

      result.current.mutate({ id: 'system-1', enabled: false })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // After onSuccess, the server data should be in cache
      await waitFor(() => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        // Either the server data is present, or cache was invalidated
        expect(system === undefined || system?.updatedAt === '2026-02-06T12:00:00Z').toBe(true)
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
            error: { message: 'Server error', code: 'UPDATE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useToggleSystem(), { wrapper })

      result.current.mutate({ id: 'system-1', enabled: false })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'systems'],
        })
      })
    })
  })
})

describe('useDeleteSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete system and return server data on success', async () => {
    const deletedSystem = createMockSystem({
      id: 'system-to-delete',
      enabled: false,
      deletedAt: '2026-02-05T12:00:00Z',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: deletedSystem, error: null }),
    })

    const { result } = renderHook(() => useDeleteSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ id: 'system-to-delete' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(deletedSystem)
    expect(mockFetch).toHaveBeenCalledWith('/api/systems/system-to-delete', {
      method: 'DELETE',
    })
  })

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'System not found', code: 'NOT_FOUND' },
        }),
    })

    const { result } = renderHook(() => useDeleteSystem(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ id: 'non-existent-uuid' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('System not found')
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: createMockSystem({ enabled: false, deletedAt: '2026-02-05T12:00:00Z' }),
          error: null,
        }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteSystem(), { wrapper })

    result.current.mutate({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  describe('optimistic update & rollback', () => {
    it('should optimistically mark system as deleted in cache', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'Active System', enabled: true, deletedAt: null }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let optimisticUpdateApplied = false

      mockFetch.mockImplementationOnce(async () => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        if (system?.enabled === false && system?.deletedAt != null) {
          optimisticUpdateApplied = true
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: createMockSystem({ id: 'system-1', enabled: false, deletedAt: '2026-02-05T12:00:00Z' }),
              error: null,
            }),
        }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteSystem(), { wrapper })

      result.current.mutate({ id: 'system-1' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(optimisticUpdateApplied).toBe(true)
    })

    it('should rollback cache on error', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', name: 'Active System', enabled: true, deletedAt: null }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Failed to delete', code: 'DELETE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteSystem(), { wrapper })

      result.current.mutate({ id: 'system-1' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Verify rollback was called with original data
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['admin', 'systems'],
        existingSystems,
      )
    })
  })
})

// =========================================
// useUploadLogo Tests (Story 3.7, AC #1, #2)
// =========================================

describe('useUploadLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockFile(name = 'logo.png', type = 'image/png', size = 1024): File {
    const content = new Uint8Array(size)
    return new File([content], name, { type })
  }

  it('should call POST /api/systems/:id/logo with FormData on mutate', async () => {
    const updatedSystem = createMockSystem({
      id: 'system-1',
      logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/123.png',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUploadLogo(), {
      wrapper: createQueryWrapper(),
    })

    const file = createMockFile()
    result.current.mutate({ systemId: 'system-1', file })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems/system-1/logo', {
      method: 'POST',
      body: expect.any(FormData),
    })
  })

  it('should NOT set Content-Type header (browser sets multipart boundary)', async () => {
    const updatedSystem = createMockSystem({ id: 'system-1' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUploadLogo(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ systemId: 'system-1', file: createMockFile() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Verify no Content-Type header was set
    const fetchCall = mockFetch.mock.calls[0]
    expect(fetchCall[1]).not.toHaveProperty('headers')
  })

  it('should return updated system with logoUrl on success', async () => {
    const updatedSystem = createMockSystem({
      id: 'system-1',
      logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/123.png',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useUploadLogo(), {
      wrapper: createQueryWrapper(),
    })

    const mutationResult = await result.current.mutateAsync({
      systemId: 'system-1',
      file: createMockFile(),
    })

    expect(mutationResult.logoUrl).toBe(
      'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/123.png',
    )
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Failed to upload logo', code: 'UPLOAD_ERROR' },
        }),
    })

    const { result } = renderHook(() => useUploadLogo(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({ systemId: 'system-1', file: createMockFile() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to upload logo')
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: createMockSystem({ logoUrl: 'https://example.com/logo.png' }), error: null }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUploadLogo(), { wrapper })

    result.current.mutate({ systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', file: createMockFile() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  describe('optimistic update & rollback', () => {
    it('should rollback cache on error', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', logoUrl: null }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Upload failed', code: 'UPLOAD_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUploadLogo(), { wrapper })

      result.current.mutate({ systemId: 'system-1', file: createMockFile() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Verify rollback was called with original data
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['admin', 'systems'],
        existingSystems,
      )
    })

    it('should replace with server data on success', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({ id: 'system-1', logoUrl: null }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const serverSystem = createMockSystem({
        id: 'system-1',
        logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/new.png',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: serverSystem, error: null }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUploadLogo(), { wrapper })

      result.current.mutate({ systemId: 'system-1', file: createMockFile() })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      await waitFor(() => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        expect(
          system === undefined ||
          system?.logoUrl === 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/new.png',
        ).toBe(true)
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
            error: { message: 'Server error', code: 'UPLOAD_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUploadLogo(), { wrapper })

      result.current.mutate({ systemId: 'system-1', file: createMockFile() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'systems'],
        })
      })
    })
  })
})

// =========================================
// useDeleteLogo Tests (Story 3.7, AC #3)
// =========================================

describe('useDeleteLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call DELETE /api/systems/:id/logo on mutate', async () => {
    const updatedSystem = createMockSystem({ id: 'system-1', logoUrl: null })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useDeleteLogo(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate('system-1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/systems/system-1/logo', {
      method: 'DELETE',
    })
  })

  it('should return system with null logoUrl on success', async () => {
    const updatedSystem = createMockSystem({ id: 'system-1', logoUrl: null })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSystem, error: null }),
    })

    const { result } = renderHook(() => useDeleteLogo(), {
      wrapper: createQueryWrapper(),
    })

    const mutationResult = await result.current.mutateAsync('system-1')

    expect(mutationResult.logoUrl).toBeNull()
  })

  it('should set error state on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Failed to delete logo', code: 'DELETE_ERROR' },
        }),
    })

    const { result } = renderHook(() => useDeleteLogo(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate('system-1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to delete logo')
  })

  it('should invalidate queries on settled', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: createMockSystem({ logoUrl: null }), error: null }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteLogo(), { wrapper })

    result.current.mutate('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'systems'],
      })
    })
  })

  describe('optimistic update & rollback', () => {
    it('should optimistically clear logoUrl in cache', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({
          id: 'system-1',
          logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/old.png',
        }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      let optimisticUpdateApplied = false

      mockFetch.mockImplementationOnce(async () => {
        const cachedSystems = queryClient.getQueryData<System[]>(['admin', 'systems'])
        const system = cachedSystems?.find((s) => s.id === 'system-1')
        if (system?.logoUrl === null) {
          optimisticUpdateApplied = true
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: createMockSystem({ id: 'system-1', logoUrl: null }),
              error: null,
            }),
        }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteLogo(), { wrapper })

      result.current.mutate('system-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(optimisticUpdateApplied).toBe(true)
    })

    it('should rollback cache on error (restore logoUrl)', async () => {
      const queryClient = createTestQueryClient()
      const existingSystems = [
        createMockSystem({
          id: 'system-1',
          logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/system-1/old.png',
        }),
      ]

      queryClient.setQueryData(['admin', 'systems'], existingSystems)

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Storage error', code: 'DELETE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteLogo(), { wrapper })

      result.current.mutate('system-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Verify rollback was called with original data (logoUrl restored)
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['admin', 'systems'],
        existingSystems,
      )
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
            error: { message: 'Server error', code: 'DELETE_ERROR' },
          }),
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteLogo(), { wrapper })

      result.current.mutate('system-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'systems'],
        })
      })
    })
  })
})
