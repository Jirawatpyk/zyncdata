import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkSystemHealth, checkSystemHealthWithRetry, isRetryable } from '@/lib/health/check'
import type { HealthCheckResult } from '@/lib/validations/health'

describe('checkSystemHealth', () => {
  const system = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', url: 'https://example.com' }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should return success for HTTP 200 with response time', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.systemId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    expect(result.status).toBe('success')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.responseTime).toBeGreaterThanOrEqual(0)
    expect(result.errorMessage).toBeNull()
    expect(result.checkedAt).toBeTruthy()
  })

  it('should return success for HTTP 3xx (redirect: manual returns 3xx directly)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 301, statusText: 'Moved Permanently' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('success')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.errorMessage).toBeNull()
  })

  it('should return success for 307 auth redirect (server is running behind auth)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 307, statusText: 'Temporary Redirect' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('success')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.errorMessage).toBeNull()
  })

  it('should use redirect: manual to avoid following into auth pages', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    await checkSystemHealth(system)

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ redirect: 'manual' }),
    )
  })

  it('should return failure for HTTP 5xx with error message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 503, statusText: 'Service Unavailable' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.responseTime).toBeGreaterThanOrEqual(0)
    expect(result.errorMessage).toBe('HTTP 503 Service Unavailable')
  })

  it('should return failure for HTTP 4xx', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.errorMessage).toBe('HTTP 404 Not Found')
  })

  it('should return failure with "Request timed out" on AbortError', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.responseTime).toBeNull()
    expect(result.errorMessage).toBe('Request timed out')
  })

  it('should return failure on network error (TypeError)', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.responseTime).toBeNull()
    expect(result.errorMessage).toBe('Network error: Failed to fetch')
  })

  it('should send HEAD request by default', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    await checkSystemHealth(system)

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  it('should fallback to GET when HEAD returns 405', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 405, statusText: 'Method Not Allowed' }))
      .mockResolvedValueOnce(new Response(null, { status: 200, statusText: 'OK' }))

    const result = await checkSystemHealth(system)

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://example.com', expect.objectContaining({ method: 'HEAD' }))
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://example.com', expect.objectContaining({ method: 'GET' }))
    expect(result.status).toBe('success')
  })

  it('should use custom timeout when provided', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    await checkSystemHealth(system, 5000)

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('should never throw — errors are returned as data', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Something unexpected'))

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.errorMessage).toContain('Unknown error')
    expect(result.systemId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should include checkedAt timestamp in ISO format', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    const result = await checkSystemHealth(system)

    expect(() => new Date(result.checkedAt).toISOString()).not.toThrow()
  })
})

describe('isRetryable', () => {
  it('should return true for timeout failures', () => {
    const result: HealthCheckResult = {
      systemId: 'test-id',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Request timed out',
      checkedAt: '2026-01-01T00:00:00Z',
    }
    expect(isRetryable(result)).toBe(true)
  })

  it('should return true for network errors', () => {
    const result: HealthCheckResult = {
      systemId: 'test-id',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Network error: Failed to fetch',
      checkedAt: '2026-01-01T00:00:00Z',
    }
    expect(isRetryable(result)).toBe(true)
  })

  it('should return true for unknown errors', () => {
    const result: HealthCheckResult = {
      systemId: 'test-id',
      status: 'failure',
      responseTime: null,
      errorMessage: 'Unknown error: Something broke',
      checkedAt: '2026-01-01T00:00:00Z',
    }
    expect(isRetryable(result)).toBe(true)
  })

  it('should return false for HTTP errors (server responded definitively)', () => {
    const result: HealthCheckResult = {
      systemId: 'test-id',
      status: 'failure',
      responseTime: null,
      errorMessage: 'HTTP 503 Service Unavailable',
      checkedAt: '2026-01-01T00:00:00Z',
    }
    expect(isRetryable(result)).toBe(false)
  })

  it('should return false for success results', () => {
    const result: HealthCheckResult = {
      systemId: 'test-id',
      status: 'success',
      responseTime: 100,
      errorMessage: null,
      checkedAt: '2026-01-01T00:00:00Z',
    }
    expect(isRetryable(result)).toBe(false)
  })
})

describe('checkSystemHealthWithRetry', () => {
  const system = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', url: 'https://example.com' }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should return success on first attempt without retries', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    const result = await checkSystemHealthWithRetry(system, { baseDelayMs: 0 })

    expect(result.status).toBe('success')
    // Only 1 fetch call (HEAD request, no retries)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry on transient failure then return success', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch')) // 1st attempt: network error
      .mockResolvedValueOnce(new Response(null, { status: 200, statusText: 'OK' })) // 2nd attempt: success

    const result = await checkSystemHealthWithRetry(system, { baseDelayMs: 0 })

    expect(result.status).toBe('success')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should retry on timeout then return success', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new DOMException('Aborted', 'AbortError')) // 1st: timeout
      .mockResolvedValueOnce(new Response(null, { status: 200, statusText: 'OK' })) // 2nd: success

    const result = await checkSystemHealthWithRetry(system, { baseDelayMs: 0 })

    expect(result.status).toBe('success')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should return failure after all retries exhausted', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await checkSystemHealthWithRetry(system, { maxRetries: 2, baseDelayMs: 0 })

    expect(result.status).toBe('failure')
    expect(result.errorMessage).toBe('Network error: Failed to fetch')
    // 1 initial + 2 retries = 3 attempts
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('should NOT retry HTTP 4xx/5xx errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 503, statusText: 'Service Unavailable' }),
    )

    const result = await checkSystemHealthWithRetry(system, { baseDelayMs: 0 })

    expect(result.status).toBe('failure')
    expect(result.errorMessage).toBe('HTTP 503 Service Unavailable')
    // Only 1 attempt — no retries for HTTP errors
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should apply exponential backoff between retries', async () => {
    // Mock random for deterministic delays: 0.5 * 50 * 2^0 = 25ms, 0.5 * 50 * 2^1 = 50ms
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const callTimestamps: number[] = []
    vi.mocked(fetch).mockImplementation(async () => {
      callTimestamps.push(Date.now())
      throw new TypeError('Failed to fetch')
    })

    // Use small delays to keep the test fast but measurable
    await checkSystemHealthWithRetry(system, { maxRetries: 2, baseDelayMs: 50 })

    // 3 attempts total
    expect(callTimestamps).toHaveLength(3)

    // First retry delay: 0.5 * 50 * 2^0 = 25ms
    const firstGap = callTimestamps[1] - callTimestamps[0]
    expect(firstGap).toBeGreaterThanOrEqual(20) // allow timer imprecision

    // Second retry delay: 0.5 * 50 * 2^1 = 50ms
    const secondGap = callTimestamps[2] - callTimestamps[1]
    expect(secondGap).toBeGreaterThanOrEqual(40) // allow timer imprecision

    // Second delay should be roughly double the first (exponential)
    expect(secondGap).toBeGreaterThanOrEqual(firstGap * 0.8)
  })

  it('should make max 3 attempts total (1 initial + 2 retries)', async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    const result = await checkSystemHealthWithRetry(system, { maxRetries: 2, baseDelayMs: 0 })

    expect(result.status).toBe('failure')
    expect(result.errorMessage).toBe('Request timed out')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

