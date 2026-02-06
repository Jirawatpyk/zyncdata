import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/health/check', () => ({
  checkSystemHealth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/service'
import { checkSystemHealth } from '@/lib/health/check'
import { revalidatePath } from 'next/cache'
import { recordHealthCheck, updateSystemHealthStatus, runAllHealthChecks } from '@/lib/health/mutations'
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

    await expect(updateSystemHealthStatus('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'online', 100)).rejects.toThrow()
  })
})

describe('runAllHealthChecks', () => {
  const mockIs = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockInsertSingle = vi.fn()
  const mockInsertSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdateEq = vi.fn()
  const mockUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: two enabled systems
    mockIs.mockResolvedValue({
      data: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', url: 'https://system1.com' },
        { id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590', url: 'https://system2.com' },
      ],
      error: null,
    })
    mockEq.mockReturnValue({ is: mockIs })
    mockSelect.mockReturnValue({ eq: mockEq })

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

    let callCount = 0
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'systems' && callCount === 0) {
          callCount++
          return { select: mockSelect }
        }
        if (table === 'health_checks') {
          return { insert: mockInsert }
        }
        // systems update
        return { update: mockUpdate }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)

    // Default: all checks succeed
    vi.mocked(checkSystemHealth).mockResolvedValue({
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    })
  })

  it('should fetch only enabled, non-deleted systems', async () => {
    await runAllHealthChecks()

    expect(mockSelect).toHaveBeenCalledWith('id, url')
    expect(mockEq).toHaveBeenCalledWith('enabled', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('should run checks concurrently for all systems', async () => {
    await runAllHealthChecks()

    expect(checkSystemHealth).toHaveBeenCalledTimes(2)
    expect(checkSystemHealth).toHaveBeenCalledWith({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', url: 'https://system1.com' })
    expect(checkSystemHealth).toHaveBeenCalledWith({ id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590', url: 'https://system2.com' })
  })

  it('should return empty array when no systems exist', async () => {
    mockIs.mockResolvedValue({ data: [], error: null })

    const results = await runAllHealthChecks()

    expect(results).toEqual([])
    expect(checkSystemHealth).not.toHaveBeenCalled()
  })

  it('should call revalidatePath after completion', async () => {
    await runAllHealthChecks()

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should handle partial failures — one timeout does not block others', async () => {
    vi.mocked(checkSystemHealth)
      .mockResolvedValueOnce({
        systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'success',
        responseTime: 100,
        errorMessage: null,
        checkedAt: '2026-01-01T00:00:00Z',
      })
      .mockResolvedValueOnce({
        systemId: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
        status: 'failure',
        responseTime: null,
        errorMessage: 'Request timed out',
        checkedAt: '2026-01-01T00:00:00Z',
      })

    const results = await runAllHealthChecks()

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('success')
    expect(results[1].status).toBe('failure')
  })

  it('should throw when fetching systems fails', async () => {
    mockIs.mockResolvedValue({ data: null, error: { message: 'Connection failed' } })

    await expect(runAllHealthChecks()).rejects.toThrow()
  })
})
