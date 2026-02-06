import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getRecentHealthChecks, getLatestHealthCheck } from '@/lib/health/queries'

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
