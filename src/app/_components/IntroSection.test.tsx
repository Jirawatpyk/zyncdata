import { describe, it, expect } from 'vitest'
import type { JSX } from 'react'
import IntroSection from '@/app/_components/IntroSection'

describe('IntroSection', () => {
  const defaultProps = {
    heading: 'About DxT AI',
    body: 'DxT AI builds intelligent solutions.',
  }

  it('should render heading as H2', () => {
    const jsx = IntroSection(defaultProps) as JSX.Element
    const container = jsx.props.children as JSX.Element
    const h2 = (container.props.children as JSX.Element[])[0]

    expect(h2.type).toBe('h2')
    expect(h2.props.children).toBe('About DxT AI')
  })

  it('should render body text', () => {
    const jsx = IntroSection(defaultProps)
    const rendered = JSON.stringify(jsx)

    expect(rendered).toContain('DxT AI builds intelligent solutions.')
  })

  it('should have gray-50 background', () => {
    const jsx = IntroSection(defaultProps) as JSX.Element

    expect(jsx.props.className).toContain('bg-gray-50')
  })

  it('should render as section element', () => {
    const jsx = IntroSection(defaultProps) as JSX.Element

    expect(jsx.type).toBe('section')
  })
})
