import { describe, it, expect } from 'vitest'
import type { JSX } from 'react'
import Hero from '@/app/_components/Hero'

describe('Hero', () => {
  const defaultProps = {
    title: 'DxT AI Platform',
    subtitle: 'Enterprise Access Management',
    description: 'Your centralized hub for accessing and monitoring all DxT AI systems.',
  }

  it('should render title as H1', () => {
    const jsx = Hero(defaultProps) as JSX.Element
    const container = jsx.props.children as JSX.Element
    const h1 = (container.props.children as JSX.Element[])[0]

    expect(h1.type).toBe('h1')
    expect(h1.props.children).toBe('DxT AI Platform')
  })

  it('should render subtitle as H2', () => {
    const jsx = Hero(defaultProps) as JSX.Element
    const container = jsx.props.children as JSX.Element
    const h2 = (container.props.children as JSX.Element[])[1]

    expect(h2.type).toBe('h2')
    expect(h2.props.children).toBe('Enterprise Access Management')
  })

  it('should render description', () => {
    const jsx = Hero(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('Your centralized hub')
  })

  it('should have responsive typography classes', () => {
    const jsx = Hero(defaultProps) as JSX.Element
    const container = jsx.props.children as JSX.Element
    const h1 = (container.props.children as JSX.Element[])[0]

    expect(h1.props.className).toContain('text-4xl')
    expect(h1.props.className).toContain('md:text-5xl')
  })

  it('should render as section element', () => {
    const jsx = Hero(defaultProps) as JSX.Element

    expect(jsx.type).toBe('section')
  })
})
