import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let _backupCodeRatelimit: Ratelimit | undefined

export function getBackupCodeRatelimit(): Ratelimit {
  if (!_backupCodeRatelimit) {
    _backupCodeRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, '5 m'),
      prefix: '@upstash/ratelimit:backup-code',
    })
  }
  return _backupCodeRatelimit
}
