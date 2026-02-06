import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/health/mutations', () => ({
  runAllHealthChecks: vi.fn(),
}))

import { runAllHealthChecks } from '@/lib/health/mutations'
import { GET } from '@/app/api/cron/health-check/route'

describe('GET /api/cron/health-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
  })

  function createRequest(secret?: string): Request {
    const headers: Record<string, string> = {}
    if (secret !== undefined) {
      headers['Authorization'] = `Bearer ${secret}`
    }
    return new Request('http://localhost/api/cron/health-check', { headers })
  }

  it('should return 401 without Authorization header', async () => {
    const request = new Request('http://localhost/api/cron/health-check')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return 401 with wrong CRON_SECRET', async () => {
    const request = createRequest('wrong-secret')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return 200 with correct CRON_SECRET and run checks', async () => {
    vi.mocked(runAllHealthChecks).mockResolvedValue([
      {
        systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'success',
        responseTime: 100,
        errorMessage: null,
        checkedAt: '2026-01-01T00:00:00Z',
      },
    ])

    const request = createRequest('test-secret')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(runAllHealthChecks).toHaveBeenCalledOnce()

    const body = await response.json()
    expect(body.data.checked).toBe(1)
    expect(body.data.timestamp).toBeTruthy()
    expect(body.error).toBeNull()
  })

  it('should return partial success when some checks fail', async () => {
    vi.mocked(runAllHealthChecks).mockResolvedValue([
      {
        systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'success',
        responseTime: 100,
        errorMessage: null,
        checkedAt: '2026-01-01T00:00:00Z',
      },
      {
        systemId: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
        status: 'failure',
        responseTime: null,
        errorMessage: 'Request timed out',
        checkedAt: '2026-01-01T00:00:00Z',
      },
    ])

    const request = createRequest('test-secret')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.checked).toBe(2)
  })

  it('should include check count and timestamp in response', async () => {
    vi.mocked(runAllHealthChecks).mockResolvedValue([])

    const request = createRequest('test-secret')
    const response = await GET(request)

    const body = await response.json()
    expect(body.data).toEqual({
      checked: 0,
      timestamp: expect.any(String),
    })
  })

  it('should return 500 when runAllHealthChecks throws', async () => {
    vi.mocked(runAllHealthChecks).mockRejectedValue(new Error('DB connection failed'))

    const request = createRequest('test-secret')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('CRON_ERROR')
  })
})
