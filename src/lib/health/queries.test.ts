import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import {
  getRecentHealthChecks,
  getLatestHealthCheck,
  getHealthCheckCount,
} from '@/lib/health/queries'

const DB_ROW = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  status: 'success',
  response_time: 150,
  error_message: null,
  checked_at: '2026-01-01T00:00:00Z',
}

const EXPECTED_CAMEL = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  status: 'success',
  responseTime: 150,
  errorMessage: null,
  checkedAt: '2026-01-01T00:00:00Z',
}

describe('getRecentHealthChecks', () => {
  const mockLimit = vi.fn()
  const mockOrder = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLimit.mockResolvedValue({ data: [DB_ROW], error: null })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should return records ordered by checked_at DESC', async () => {
    await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockEq).toHaveBeenCalledWith('system_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(mockOrder).toHaveBeenCalledWith('checked_at', { ascending: false })
  })

  it('should respect limit parameter', async () => {
    await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479', 5)

    expect(mockLimit).toHaveBeenCalledWith(5)
  })

  it('should use default limit of 10', async () => {
    await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockLimit).toHaveBeenCalledWith(10)
  })

  it('should transform snake_case to camelCase', async () => {
    const result = await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(result).toEqual([EXPECTED_CAMEL])
  })

  it('should return empty array when no records', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })

    const result = await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(result).toEqual([])
  })

  it('should throw on Supabase error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'Query failed' } })

    await expect(getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')).rejects.toThrow()
  })
})

describe('getLatestHealthCheck', () => {
  const mockMaybeSingle = vi.fn()
  const mockLimit = vi.fn()
  const mockOrder = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null })
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should return most recent check as camelCase', async () => {
    const result = await getLatestHealthCheck('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(result).toEqual(EXPECTED_CAMEL)
  })

  it('should return null when no checks exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await getLatestHealthCheck('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(result).toBeNull()
  })

  it('should query with correct system_id', async () => {
    await getLatestHealthCheck('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockEq).toHaveBeenCalledWith('system_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(mockOrder).toHaveBeenCalledWith('checked_at', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(1)
  })

  it('should throw on Supabase error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Error' } })

    await expect(getLatestHealthCheck('f47ac10b-58cc-4372-a567-0e02b2c3d479')).rejects.toThrow()
  })
})

describe('getHealthCheckCount', () => {
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockEq.mockResolvedValue({ count: 42, error: null })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should return correct count for a system', async () => {
    const count = await getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(count).toBe(42)
  })

  it('should use head-only select with exact count', async () => {
    await getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(mockEq).toHaveBeenCalledWith('system_id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should return 0 when count is null', async () => {
    mockEq.mockResolvedValue({ count: null, error: null })

    const count = await getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(count).toBe(0)
  })

  it('should return 0 when no records exist for a system', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null })

    const count = await getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(count).toBe(0)
  })

  it('should return count at pruning threshold (1000)', async () => {
    mockEq.mockResolvedValue({ count: 1000, error: null })

    const count = await getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(count).toBe(1000)
  })

  it('should throw on Supabase error', async () => {
    mockEq.mockResolvedValue({ count: null, error: { message: 'Query failed' } })

    await expect(getHealthCheckCount('f47ac10b-58cc-4372-a567-0e02b2c3d479')).rejects.toThrow()
  })
})

describe('getRecentHealthChecks — performance guardrails', () => {
  const mockLimit = vi.fn()
  const mockOrder = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Simulate a large result set (50 rows) with valid UUIDs
    const largeDataSet = Array.from({ length: 50 }, (_, i) => {
      const hex = i.toString(16).padStart(12, '0')
      return {
        ...DB_ROW,
        id: `a1b2c3d4-e5f6-4a7b-8c9d-${hex}`,
        checked_at: `2026-01-01T00:${String(i).padStart(2, '0')}:00Z`,
      }
    })
    mockLimit.mockResolvedValue({ data: largeDataSet, error: null })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should always apply .limit() to prevent unbounded results', async () => {
    await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    // Default limit of 10 is always applied
    expect(mockLimit).toHaveBeenCalledWith(10)
  })

  it('should handle large result sets within the limit', async () => {
    const results = await getRecentHealthChecks('f47ac10b-58cc-4372-a567-0e02b2c3d479', 50)

    expect(mockLimit).toHaveBeenCalledWith(50)
    expect(results).toHaveLength(50)
  })
})

describe('getLatestHealthCheck — performance guardrails', () => {
  const mockMaybeSingle = vi.fn()
  const mockLimit = vi.fn()
  const mockOrder = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null })
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should use limit(1) for single row retrieval (index-efficient)', async () => {
    await getLatestHealthCheck('f47ac10b-58cc-4372-a567-0e02b2c3d479')

    expect(mockLimit).toHaveBeenCalledWith(1)
    expect(mockOrder).toHaveBeenCalledWith('checked_at', { ascending: false })
  })
})
