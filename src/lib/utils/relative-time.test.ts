import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRelativeTimeString } from './relative-time'

describe('getRelativeTimeString', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-07T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "just now" for timestamps within 10 seconds', () => {
    const fiveSecondsAgo = new Date('2026-02-07T11:59:55.000Z')
    expect(getRelativeTimeString(fiveSecondsAgo)).toBe('just now')
  })

  it('should return relative seconds for 30 seconds ago', () => {
    const thirtySecondsAgo = new Date('2026-02-07T11:59:30.000Z')
    expect(getRelativeTimeString(thirtySecondsAgo)).toBe('30 seconds ago')
  })

  it('should return relative minutes for 5 minutes ago', () => {
    const fiveMinutesAgo = new Date('2026-02-07T11:55:00.000Z')
    expect(getRelativeTimeString(fiveMinutesAgo)).toBe('5 minutes ago')
  })

  it('should return "1 minute ago" for 90 seconds ago', () => {
    const ninetySecondsAgo = new Date('2026-02-07T11:58:30.000Z')
    expect(getRelativeTimeString(ninetySecondsAgo)).toBe('1 minute ago')
  })

  it('should return relative hours for 2 hours ago', () => {
    const twoHoursAgo = new Date('2026-02-07T10:00:00.000Z')
    expect(getRelativeTimeString(twoHoursAgo)).toBe('2 hours ago')
  })

  it('should return "yesterday" for 24 hours ago', () => {
    const oneDayAgo = new Date('2026-02-06T12:00:00.000Z')
    expect(getRelativeTimeString(oneDayAgo)).toBe('yesterday')
  })

  it('should return relative days for 3 days ago', () => {
    const threeDaysAgo = new Date('2026-02-04T12:00:00.000Z')
    expect(getRelativeTimeString(threeDaysAgo)).toBe('3 days ago')
  })

  it('should return "last week" for 7 days ago', () => {
    const sevenDaysAgo = new Date('2026-01-31T12:00:00.000Z')
    expect(getRelativeTimeString(sevenDaysAgo)).toBe('last week')
  })

  it('should accept numeric timestamp (milliseconds)', () => {
    const fiveMinutesAgoMs = new Date('2026-02-07T11:55:00.000Z').getTime()
    expect(getRelativeTimeString(fiveMinutesAgoMs)).toBe('5 minutes ago')
  })

  it('should return "just now" for timestamps in the near future', () => {
    const fiveSecondsFromNow = new Date('2026-02-07T12:00:05.000Z')
    expect(getRelativeTimeString(fiveSecondsFromNow)).toBe('just now')
  })
})
