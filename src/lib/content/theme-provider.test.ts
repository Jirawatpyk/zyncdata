import { describe, it, expect } from 'vitest'
import { getThemeCssVars, getThemeFontVar } from './theme-provider'
import { createMockThemeContent } from '@/lib/test-utils/mock-factories'

describe('getThemeCssVars', () => {
  it('returns correct CSS vars for dxt-default scheme', () => {
    const vars = getThemeCssVars(createMockThemeContent({ colorScheme: 'dxt-default' }))

    expect(vars['--dxt-primary']).toBe('#41b9d5')
    expect(vars['--dxt-secondary']).toBe('#5371ff')
    expect(vars['--dxt-accent']).toBe('#6ce6e9')
  })

  it('returns correct CSS vars for ocean-blue scheme', () => {
    const vars = getThemeCssVars(createMockThemeContent({ colorScheme: 'ocean-blue' }))

    expect(vars['--dxt-primary']).toBe('#0077b6')
    expect(vars['--dxt-secondary']).toBe('#00b4d8')
    expect(vars['--dxt-accent']).toBe('#90e0ef')
  })

  it('returns correct CSS vars for midnight-purple scheme', () => {
    const vars = getThemeCssVars(createMockThemeContent({ colorScheme: 'midnight-purple' }))

    expect(vars['--dxt-primary']).toBe('#7c3aed')
    expect(vars['--dxt-secondary']).toBe('#a78bfa')
    expect(vars['--dxt-accent']).toBe('#c4b5fd')
  })
})

describe('getThemeFontVar', () => {
  it('returns --font-nunito for nunito', () => {
    expect(getThemeFontVar(createMockThemeContent({ font: 'nunito' }))).toBe('var(--font-nunito)')
  })

  it('returns --font-inter for inter', () => {
    expect(getThemeFontVar(createMockThemeContent({ font: 'inter' }))).toBe('var(--font-inter)')
  })

  it('returns --font-open-sans for open-sans', () => {
    expect(getThemeFontVar(createMockThemeContent({ font: 'open-sans' }))).toBe('var(--font-open-sans)')
  })
})
