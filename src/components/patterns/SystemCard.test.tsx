import { describe, it, expect } from 'vitest'
import type { JSX } from 'react'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import SystemCard from '@/components/patterns/SystemCard'

describe('SystemCard', () => {
  const defaultProps = {
    name: 'TINEDY',
    url: 'https://tinedy.dxt-ai.com',
    logoUrl: null,
    description: 'Task management system',
  }

  it('should render system name and description', () => {
    const jsx = SystemCard(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('TINEDY')
    expect(rendered).toContain('Task management system')
  })

  it('should render link with correct href and target', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props.href).toBe('https://tinedy.dxt-ai.com')
    expect(props.target).toBe('_blank')
    expect(props.rel).toBe('noopener noreferrer')
  })

  it('should render ARIA label with name and description', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props['aria-label']).toBe('Visit TINEDY - Task management system')
  })

  it('should render ARIA label without description when null', () => {
    const jsx = SystemCard({ ...defaultProps, description: null }) as JSX.Element
    const props = jsx.props as Record<string, unknown>

    expect(props['aria-label']).toBe('Visit TINEDY')
  })

  it('should render letter avatar when logoUrl is null', () => {
    const jsx = SystemCard(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('aria-hidden')
    expect(rendered).toContain('T')
  })

  it('should render img element when logoUrl is provided', () => {
    const jsx = SystemCard({
      ...defaultProps,
      logoUrl: 'https://example.com/logo.png',
    })
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('https://example.com/logo.png')
    expect(rendered).toContain('TINEDY logo')
  })

  it('should include focus-visible ring classes', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, string>

    expect(props.className).toContain('focus-visible:ring-2')
    expect(props.className).toContain('focus-visible:ring-dxt-primary')
  })

  it('should include motion-safe hover classes', () => {
    const jsx = SystemCard(defaultProps) as JSX.Element
    const props = jsx.props as Record<string, string>

    expect(props.className).toContain('motion-safe:hover:')
    expect(props.className).toContain('motion-safe:hover:shadow-')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(
      SystemCard({
        name: 'TINEDY',
        url: 'https://example.com',
        logoUrl: null,
        description: 'Test',
      }),
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
