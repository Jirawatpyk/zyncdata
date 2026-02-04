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
    title: 'DxT AI Platform',
    subtitle: 'Enterprise Access Management',
    description: 'Your centralized hub for accessing and monitoring all DxT AI systems.',
  }

  it('should render title as H1', () => {
    const jsx = Hero(defaultProps)
    const h1 = findByType(jsx, 'h1') as { props: { children: string } } | null

    expect(h1).not.toBeNull()
    expect(h1!.props.children).toBe('DxT AI Platform')
  })

  it('should render subtitle as styled paragraph', () => {
    const jsx = Hero(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('Enterprise Access Management')
  })

  it('should render description', () => {
    const jsx = Hero(defaultProps)
    const text = extractText(jsx)

    expect(text).toContain('Your centralized hub')
  })

  it('should have responsive typography classes', () => {
    const jsx = Hero(defaultProps)
    const h1 = findByType(jsx, 'h1') as { props: { className: string } } | null

    expect(h1).not.toBeNull()
    expect(h1!.props.className).toContain('text-4xl')
    expect(h1!.props.className).toContain('md:text-6xl')
  })

  it('should render as section element', () => {
    const jsx = Hero(defaultProps) as { type: string }

    expect(jsx.type).toBe('section')
  })
})
