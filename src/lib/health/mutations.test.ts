import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/health/check', () => ({
  checkSystemHealthWithRetry: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockSendFailureNotification = vi.fn()
const mockSendRecoveryNotification = vi.fn()
vi.mock('@/lib/health/notifications', () => ({
  sendFailureNotification: (...args: unknown[]) => mockSendFailureNotification(...args),
  sendRecoveryNotification: (...args: unknown[]) => mockSendRecoveryNotification(...args),
}))

import { createServiceClient } from '@/lib/supabase/service'
import { checkSystemHealthWithRetry } from '@/lib/health/check'
import { revalidatePath } from 'next/cache'
import {
  recordHealthCheck,
  updateSystemHealthStatus,
  incrementConsecutiveFailures,
  resetConsecutiveFailures,
  runAllHealthChecks,
  withConcurrencyLimit,
  DEFAULT_FAILURE_THRESHOLD,
  DEFAULT_CONCURRENCY_LIMIT,
  MAX_JITTER_MS,
} from '@/lib/health/mutations'
import type { HealthCheckResult } from '@/lib/validations/health'

describe('recordHealthCheck', () => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({
      data: {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'success',
        response_time: 150,
        error_message: null,
        checked_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelect })
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should insert health check with snake_case mapping', async () => {
    const input: HealthCheckResult = {
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 150,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    }

    await recordHealthCheck(input)

    expect(mockInsert).toHaveBeenCalledWith({
      system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      response_time: 150,
      error_message: null,
      checked_at: '2026-01-01T00:00:00Z',
    })
  })

  it('should return parsed camelCase HealthCheck', async () => {
    const input: HealthCheckResult = {
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 150,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    }

    const result = await recordHealthCheck(input)

    expect(result).toEqual({
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 150,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })
  })

  it('should throw on Supabase error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

    const input: HealthCheckResult = {
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Timeout',
      checkedAt: '2026-01-01T00:00:00Z',
    }

    await expect(recordHealthCheck(input)).rejects.toThrow()
  })
})

describe('updateSystemHealthStatus', () => {
  const mockEq = vi.fn()
  const mockUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should update status, response_time, and last_checked_at on success', async () => {
    await updateSystemHealthStatus('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'online', 150)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'online',
        response_time: 150,
        last_checked_at: expect.any(String),
      }),
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should NOT include status when null (failure case)', async () => {
    await updateSystemHealthStatus('f47ac10b-58cc-4372-a567-0e02b2c3d479', null, null)

    const updateArg = mockUpdate.mock.calls[0][0]
    expect(updateArg).not.toHaveProperty('status')
    expect(updateArg.response_time).toBeNull()
    expect(updateArg.last_checked_at).toEqual(expect.any(String))
  })

  it('should throw on Supabase error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Update failed' } })

    await expect(
      updateSystemHealthStatus('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'online', 100),
    ).rejects.toThrow()
  })
})

describe('incrementConsecutiveFailures', () => {
  const mockReadSingle = vi.fn()
  const mockReadEq = vi.fn()
  const mockReadSelect = vi.fn()
  const mockWriteEq = vi.fn()
  const mockWriteUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Read chain: from('systems').select('consecutive_failures').eq('id', ...).single()
    mockReadSingle.mockResolvedValue({
      data: { consecutive_failures: 2 },
      error: null,
    })
    mockReadEq.mockReturnValue({ single: mockReadSingle })
    mockReadSelect.mockReturnValue({ eq: mockReadEq })

    // Write chain: from('systems').update({ consecutive_failures: N }).eq('id', ...)
    mockWriteEq.mockResolvedValue({ error: null })
    mockWriteUpdate.mockReturnValue({ eq: mockWriteEq })

    let callCount = 0
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: mockReadSelect }
        }
        return { update: mockWriteUpdate }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should increment and return new count', async () => {
    const newCount = await incrementConsecutiveFailures('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(newCount).toBe(3)
    expect(mockReadSelect).toHaveBeenCalledWith('consecutive_failures')
    expect(mockWriteUpdate).toHaveBeenCalledWith({ consecutive_failures: 3 })
    expect(mockWriteEq).toHaveBeenCalledWith('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should handle null consecutive_failures (defaults to 0)', async () => {
    mockReadSingle.mockResolvedValue({
      data: { consecutive_failures: null },
      error: null,
    })

    const newCount = await incrementConsecutiveFailures('test-id')

    expect(newCount).toBe(1)
    expect(mockWriteUpdate).toHaveBeenCalledWith({ consecutive_failures: 1 })
  })

  it('should throw on read error', async () => {
    mockReadSingle.mockResolvedValue({
      data: null,
      error: { message: 'Read failed' },
    })

    await expect(incrementConsecutiveFailures('test-id')).rejects.toThrow()
  })

  it('should throw on write error', async () => {
    mockWriteEq.mockResolvedValue({ error: { message: 'Write failed' } })

    await expect(incrementConsecutiveFailures('test-id')).rejects.toThrow()
  })
})

