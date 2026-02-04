import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should resolve @/ path alias', async () => {
    const utils = await import('@/lib/utils')
    expect(utils.cn).toBeDefined()
    expect(typeof utils.cn).toBe('function')
  })

  it('should merge class names with cn()', async () => {
    const { cn } = await import('@/lib/utils')
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })
})
