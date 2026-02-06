import { describe, it, expect } from 'vitest'
import PillarsSection from '@/app/_components/PillarsSection'
import type { PillarItem } from '@/lib/validations/content'

/* Recursively resolve function components (catches hooks errors for client components) */
function deepRender(node: unknown): unknown {
  if (!node) return node
  if (typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(deepRender)
  if (!('type' in (node as object))) return node

  const el = node as { type: unknown; props: Record<string, unknown>; key: unknown }
  if (typeof el.type === 'function') {
    try {
      const rendered = (el.type as (props: Record<string, unknown>) => unknown)(el.props)
      return deepRender(rendered)
    } catch {
      // Component uses hooks — render children only
      if (el.props?.children) return deepRender(el.props.children)
      return node
    }
  }
  // HTML element — deep render children
  if (el.props?.children) {
    return { ...node, props: { ...el.props, children: deepRender(el.props.children) } }
  }
  return node
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

function findAllByTag(node: unknown, tag: string): unknown[] {
  const results: unknown[] = []
  if (!node) return results
  if (typeof node === 'object' && node !== null && 'type' in node) {
    if ((node as { type: unknown }).type === tag) results.push(node)
    const el = node as { props?: { children?: unknown } }
    if (el.props?.children) {
      if (Array.isArray(el.props.children)) {
        for (const child of el.props.children) {
          results.push(...findAllByTag(child, tag))
        }
      } else {
        results.push(...findAllByTag(el.props.children, tag))
      }
    }
  }
  return results
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

function safeStringify(node: unknown): string {
  const seen = new WeakSet()
  return JSON.stringify(node, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined
      seen.add(value)
    }
    if (typeof value === 'function') return `[Function:${value.name}]`
    return value
  })
}

const mockItems: PillarItem[] = [
  {
    title: 'DxT Smart Platform',
    description: 'Integrated ecosystem connecting CRM, ERP, HR and enterprise tools.',
    url: 'https://ba-sls.eqho.dev/login',
    icon: 'building',
  },
  {
    title: 'DxT Solutions',
    description: 'AI-powered B2B solutions for enterprise communication.',
    url: 'https://www.dxt-solutions.com/',
    icon: 'lightbulb',
  },
  {
    title: 'DxT AI & Data Management',
    description: 'Professional data training services and AI model management.',
    url: 'https://www.dxt-ai.com/',
    icon: 'brain',
  },
  {
    title: 'DxT Game',
    description: 'Game localization ecosystem for global markets.',
    url: null,
    icon: 'gamepad',
  },
]

describe('PillarsSection', () => {
  it('should render section heading', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const h2 = findByType(jsx, 'h2') as { props: { children: string } } | null

    expect(h2).not.toBeNull()
    expect(h2!.props.children).toBe('Our Pillars')
  })

  it('should render all 4 pillar cards with h3 titles', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const h3s = findAllByTag(jsx, 'h3')

    expect(h3s).toHaveLength(4)
  })

  it('should render pillar titles and descriptions', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const text = extractText(jsx)

    expect(text).toContain('DxT Smart Platform')
    expect(text).toContain('DxT Solutions')
    expect(text).toContain('DxT AI & Data Management')
    expect(text).toContain('DxT Game')
    expect(text).toContain('Integrated ecosystem connecting CRM')
    expect(text).toContain('Game localization ecosystem')
  })

  it('should render external links with target="_blank" and rel="noopener noreferrer"', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const links = findAllByTag(jsx, 'a') as { props: Record<string, string> }[]

    expect(links).toHaveLength(3)
    for (const link of links) {
      expect(link.props.target).toBe('_blank')
      expect(link.props.rel).toBe('noopener noreferrer')
    }
  })

  it('should render "Coming Soon" for null URL', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const text = extractText(jsx)

    expect(text).toContain('Coming Soon')
  })

  it('should not render links for null URL items', () => {
    const jsx = deepRender(
      PillarsSection({
        heading: 'Our Pillars',
        items: [{ title: 'No Link', description: 'Desc', url: null }],
      }),
    )
    const links = findAllByTag(jsx, 'a')

    expect(links).toHaveLength(0)
  })

  it('should return null for empty items', () => {
    const jsx = PillarsSection({ heading: 'Our Pillars', items: [] })

    expect(jsx).toBeNull()
  })

  it('should render as section element', () => {
    const jsx = PillarsSection({ heading: 'Our Pillars', items: mockItems }) as { type: string }

    expect(jsx.type).toBe('section')
  })

  it('should have responsive grid classes', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const rendered = safeStringify(jsx)

    expect(rendered).toContain('grid-cols-1')
    expect(rendered).toContain('sm:grid-cols-2')
    expect(rendered).toContain('xl:grid-cols-4')
  })

  it('should have min-h-11 touch target on links', () => {
    const jsx = deepRender(PillarsSection({ heading: 'Our Pillars', items: mockItems }))
    const rendered = safeStringify(jsx)

    expect(rendered).toContain('min-h-11')
  })
})
