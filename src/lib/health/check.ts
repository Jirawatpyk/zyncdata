import type { HealthCheckResult } from '@/lib/validations/health'

const DEFAULT_TIMEOUT_MS = 10_000

export async function checkSystemHealth(
  system: { id: string; url: string },
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const start = Date.now()
    let response = await fetch(system.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    // Fallback to GET if HEAD returns 405
    if (response.status === 405) {
      response = await fetch(system.url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      })
    }

    const responseTime = Date.now() - start

    // 3xx check is a safety net — redirect: 'follow' resolves most 3xx,
    // but some edge cases (e.g., 304 Not Modified) don't redirect and aren't covered by response.ok
    if (response.ok || (response.status >= 300 && response.status < 400)) {
      return {
        systemId: system.id,
        status: 'success',
        responseTime,
        errorMessage: null,
        checkedAt,
      }
    }

    return {
      systemId: system.id,
      status: 'failure',
      responseTime: null,
      errorMessage: `HTTP ${response.status} ${response.statusText}`,
      checkedAt,
    }
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Request timed out'
        : error instanceof TypeError
          ? `Network error: ${error.message}`
          : `Unknown error: ${String(error)}`

    return {
      systemId: system.id,
      status: 'failure',
      responseTime: null,
      errorMessage: message,
      checkedAt,
    }
  } finally {
    clearTimeout(timer)
  }
}
