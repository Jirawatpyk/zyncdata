import { describe, it, expect } from 'vitest'
import PillarsSection from '@/app/_components/PillarsSection'
import type { PillarItem } from '@/lib/validations/content'
import { deepRender, findByType, findAllByTag, extractText, safeStringify } from '@/lib/test-utils/jsx-helpers'

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
