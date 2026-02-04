import { describe, it, expect } from 'vitest'
import IntroSection from '@/app/_components/IntroSection'

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

describe('IntroSection', () => {
  const defaultProps = {
    heading: 'About DxT AI',
    body: 'DxT AI builds intelligent solutions.',
  }

  it('should render heading as H2', () => {
    const jsx = IntroSection(defaultProps)
    const h2 = findByType(jsx, 'h2') as { props: { children: string } } | null

    expect(h2).not.toBeNull()
    expect(h2!.props.children).toBe('About DxT AI')
  })

  it('should render body text', () => {
    const jsx = IntroSection(defaultProps)
    const rendered = extractText(jsx)

    expect(rendered).toContain('DxT AI builds intelligent solutions.')
  })

  it('should have distinct background', () => {
    const jsx = IntroSection(defaultProps) as { props: { className: string } }

    expect(jsx.props.className).toContain('bg-slate-50')
  })

  it('should render as section element', () => {
    const jsx = IntroSection(defaultProps) as { type: string }

    expect(jsx.type).toBe('section')
  })
})
