import { describe, it, expect, vi } from 'vitest'

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

// Static import — avoids D1 flaky test pattern (await import() causes 5s+ timeout under load)
import { getBackupCodeRatelimit } from './backup-codes'

describe('getBackupCodeRatelimit', () => {
  it('should create a Ratelimit instance with correct config on first call', () => {
    getBackupCodeRatelimit()

    expect(mockFromEnv).toHaveBeenCalled()
    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '5 m')
    expect(MockRatelimit).toHaveBeenCalledWith({
      redis: expect.any(Object),
      limiter: 'sliding-window-config',
      prefix: '@upstash/ratelimit:backup-code',
    })
  })

  it('should return the same singleton instance on subsequent calls', () => {
    // Clear call counts to verify singleton doesn't re-create
    vi.clearAllMocks()

    const first = getBackupCodeRatelimit()
    const second = getBackupCodeRatelimit()
    const third = getBackupCodeRatelimit()

    expect(first).toBe(second)
    expect(second).toBe(third)
    // Singleton already created in previous test — constructor should NOT be called again
    expect(MockRatelimit).toHaveBeenCalledTimes(0)
  })
})
