import { describe, it, expect } from 'vitest'
import { stripHtml, sanitizeHtml } from './sanitize'

describe('stripHtml', () => {
  it('strips all HTML tags from input', () => {
    expect(stripHtml('<b>Bold</b> text')).toBe('Bold text')
  })

  it('strips script tags and their content', () => {
    expect(stripHtml('<script>alert("xss")</script>Safe')).toBe('Safe')
  })

  it('returns plain text unchanged', () => {
    expect(stripHtml('Hello World')).toBe('Hello World')
  })

  it('strips nested tags', () => {
    expect(stripHtml('<div><p><strong>Nested</strong></p></div>')).toBe('Nested')
  })
})

describe('sanitizeHtml', () => {
  it('preserves safe HTML tags (p, strong, em)', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>'
    const result = sanitizeHtml(input)

    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('<p>')
  })

  it('strips script tags and their content', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('<p>')
  })

  it('strips style tags and their content', () => {
    const input = '<style>body{display:none}</style><p>Visible</p>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('<style>')
    expect(result).not.toContain('display:none')
  })

  it('removes event handler attributes', () => {
    const input = '<p onclick="alert(1)">Click</p>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('onclick')
  })

  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('javascript:')
  })

  it('preserves safe link tags with href', () => {
    const input = '<a href="https://example.com">Link</a>'
    const result = sanitizeHtml(input)

    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('<a')
  })

  it('strips disallowed tags (div, span, img, iframe)', () => {
    const input = '<div><span>Text</span><img src="x"><iframe src="y"></iframe></div>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('<div>')
    expect(result).not.toContain('<span>')
    expect(result).not.toContain('<img')
    expect(result).not.toContain('<iframe')
    expect(result).toContain('Text')
  })

  it('preserves heading tags', () => {
    const input = '<h2>Title</h2><h3>Subtitle</h3>'
    const result = sanitizeHtml(input)

    expect(result).toContain('<h2>')
    expect(result).toContain('<h3>')
  })

  it('preserves list tags', () => {
    const input = '<ul><li>Item 1</li></ul><ol><li>Item 2</li></ol>'
    const result = sanitizeHtml(input)

    expect(result).toContain('<ul>')
    expect(result).toContain('<ol>')
    expect(result).toContain('<li>')
  })

  it('strips non-allowed attributes from allowed tags', () => {
    const input = '<p class="evil" style="color:red">Text</p>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('class=')
    expect(result).not.toContain('style=')
    expect(result).toContain('<p>')
  })
})
