import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHealthMonitor } from './useHealthMonitor'
import { createQueryWrapper, createTestQueryClient } from '@/lib/test-utils'

// ── Mock Supabase Realtime ──────────────────────────────────────────────────
type SubscribeCallback = (status: string, err?: Error) => void
type PostgresChangesCallback = () => void

let mockSubscribeCallback: SubscribeCallback | null = null
let mockPostgresChangesCallback: PostgresChangesCallback | null = null
let mockRemoveChannel: ReturnType<typeof vi.fn>

const createMockChannel = () => {
  mockRemoveChannel = vi.fn()
  return {
    on: vi.fn((_event: string, _filter: unknown, callback: PostgresChangesCallback) => {
      mockPostgresChangesCallback = callback
      return {
        subscribe: vi.fn((callback: SubscribeCallback) => {
          mockSubscribeCallback = callback
          return {} // channel reference
        }),
      }
    }),
  }
}

let mockChannel: ReturnType<typeof createMockChannel>

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

// ── Tests ───────────────────────────────────────────────────────────────────
describe('useHealthMonitor', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = createTestQueryClient()
    mockChannel = createMockChannel()
    mockSubscribeCallback = null
    mockPostgresChangesCallback = null
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('subscribes to systems channel on mount (5.1)', () => {
    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'systems' },
      expect.any(Function),
    )
    expect(mockSubscribeCallback).not.toBeNull()
  })

  it('calls invalidateQueries on postgres_changes event with debounce (5.2)', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Simulate postgres_changes event
    act(() => {
      mockPostgresChangesCallback!()
    })

    // Should NOT call immediately (debounced)
    expect(invalidateSpy).not.toHaveBeenCalled()

    // Advance timer past debounce (2000ms)
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'health', 'dashboard'],
    })
  })

  it('debounces multiple rapid events into single invalidation (5.2 debounce)', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Simulate 5 rapid events (cron updating 5 systems)
    act(() => {
      mockPostgresChangesCallback!()
    })
    act(() => {
      vi.advanceTimersByTime(500)
      mockPostgresChangesCallback!()
    })
    act(() => {
      vi.advanceTimersByTime(500)
      mockPostgresChangesCallback!()
    })
    act(() => {
      vi.advanceTimersByTime(500)
      mockPostgresChangesCallback!()
    })
    act(() => {
      vi.advanceTimersByTime(500)
      mockPostgresChangesCallback!()
    })

    // Still within debounce window of last event
    expect(invalidateSpy).not.toHaveBeenCalled()

    // Advance past debounce from last event
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Only 1 invalidation despite 5 events
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('tracks connection state: SUBSCRIBED → connected (5.3)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.connectionState).toBe('disconnected')

    act(() => {
      mockSubscribeCallback!('SUBSCRIBED')
    })

    expect(result.current.connectionState).toBe('connected')
  })

  it('tracks connection state: TIMED_OUT → disconnected (5.3)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // First connect
    act(() => {
      mockSubscribeCallback!('SUBSCRIBED')
    })
    expect(result.current.connectionState).toBe('connected')

    // Then timeout
    act(() => {
      mockSubscribeCallback!('TIMED_OUT')
    })
    expect(result.current.connectionState).toBe('disconnected')
  })

  it('tracks connection state: CHANNEL_ERROR → reconnecting (5.3)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    act(() => {
      mockSubscribeCallback!('SUBSCRIBED')
    })

    act(() => {
      mockSubscribeCallback!('CHANNEL_ERROR')
    })

    expect(result.current.connectionState).toBe('reconnecting')
  })

  it('tracks connection state: CLOSED → disconnected (5.3)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    act(() => {
      mockSubscribeCallback!('SUBSCRIBED')
    })

    act(() => {
      mockSubscribeCallback!('CLOSED')
    })

    expect(result.current.connectionState).toBe('disconnected')
  })

  it('unsubscribes on unmount — no memory leak (5.4)', () => {
    const { unmount } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it('clears debounce timer on unmount (5.4)', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { unmount } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Trigger event, then unmount before debounce fires
    act(() => {
      mockPostgresChangesCallback!()
    })

    unmount()

    // Advance past debounce — should NOT fire after unmount
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('starts in disconnected state — polling fallback (5.5)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.connectionState).toBe('disconnected')
  })

  it('falls back to disconnected after 30s of CHANNEL_ERROR (M3 fix)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    act(() => {
      mockSubscribeCallback!('CHANNEL_ERROR')
    })
    expect(result.current.connectionState).toBe('reconnecting')

    // After 30s timeout, falls back to disconnected (non-transient error safety)
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.connectionState).toBe('disconnected')
  })

  it('clears reconnect timeout when SUBSCRIBED after CHANNEL_ERROR (M3 fix)', () => {
    const { result } = renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    act(() => {
      mockSubscribeCallback!('CHANNEL_ERROR')
    })
    expect(result.current.connectionState).toBe('reconnecting')

    // Recover before timeout
    act(() => {
      vi.advanceTimersByTime(5_000)
      mockSubscribeCallback!('SUBSCRIBED')
    })
    expect(result.current.connectionState).toBe('connected')

    // Original 30s timeout passes — should NOT revert to disconnected
    act(() => {
      vi.advanceTimersByTime(25_000)
    })
    expect(result.current.connectionState).toBe('connected')
  })
})
