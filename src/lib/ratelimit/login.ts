import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let _loginRatelimit: Ratelimit | undefined

export function getLoginRatelimit(): Ratelimit {
  if (!_loginRatelimit) {
    _loginRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: '@upstash/ratelimit:login',
    })
  }
  return _loginRatelimit
}
