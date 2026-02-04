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

import { getLoginRatelimit } from './login'

describe('getLoginRatelimit', () => {
  it('should create a Ratelimit instance with correct config', () => {
    getLoginRatelimit()

    expect(mockFromEnv).toHaveBeenCalled()
    expect(mockSlidingWindow).toHaveBeenCalledWith(5, '15 m')
    expect(MockRatelimit).toHaveBeenCalledWith({
      redis: expect.any(Object),
      limiter: 'sliding-window-config',
      prefix: '@upstash/ratelimit:login',
    })
  })

  it('should use sliding window algorithm with 5 requests per 15 minutes', () => {
    expect(mockSlidingWindow).toHaveBeenCalledWith(5, '15 m')
  })

  it('should use login-specific prefix', () => {
    expect(MockRatelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: '@upstash/ratelimit:login',
      }),
    )
  })
})