describe('resetConsecutiveFailures', () => {
  const mockEq = vi.fn()
  const mockUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should set consecutive_failures to 0', async () => {
    await resetConsecutiveFailures('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockUpdate).toHaveBeenCalledWith({ consecutive_failures: 0 })
    expect(mockEq).toHaveBeenCalledWith('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should throw on Supabase error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Reset failed' } })

    await expect(resetConsecutiveFailures('test-id')).rejects.toThrow()
  })
})

describe('DEFAULT_FAILURE_THRESHOLD', () => {
  it('should be 3', () => {
    expect(DEFAULT_FAILURE_THRESHOLD).toBe(3)
  })
})

describe('concurrency constants', () => {
  it('should enforce concurrency limit matches exported constant', () => {
    // Behavioral verification: the constant that runAllHealthChecks uses
    // should match the documented limit of 5 concurrent requests
    expect(DEFAULT_CONCURRENCY_LIMIT).toBe(5)
    expect(MAX_JITTER_MS).toBeLessThanOrEqual(1000) // Jitter must not exceed 1s to stay within cron budget
  })
})

describe('withConcurrencyLimit', () => {
  it('should execute all tasks and return results', async () => {
    const tasks = [
      () => Promise.resolve('a'),
      () => Promise.resolve('b'),
      () => Promise.resolve('c'),
    ]

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(3)
    expect(results[0]).toEqual({ status: 'fulfilled', value: 'a' })
    expect(results[1]).toEqual({ status: 'fulfilled', value: 'b' })
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'c' })
  })

  it('should preserve result order matching input task order', async () => {
    // Task 0 is slow, task 1 is fast — results should still be in [0, 1] order
    const tasks = [
      () => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 50)),
      () => Promise.resolve('fast'),
    ]

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'slow' })
    expect(results[1]).toEqual({ status: 'fulfilled', value: 'fast' })
  })

  it('should limit concurrent requests to the specified limit', async () => {
    let activeConcurrent = 0
    let maxConcurrent = 0

    const createTask = (delay: number) => async () => {
      activeConcurrent++
      maxConcurrent = Math.max(maxConcurrent, activeConcurrent)
      await new Promise((resolve) => setTimeout(resolve, delay))
      activeConcurrent--
      return delay
    }

    // 10 tasks with limit of 5
    const tasks = Array.from({ length: 10 }, (_, i) => createTask(10 + i))
    await withConcurrencyLimit(tasks, 5)

    expect(maxConcurrent).toBeLessThanOrEqual(5)
    expect(maxConcurrent).toBeGreaterThan(1) // Verify parallelism happened
  })

  it('should handle all tasks completing with limit of 5 and 1 system', async () => {
    const tasks = [() => Promise.resolve('only-one')]

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ status: 'fulfilled', value: 'only-one' })
  })

  it('should handle exactly 5 systems (single batch)', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => () => Promise.resolve(i))

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(results[i]).toEqual({ status: 'fulfilled', value: i })
    }
  })

  it('should handle 10 systems (two batches) correctly', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => () => Promise.resolve(i))

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect(results[i]).toEqual({ status: 'fulfilled', value: i })
    }
  })

  it('should handle 15 systems (three batches) correctly', async () => {
    const tasks = Array.from({ length: 15 }, (_, i) => () => Promise.resolve(i))

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(15)
    for (let i = 0; i < 15; i++) {
      expect(results[i]).toEqual({ status: 'fulfilled', value: i })
    }
  })

  it('should capture rejected tasks without blocking subsequent batches', async () => {
    const tasks = [
      () => Promise.resolve('ok-1'),
      () => Promise.reject(new Error('fail-batch-1')),
      () => Promise.resolve('ok-2'),
      () => Promise.reject(new Error('fail-batch-2')),
      () => Promise.resolve('ok-3'),
      // Second batch (limit=5, these are 6+)
      () => Promise.resolve('ok-4'),
      () => Promise.resolve('ok-5'),
    ]

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(7)
    expect(results[0]).toEqual({ status: 'fulfilled', value: 'ok-1' })
    expect(results[1].status).toBe('rejected')
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'ok-2' })
    expect(results[3].status).toBe('rejected')
    expect(results[4]).toEqual({ status: 'fulfilled', value: 'ok-3' })
    expect(results[5]).toEqual({ status: 'fulfilled', value: 'ok-4' })
    expect(results[6]).toEqual({ status: 'fulfilled', value: 'ok-5' })
  })

  it('should handle empty task array', async () => {
    const results = await withConcurrencyLimit([], 5)

    expect(results).toEqual([])
  })

  it('should enforce sequential execution when limit is 1', async () => {
    let activeConcurrent = 0
    let maxConcurrent = 0

    const createTask = (delay: number) => async () => {
      activeConcurrent++
      maxConcurrent = Math.max(maxConcurrent, activeConcurrent)
      await new Promise((resolve) => setTimeout(resolve, delay))
      activeConcurrent--
      return delay
    }

    const tasks = Array.from({ length: 5 }, (_, i) => createTask(10 + i))
    const results = await withConcurrencyLimit(tasks, 1)

    expect(maxConcurrent).toBe(1)
    expect(results).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(results[i]).toEqual({ status: 'fulfilled', value: 10 + i })
    }
  })

  it('should not drop any tasks', async () => {
    let completedCount = 0
    const tasks = Array.from({ length: 12 }, () => async () => {
      completedCount++
      return completedCount
    })

    const results = await withConcurrencyLimit(tasks, 5)

    expect(results).toHaveLength(12)
    // All results should be fulfilled
    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    expect(fulfilled).toHaveLength(12)
  })
})

