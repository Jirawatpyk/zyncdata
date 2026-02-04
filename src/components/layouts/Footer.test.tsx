import { describe, it, expect } from 'vitest'
import type { JSX } from 'react'
import Footer from '@/components/layouts/Footer'

function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const element = node as JSX.Element
    return extractText(element.props.children)
  }
  return ''
}

describe('Footer', () => {
  const defaultProps = {
    copyright: '2026 DxT AI. All rights reserved.',
    contactEmail: 'support@dxt-ai.com',
    links: [] as { label: string; url: string }[],
  }

  it('should render copyright text', () => {
    const jsx = Footer(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('2026 DxT AI. All rights reserved.')
  })

  it('should render contact email', () => {
    const jsx = Footer(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('support@dxt-ai.com')
  })

  it('should render as footer element', () => {
    const jsx = Footer(defaultProps) as JSX.Element

    expect(jsx.type).toBe('footer')
  })

  it('should not render nav when links are empty', () => {
    const jsx = Footer(defaultProps)
    const text = extractText(jsx)

    expect(text).not.toContain('Footer navigation')
  })

  it('should render links when provided', () => {
    const jsx = Footer({
      ...defaultProps,
      links: [{ label: 'Privacy', url: '/privacy' }],
    })
    const text = extractText(jsx)

    expect(text).toContain('Privacy')
  })

  it('should have focus-visible styles on interactive elements', () => {
    const jsx = Footer({
      ...defaultProps,
      links: [{ label: 'Privacy', url: '/privacy' }],
    })
    const seen = new WeakSet()
    const rendered = JSON.stringify(jsx, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined
        seen.add(value)
      }
      return value
    })

    expect(rendered).toContain('focus-visible:ring-2')
    expect(rendered).toContain('focus-visible:ring-dxt-primary')
  })
})
