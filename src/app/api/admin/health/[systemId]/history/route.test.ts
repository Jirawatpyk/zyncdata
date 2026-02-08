import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn(),
}))

vi.mock('@/lib/health/queries', () => ({
  getHealthCheckHistory: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getHealthCheckHistory } from '@/lib/health/queries'
import { createClient } from '@/lib/supabase/server'
import { GET } from './route'
import { createMockAuth, createMockHealthCheckList } from '@/lib/test-utils/mock-factories'

function createRequest(query: Record<string, string> = {}): Request {
  const params = new URLSearchParams(query)
  return new Request(`http://localhost/api/admin/health/sys-1/history?${params}`)
}

const MOCK_PARAMS = Promise.resolve({ systemId: 'sys-1' })

describe('GET /api/admin/health/[systemId]/history', () => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: auth passes
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    // Default: system found
    mockSingle.mockResolvedValue({ data: { name: 'Test System' }, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn().mockReturnValue({ select: mockSelect }) } as any)

    // Default: history returns data
    vi.mocked(getHealthCheckHistory).mockResolvedValue({
      checks: createMockHealthCheckList(3),
      total: 50,
    })
  })

  it('returns 401 when not authenticated', async () => {
    const errorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    vi.mocked(requireApiAuth).mockResolvedValue(errorResponse)
    vi.mocked(isAuthError).mockReturnValue(true)

    const response = await GET(createRequest(), { params: MOCK_PARAMS })

    expect(response.status).toBe(401)
  })

  it('returns paginated health check data with defaults', async () => {
    const response = await GET(createRequest(), { params: MOCK_PARAMS })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.checks).toHaveLength(3)
    expect(body.data.total).toBe(50)
    expect(body.data.hasMore).toBe(true)
    expect(body.data.systemName).toBe('Test System')
    expect(body.error).toBeNull()
  })

  it('passes query params to getHealthCheckHistory', async () => {
    await GET(createRequest({ limit: '10', offset: '20', status: 'failure' }), { params: MOCK_PARAMS })

    expect(getHealthCheckHistory).toHaveBeenCalledWith('sys-1', {
      limit: 10,
      offset: 20,
      status: 'failure',
    })
  })

  it('returns 400 for invalid query params', async () => {
    const response = await GET(createRequest({ limit: '0' }), { params: MOCK_PARAMS })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for limit exceeding max (100)', async () => {
    const response = await GET(createRequest({ limit: '101' }), { params: MOCK_PARAMS })

    expect(response.status).toBe(400)
  })

  it('returns 400 for negative offset', async () => {
    const response = await GET(createRequest({ offset: '-1' }), { params: MOCK_PARAMS })

    expect(response.status).toBe(400)
  })

  it('returns 400 for invalid status filter', async () => {
    const response = await GET(createRequest({ status: 'invalid' }), { params: MOCK_PARAMS })

    expect(response.status).toBe(400)
  })

  it('returns 404 when system not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

    const response = await GET(createRequest(), { params: MOCK_PARAMS })

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('returns 500 on unexpected error', async () => {
    vi.mocked(getHealthCheckHistory).mockRejectedValue(new Error('DB error'))

    const response = await GET(createRequest(), { params: MOCK_PARAMS })

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe('FETCH_ERROR')
  })

  it('computes hasMore correctly when on last page', async () => {
    vi.mocked(getHealthCheckHistory).mockResolvedValue({
      checks: createMockHealthCheckList(5),
      total: 25,
    })

    const response = await GET(createRequest({ limit: '20', offset: '20' }), { params: MOCK_PARAMS })
    const body = await response.json()

    expect(body.data.hasMore).toBe(false) // offset(20) + limit(20) = 40 >= total(25)
  })

  it('computes hasMore correctly when exactly at boundary', async () => {
    vi.mocked(getHealthCheckHistory).mockResolvedValue({
      checks: createMockHealthCheckList(20),
      total: 40,
    })

    const response = await GET(createRequest({ limit: '20', offset: '20' }), { params: MOCK_PARAMS })
    const body = await response.json()

    expect(body.data.hasMore).toBe(false) // offset(20) + limit(20) = 40 >= total(40)
  })

  it('accepts status filter "success"', async () => {
    await GET(createRequest({ status: 'success' }), { params: MOCK_PARAMS })

    expect(getHealthCheckHistory).toHaveBeenCalledWith('sys-1', expect.objectContaining({ status: 'success' }))
  })

  it('uses default limit and offset when not provided', async () => {
    await GET(createRequest(), { params: MOCK_PARAMS })

    expect(getHealthCheckHistory).toHaveBeenCalledWith('sys-1', {
      limit: 20,
      offset: 0,
      status: undefined,
    })
  })
})
