import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHealthMonitor } from './useHealthMonitor'
import { createQueryWrapper, createTestQueryClient } from '@/lib/test-utils'

// ── Mock Supabase Realtime ──────────────────────────────────────────────────
type PostgresChangesCallback = (payload: unknown) => void

let mockPostgresChangesCallback: PostgresChangesCallback | null = null
let mockRemoveChannel: ReturnType<typeof vi.fn>

const createMockChannel = () => {
  mockRemoveChannel = vi.fn()
  return {
    on: vi.fn((_event: string, _filter: unknown, callback: PostgresChangesCallback) => {
      mockPostgresChangesCallback = callback
      return {
        subscribe: vi.fn(() => ({})),
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

// ── Contract Tests ──────────────────────────────────────────────────────────
describe('useHealthMonitor contract tests', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = createTestQueryClient()
    mockChannel = createMockChannel()
    mockPostgresChangesCallback = null
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('subscribes to correct postgres_changes filter for systems table (8.1)', () => {
    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Verify channel subscribes to the correct filter matching API route columns
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'systems',
      },
      expect.any(Function),
    )
  })

  it('handles valid postgres_changes UPDATE payload with expected columns (8.1)', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Simulate a real Supabase postgres_changes payload
    const realtimePayload = {
      schema: 'public',
      table: 'systems',
      commit_timestamp: '2026-02-08T10:00:00Z',
      eventType: 'UPDATE',
      new: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'API Gateway',
        url: 'https://api.example.com',
        status: 'online',
        response_time: 150,
        last_checked_at: '2026-02-08T10:00:00Z',
        enabled: true,
        display_order: 1,
      },
      old: {
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
      errors: null,
    }

    act(() => {
      mockPostgresChangesCallback!(realtimePayload)
    })

    // Should trigger debounced invalidation
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['admin', 'health', 'dashboard'],
    })
  })

  it('handles unexpected/malformed payload gracefully — no crash (8.2)', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useHealthMonitor(), {
      wrapper: createQueryWrapper(queryClient),
    })

    // Malformed payloads — should not crash, still triggers invalidation
    const malformedPayloads = [
      null,
      undefined,
      {},
      { new: null },
      { new: { unexpected_field: 'value' } },
      'not-an-object',
      42,
    ]

    for (const payload of malformedPayloads) {
      act(() => {
        // Should NOT throw
        expect(() => mockPostgresChangesCallback!(payload)).not.toThrow()
      })
    }

    // Advance past debounce — invalidation still triggers (hook uses invalidation strategy, not payload parsing)
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })
})
