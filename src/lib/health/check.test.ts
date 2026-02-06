import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkSystemHealth } from '@/lib/health/check'

describe('checkSystemHealth', () => {
  const system = { id: 'sys-1', url: 'https://example.com' }

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

    expect(result.systemId).toBe('sys-1')
    expect(result.status).toBe('success')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.responseTime).toBeGreaterThanOrEqual(0)
    expect(result.errorMessage).toBeNull()
    expect(result.checkedAt).toBeTruthy()
  })

  it('should return success for HTTP 3xx redirect', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 301, statusText: 'Moved Permanently' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('success')
    expect(result.responseTime).toBeTypeOf('number')
    expect(result.errorMessage).toBeNull()
  })

  it('should return failure for HTTP 5xx with error message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 503, statusText: 'Service Unavailable' }),
    )

    const result = await checkSystemHealth(system)

    expect(result.status).toBe('failure')
    expect(result.responseTime).toBeNull()
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
    expect(result.systemId).toBe('sys-1')
  })

  it('should include checkedAt timestamp in ISO format', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, statusText: 'OK' }),
    )

    const result = await checkSystemHealth(system)

    expect(() => new Date(result.checkedAt).toISOString()).not.toThrow()
  })
})
