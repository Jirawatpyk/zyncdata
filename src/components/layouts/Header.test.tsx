import { describe, it, expect } from 'vitest'
import type { JSX } from 'react'
import Header from '@/components/layouts/Header'
import AuthButton from '@/components/layouts/AuthButton'

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

function findByType(node: unknown, type: string | ((...args: unknown[]) => unknown)): JSX.Element | null {
  if (!node || typeof node !== 'object' || !('type' in (node as object))) return null
  const el = node as JSX.Element
  if (el.type === type) return el
  const children = el.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByType(child, type)
      if (found) return found
    }
  }
  return findByType(children, type)
}

describe('Header', () => {
  it('should render branding text', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})
    const text = extractText(jsx)

    expect(text).toContain('DxT')
    expect(text).toContain('Smart Platform')
  })

  it('should render AuthButton in nav', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})

    const navElement = findByType(jsx, 'nav')
    expect(navElement).not.toBeNull()
    expect(navElement!.props.children.type).toBe(AuthButton)
    expect(navElement!.props['aria-label']).toBe('Main')
  })

  it('should render as header element', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})

    expect(jsx.type).toBe('header')
  })

  it('should have sticky positioning classes', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})

    expect(jsx.props.className).toContain('sticky')
    expect(jsx.props.className).toContain('top-0')
    expect(jsx.props.className).toContain('z-50')
  })

  it('should have backdrop blur for transparency effect', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})

    expect(jsx.props.className).toContain('backdrop-blur')
    expect(jsx.props.className).toContain('bg-white/')
  })

  it('should have focus-visible styles on home link', () => {
    const jsx = (Header as (props: Record<string, never>) => JSX.Element)({})
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
