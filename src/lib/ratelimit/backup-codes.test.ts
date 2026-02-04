import { describe, it, expect, vi, beforeEach } from 'vitest'

const { MockRatelimit, mockSlidingWindow, mockFromEnv } = vi.hoisted(() => {
  const mockSlidingWindow = vi.fn(() => 'sliding-window-config')
  const MockRatelimit = Object.assign(vi.fn(), { slidingWindow: mockSlidingWindow })
  const mockFromEnv = vi.fn(() => ({}))
  return { MockRatelimit, mockSlidingWindow, mockFromEnv }
})

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: mockFromEnv },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: MockRatelimit,
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('getBackupCodeRatelimit', () => {
  it('should create a Ratelimit instance with correct config', async () => {
    const { getBackupCodeRatelimit } = await import('./backup-codes')
    getBackupCodeRatelimit()

    expect(mockFromEnv).toHaveBeenCalled()
    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '5 m')
    expect(MockRatelimit).toHaveBeenCalledWith({
      redis: expect.any(Object),
      limiter: 'sliding-window-config',
      prefix: '@upstash/ratelimit:backup-code',
    })
  })

  it('should use sliding window algorithm with 3 requests per 5 minutes', async () => {
    const { getBackupCodeRatelimit } = await import('./backup-codes')
    getBackupCodeRatelimit()

    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '5 m')
  })

  it('should use backup-code-specific prefix', async () => {
    const { getBackupCodeRatelimit } = await import('./backup-codes')
    getBackupCodeRatelimit()

    expect(MockRatelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: '@upstash/ratelimit:backup-code',
      }),
    )
  })

  it('should return the same singleton instance on multiple calls', async () => {
    const { getBackupCodeRatelimit } = await import('./backup-codes')

    const first = getBackupCodeRatelimit()
    const second = getBackupCodeRatelimit()
    const third = getBackupCodeRatelimit()

    expect(first).toBe(second)
    expect(second).toBe(third)
    expect(MockRatelimit).toHaveBeenCalledTimes(1)
  })
})
