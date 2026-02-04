import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let _mfaRatelimit: Ratelimit | undefined

export function getMfaRatelimit(): Ratelimit {
  if (!_mfaRatelimit) {
    _mfaRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, '5 m'),
      prefix: '@upstash/ratelimit:mfa',
    })
  }
  return _mfaRatelimit
}
