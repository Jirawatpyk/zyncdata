import { describe, it, expect } from 'vitest'
import { healthDashboardQueryOptions } from './health'

describe('healthDashboardQueryOptions', () => {
  it('has correct query key', () => {
    expect(healthDashboardQueryOptions.queryKey).toEqual(['admin', 'health', 'dashboard'])
  })

  it('has staleTime of 30 seconds', () => {
    expect(healthDashboardQueryOptions.staleTime).toBe(30_000)
  })

  it('has refetchInterval of 60 seconds', () => {
    expect(healthDashboardQueryOptions.refetchInterval).toBe(60_000)
  })

  it('has a queryFn defined', () => {
    expect(healthDashboardQueryOptions.queryFn).toBeDefined()
    expect(typeof healthDashboardQueryOptions.queryFn).toBe('function')
  })
})
