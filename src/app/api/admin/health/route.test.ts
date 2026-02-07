import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET } from './route'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ from: mockFrom }),
}))

vi.mock('@/lib/utils/transform', () => ({
  toCamelCase: <T,>(obj: Record<string, unknown>): T => {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
      result[camelKey] = obj[key]
    }
    return result as T
  },
}))

function mockSupabaseChain(data: Record<string, unknown>[] | null, error: unknown = null) {
  const result = {
    select: vi.fn(() => ({
      is: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data, error })),
        })),
      })),
    })),
  }

  mockFrom.mockReturnValue(result)
}

describe('GET /api/admin/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await GET()

    expect(response).toBe(authErrorResponse)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns health dashboard data when authenticated', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const dbData = [
      {
        id: '1',
        name: 'System A',
        url: 'https://a.com',
        status: 'online',
        response_time: 100,
        last_checked_at: '2026-01-01T00:00:00Z',
        consecutive_failures: 0,
        category: null,
        enabled: true,
      },
      {
        id: '2',
        name: 'System B',
        url: 'https://b.com',
        status: 'offline',
        response_time: null,
        last_checked_at: '2026-01-01T00:00:00Z',
        consecutive_failures: 3,
        category: 'operations',
        enabled: true,
      },
    ]
    mockSupabaseChain(dbData)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.error).toBeNull()
    expect(body.data.systems).toHaveLength(2)
    // Offline sorted first
    expect(body.data.systems[0].name).toBe('System B')
    expect(body.data.systems[1].name).toBe('System A')
    // Summary
    expect(body.data.summary.total).toBe(2)
    expect(body.data.summary.online).toBe(1)
    expect(body.data.summary.offline).toBe(1)
    expect(body.data.summary.avgResponseTime).toBe(100)
    expect(body.data.lastUpdated).toBeDefined()
  })

  it('returns empty dashboard when no systems', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockSupabaseChain([])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.systems).toEqual([])
    expect(body.data.summary).toEqual({
      total: 0,
      online: 0,
      offline: 0,
      unknown: 0,
      avgResponseTime: null,
    })
  })

  it('returns 500 when database query fails', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockSupabaseChain(null, { message: 'DB error' })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to fetch health data', code: 'FETCH_ERROR' },
    })
  })

  it('calculates average response time correctly', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const dbData = [
      { id: '1', name: 'S1', url: 'https://a.com', status: 'online', response_time: 100, last_checked_at: null, consecutive_failures: 0, category: null, enabled: true },
      { id: '2', name: 'S2', url: 'https://b.com', status: 'online', response_time: 200, last_checked_at: null, consecutive_failures: 0, category: null, enabled: true },
      { id: '3', name: 'S3', url: 'https://c.com', status: 'offline', response_time: null, last_checked_at: null, consecutive_failures: 5, category: null, enabled: true },
    ]
    mockSupabaseChain(dbData)

    const response = await GET()
    const body = await response.json()

    expect(body.data.summary.avgResponseTime).toBe(150) // (100+200)/2
    expect(body.data.summary.unknown).toBe(0)
  })
})
