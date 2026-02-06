const CUTOFFS = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity]
const UNITS: Intl.RelativeTimeFormatUnit[] = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year']

const rtfCache = new Map<string, Intl.RelativeTimeFormat>()

function getRtf(lang: string): Intl.RelativeTimeFormat {
  let rtf = rtfCache.get(lang)
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
    rtfCache.set(lang, rtf)
  }
  return rtf
}

export function getRelativeTimeString(date: Date | number, lang = 'en'): string {
  const timeMs = typeof date === 'number' ? date : date.getTime()
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000)

  if (Math.abs(deltaSeconds) < 10) return 'just now'

  const unitIndex = CUTOFFS.findIndex((cutoff) => Math.abs(deltaSeconds) < cutoff)
  const divisor = unitIndex ? CUTOFFS[unitIndex - 1] : 1

  return getRtf(lang).format(Math.round(deltaSeconds / divisor), UNITS[unitIndex])
}
