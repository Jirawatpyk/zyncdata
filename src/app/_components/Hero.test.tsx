import { describe, it, expect } from 'vitest'
import Hero from '@/app/_components/Hero'

function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const el = node as { props: { children?: unknown } }
    return extractText(el.props.children)
  }
  return ''
}

function findByType(node: unknown, type: string): unknown | null {
  if (!node) return null
  if (typeof node === 'object' && node !== null && 'type' in node) {
    if ((node as { type: unknown }).type === type) return node
    const el = node as { props?: { children?: unknown } }
    if (el.props?.children) {
      if (Array.isArray(el.props.children)) {
        for (const child of el.props.children) {
          const found = findByType(child, type)
          if (found) return found
        }
      }
      return findByType(el.props.children, type)
    }
  }
  return null
}

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
    const seen = new WeakSet()
    const rendered = JSON.stringify(jsx, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined
        seen.add(value)
      }
      return value
    })

    expect(rendered).toContain('text-dxt-primary')
  })

  it('should have responsive typography classes', () => {
    const jsx = Hero(defaultProps)
    const seen = new WeakSet()
    const rendered = JSON.stringify(jsx, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined
        seen.add(value)
      }
      return value
    })

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
