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

describe('getMfaRatelimit', () => {
  it('should create a Ratelimit instance with correct config', async () => {
    const { getMfaRatelimit } = await import('./mfa')
    getMfaRatelimit()

    expect(mockFromEnv).toHaveBeenCalled()
    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '5 m')
    expect(MockRatelimit).toHaveBeenCalledWith({
      redis: expect.any(Object),
      limiter: 'sliding-window-config',
      prefix: '@upstash/ratelimit:mfa',
    })
  })

  it('should use sliding window algorithm with 3 requests per 5 minutes', async () => {
    const { getMfaRatelimit } = await import('./mfa')
    getMfaRatelimit()

    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '5 m')
  })

  it('should use mfa-specific prefix', async () => {
    const { getMfaRatelimit } = await import('./mfa')
    getMfaRatelimit()

    expect(MockRatelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: '@upstash/ratelimit:mfa',
      }),
    )
  })

  it('should return the same singleton instance on multiple calls', async () => {
    const { getMfaRatelimit } = await import('./mfa')

    const first = getMfaRatelimit()
    const second = getMfaRatelimit()
    const third = getMfaRatelimit()

    expect(first).toBe(second)
    expect(second).toBe(third)
    expect(MockRatelimit).toHaveBeenCalledTimes(1)
  })
})
