import { describe, it, expect } from 'vitest'
import Hero from '@/app/_components/Hero'
import { extractText, findByType, safeStringify } from '@/lib/test-utils/jsx-helpers'

describe('Hero', () => {
  const defaultProps = {
    title: 'DxT Smart Platform & Solutions',
    subtitle: 'Enterprise Access Management',
    description: 'One portal to access and monitor all DxT systems. Complete visibility.',
  }

  it('should render title as H1 with DxT brand split', () => {
    const jsx = Hero(defaultProps)
    const h1 = findByType(jsx, 'h1') as { props: { children: unknown } } | null

    expect(h1).not.toBeNull()
    const text = extractText(h1)
    expect(text).toContain('DxT')
    expect(text).toContain('Smart Platform & Solutions')
  })

  it('should render subtitle as styled paragraph', () => {
    const jsx = Hero(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('Enterprise Access Management')
  })

  it('should render description', () => {
    const jsx = Hero(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('One portal to access')
  })

  it('should style DxT x character with brand color', () => {
    const jsx = Hero(defaultProps)
    const rendered = safeStringify(jsx)

    expect(rendered).toContain('text-dxt-primary')
  })

  it('should have responsive typography classes', () => {
    const jsx = Hero(defaultProps)
    const rendered = safeStringify(jsx)

    expect(rendered).toContain('text-5xl')
    expect(rendered).toContain('md:text-7xl')
  })

  it('should render non-DxT title as single line', () => {
    const jsx = Hero({ ...defaultProps, title: 'Other Platform' })
    const h1 = findByType(jsx, 'h1') as { props: { children: unknown } } | null

    expect(h1).not.toBeNull()
    const text = extractText(h1)
    expect(text).toContain('Other Platform')
  })

  it('should render as section element', () => {
    const jsx = Hero(defaultProps) as { type: string }

    expect(jsx.type).toBe('section')
  })
})