describe('runAllHealthChecks', () => {
  // Complex mock setup: the service client is called multiple times for different tables/operations.
  // We use a stateful factory to dispatch correct mocks based on table + operation sequence.
  const mockIs = vi.fn()
  const mockEqForSelect = vi.fn()
  const mockSelectSystems = vi.fn()
  const mockInsertSingle = vi.fn()
  const mockInsertSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdateEq = vi.fn()
  const mockUpdate = vi.fn()
  // Counter read chain (for incrementConsecutiveFailures)
  const mockCounterSingle = vi.fn()
  const mockCounterEq = vi.fn()
  const mockCounterSelect = vi.fn()

  function setupServiceClientMock() {
    let systemsSelectDone = false
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'systems' && !systemsSelectDone) {
          systemsSelectDone = true
          return { select: mockSelectSystems }
        }
        if (table === 'health_checks') {
          return { insert: mockInsert }
        }
        // systems update or counter read — dispatch by return chain
        return {
          update: mockUpdate,
          select: mockCounterSelect,
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Eliminate jitter randomness in tests — all jitter delays become 0ms
    vi.spyOn(Math, 'random').mockReturnValue(0)

    mockSendFailureNotification.mockResolvedValue(undefined)
    mockSendRecoveryNotification.mockResolvedValue(undefined)

    // Default: two enabled systems with status 'online'
    mockIs.mockResolvedValue({
      data: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' },
        { id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590', name: 'System 2', url: 'https://system2.com', status: 'online' },
      ],
      error: null,
    })
    mockEqForSelect.mockReturnValue({ is: mockIs })
    mockSelectSystems.mockReturnValue({ eq: mockEqForSelect })

    // Record health check (insert)
    mockInsertSingle.mockResolvedValue({
      data: {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'success',
        response_time: 100,
        error_message: null,
        checked_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    mockInsertSelect.mockReturnValue({ single: mockInsertSingle })
    mockInsert.mockReturnValue({ select: mockInsertSelect })

    // Update system status
    mockUpdateEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockUpdateEq })

    // Counter read chain (incrementConsecutiveFailures reads then writes)
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 0 },
      error: null,
    })
    mockCounterEq.mockReturnValue({ single: mockCounterSingle })
    mockCounterSelect.mockReturnValue({ eq: mockCounterEq })

    setupServiceClientMock()

    // Default: all checks succeed
    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })
  })

  it('should fetch enabled, non-deleted systems with status column', async () => {
    await runAllHealthChecks()

    expect(mockSelectSystems).toHaveBeenCalledWith('id, name, url, status')
    expect(mockEqForSelect).toHaveBeenCalledWith('enabled', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('should run checks concurrently using checkSystemHealthWithRetry', async () => {
    await runAllHealthChecks()

    expect(checkSystemHealthWithRetry).toHaveBeenCalledTimes(2)
    expect(checkSystemHealthWithRetry).toHaveBeenCalledWith({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      url: 'https://system1.com',
    })
    expect(checkSystemHealthWithRetry).toHaveBeenCalledWith({
      id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
      url: 'https://system2.com',
    })
  })

  it('should return empty array when no systems exist', async () => {
    mockIs.mockResolvedValue({ data: [], error: null })

    const results = await runAllHealthChecks()

    expect(results).toEqual([])
    expect(checkSystemHealthWithRetry).not.toHaveBeenCalled()
  })

  it('should call revalidatePath after completion', async () => {
    await runAllHealthChecks()

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should reset failure counter on success (AC #2)', async () => {
    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })

    // Single system for clarity
    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    await runAllHealthChecks()

    // resetConsecutiveFailures calls update({ consecutive_failures: 0 })
    expect(mockUpdate).toHaveBeenCalledWith({ consecutive_failures: 0 })
    // updateSystemHealthStatus calls update with status: 'online'
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'online' }),
    )
  })

  it('should mark system offline after reaching failure threshold (AC #1)', async () => {
    // System with 2 consecutive failures (threshold - 1)
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 2 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Request timed out',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await runAllHealthChecks()

    // incrementConsecutiveFailures: writes 3 (2+1)
    expect(mockUpdate).toHaveBeenCalledWith({ consecutive_failures: 3 })
    // updateSystemHealthStatus sets offline (3 >= threshold)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'offline' }),
    )

    consoleSpy.mockRestore()
  })

  it('should NOT change status below failure threshold', async () => {
    // System with 0 consecutive failures
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 0 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Request timed out',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    await runAllHealthChecks()

    // incrementConsecutiveFailures: writes 1 (0+1)
    expect(mockUpdate).toHaveBeenCalledWith({ consecutive_failures: 1 })
    // updateSystemHealthStatus called with null status (keep previous)
    const updateCalls = mockUpdate.mock.calls
    const statusUpdateCall = updateCalls.find(
      (call) => call[0]?.last_checked_at !== undefined && call[0]?.status === undefined,
    )
    expect(statusUpdateCall).toBeTruthy()
  })

  it('should recover system from offline to online (AC #2)', async () => {
    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })

    // System is currently offline
    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'offline' }],
      error: null,
    })

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await runAllHealthChecks()

    // Should log recovery transition
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('offline → online (recovered)'),
    )

    consoleSpy.mockRestore()
  })

  it('should log transition when system goes offline', async () => {
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 2 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Request timed out',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await runAllHealthChecks()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('online → offline (3 consecutive failures)'),
    )

    consoleSpy.mockRestore()
  })

  it('should handle partial failures — one failure does not block others', async () => {
    // Use mockImplementation to return results based on system ID (not call order)
    // because concurrency limiter with jitter may invoke tasks out of order
    vi.mocked(checkSystemHealthWithRetry).mockImplementation(
      (system: { id: string; url: string }) => {
        if (system.id === 'f47ac10b-58cc-4372-a567-0e02b2c3d479') {
          return Promise.resolve({
            systemId: system.id,
            status: 'success',
            responseTime: 100,
            errorMessage: null,
            checkedAt: '2026-01-01T00:00:00Z',
          })
        }
        return Promise.resolve({
          systemId: system.id,
          status: 'failure',
          responseTime: null,
          errorMessage: 'Request timed out',
          checkedAt: '2026-01-01T00:00:00Z',
        })
      },
    )

    const results = await runAllHealthChecks()

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('success')
    expect(results[1].status).toBe('failure')
  })

  it('should continue processing when recordHealthCheck throws for one system', async () => {
    // Use mockImplementation for deterministic results regardless of call order
    vi.mocked(checkSystemHealthWithRetry).mockImplementation(
      (system: { id: string; url: string }) =>
        Promise.resolve({
          systemId: system.id,
          status: 'success' as const,
          responseTime: system.id === 'f47ac10b-58cc-4372-a567-0e02b2c3d479' ? 100 : 200,
          errorMessage: null,
          checkedAt: '2026-01-01T00:00:00Z',
        }),
    )

    // First system's DB insert fails, second succeeds
    let insertCallCount = 0
    mockInsertSingle.mockImplementation(() => {
      insertCallCount++
      if (insertCallCount === 1) {
        return Promise.resolve({ data: null, error: { message: 'DB error' } })
      }
      return Promise.resolve({
        data: {
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          system_id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
          status: 'success',
          response_time: 200,
          error_message: null,
          checked_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      })
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const results = await runAllHealthChecks()

    // Both results returned despite DB error on first
    expect(results).toHaveLength(2)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to record result for system'),
      expect.anything(),
    )
    // revalidatePath still called
    expect(revalidatePath).toHaveBeenCalledWith('/')

    consoleSpy.mockRestore()
  })

  it('should throw when fetching systems fails', async () => {
    mockIs.mockResolvedValue({ data: null, error: { message: 'Connection failed' } })

    await expect(runAllHealthChecks()).rejects.toThrow()
  })

  // ── Notification integration tests (Story 5-6) ──────────────────

  it('should call sendFailureNotification on first offline transition (AC #1)', async () => {
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 2 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Connection refused',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    vi.spyOn(console, 'info').mockImplementation(() => {})

    await runAllHealthChecks()

    expect(mockSendFailureNotification).toHaveBeenCalledTimes(1)
    expect(mockSendFailureNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        systemName: 'System 1',
        systemUrl: 'https://system1.com',
        errorMessage: 'Connection refused',
        failureCount: 3,
      }),
      expect.anything(),
    )

    vi.restoreAllMocks()
  })

  it('should NOT call sendFailureNotification when system is already offline', async () => {
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 4 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Timeout',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'offline' }],
      error: null,
    })

    await runAllHealthChecks()

    expect(mockSendFailureNotification).not.toHaveBeenCalled()
  })

  it('should call sendRecoveryNotification when recovering from offline (AC #3)', async () => {
    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 150,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'offline' }],
      error: null,
    })

    vi.spyOn(console, 'info').mockImplementation(() => {})

    await runAllHealthChecks()

    expect(mockSendRecoveryNotification).toHaveBeenCalledTimes(1)
    expect(mockSendRecoveryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        systemName: 'System 1',
        systemUrl: 'https://system1.com',
        responseTime: 150,
      }),
      expect.anything(),
    )

    vi.restoreAllMocks()
  })

  it('should NOT call sendRecoveryNotification when system was already online', async () => {
    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    await runAllHealthChecks()

    expect(mockSendRecoveryNotification).not.toHaveBeenCalled()
  })

  it('should not fail health check when notification throws (non-blocking)', async () => {
    mockCounterSingle.mockResolvedValue({
      data: { consecutive_failures: 2 },
      error: null,
    })

    vi.mocked(checkSystemHealthWithRetry).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Timeout',
      checkedAt: '2026-01-01T00:00:00Z',
    })

    mockIs.mockResolvedValue({
      data: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'System 1', url: 'https://system1.com', status: 'online' }],
      error: null,
    })

    // Notification throws
    mockSendFailureNotification.mockRejectedValue(new Error('Notification service down'))
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Should NOT throw
    const results = await runAllHealthChecks()

    expect(results).toHaveLength(1)
    expect(revalidatePath).toHaveBeenCalledWith('/')

    vi.restoreAllMocks()
  })
})
