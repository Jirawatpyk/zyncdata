import type { HealthCheckResult } from '@/lib/validations/health'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_RETRIES = 2 // 1 initial + 2 retries = 3 attempts total
const DEFAULT_BASE_DELAY_MS = 1_000 // 1 second base delay

/** Classify whether a failed health check result is worth retrying */
export function isRetryable(result: HealthCheckResult): boolean {
  return (
    result.status === 'failure' &&
    result.errorMessage != null &&
    !result.errorMessage.startsWith('HTTP')
  )
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function checkSystemHealthWithRetry(
  system: { id: string; url: string },
  options?: {
    timeoutMs?: number
    maxRetries?: number
    baseDelayMs?: number
  },
): Promise<HealthCheckResult> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let lastResult = await checkSystemHealth(system, timeoutMs)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (lastResult.status === 'success' || !isRetryable(lastResult)) {
      break
    }

    // Exponential backoff with jitter: delay * (0.5 + random * 0.5)
    const delay = baseDelayMs * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5)
    await sleep(delay)

    lastResult = await checkSystemHealth(system, timeoutMs)
  }

  return lastResult
}

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
      redirect: 'manual',
    })

    // Fallback to GET if HEAD returns 405
    if (response.status === 405) {
      response = await fetch(system.url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
      })
    }

    const responseTime = Date.now() - start

    // redirect: 'manual' returns 3xx directly without following — a 3xx response
    // means the server IS running (e.g., auth redirect), so treat as success
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
