import { describe, it, expect } from 'vitest'
import { systemsQueryOptions } from './systems'

describe('systemsQueryOptions', () => {
  it('should have correct query key', () => {
    expect(systemsQueryOptions.queryKey).toEqual(['admin', 'systems'])
  })

  it('should have staleTime of 60 seconds', () => {
    expect(systemsQueryOptions.staleTime).toBe(60_000)
  })

  it('should have queryFn defined', () => {
    expect(systemsQueryOptions.queryFn).toBeDefined()
    expect(typeof systemsQueryOptions.queryFn).toBe('function')
  })
})
