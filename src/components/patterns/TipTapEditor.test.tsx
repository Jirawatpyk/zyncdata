/**
 * TipTap Editor unit tests
 *
 * Uses headless TipTap core for testing editor logic,
 * and React Testing Library for component rendering.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

describe('TipTap Editor (headless)', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('initializes with content', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello World</p>',
    })

    expect(editor.getHTML()).toContain('Hello World')
  })

  it('toggles bold formatting', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello</p>',
    })

    editor.commands.selectAll()
    editor.commands.toggleBold()

    expect(editor.getHTML()).toContain('<strong>')
  })

  it('toggles italic formatting', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello</p>',
    })

    editor.commands.selectAll()
    editor.commands.toggleItalic()

    expect(editor.getHTML()).toContain('<em>')
  })

  it('toggles heading level 2', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello</p>',
    })

    editor.commands.toggleHeading({ level: 2 })

    expect(editor.getHTML()).toContain('<h2>')
  })

  it('toggles heading level 3', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello</p>',
    })

    editor.commands.toggleHeading({ level: 3 })

    expect(editor.getHTML()).toContain('<h3>')
  })

  it('toggles bullet list', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Item 1</p>',
    })

    editor.commands.toggleBulletList()

    expect(editor.getHTML()).toContain('<ul>')
    expect(editor.getHTML()).toContain('<li>')
  })

  it('toggles ordered list', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Item 1</p>',
    })

    editor.commands.toggleOrderedList()

    expect(editor.getHTML()).toContain('<ol>')
    expect(editor.getHTML()).toContain('<li>')
  })

  it('sets link on selected text', () => {
    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Click here</p>',
    })

    editor.commands.selectAll()
    editor.commands.setLink({ href: 'https://example.com' })

    expect(editor.getHTML()).toContain('href="https://example.com"')
  })

  it('fires onChange callback on update', () => {
    const onChange = vi.fn()

    editor = new Editor({
      extensions: [StarterKit, Link.configure({ openOnClick: false })],
      content: '<p>Hello</p>',
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
    })

    editor.commands.selectAll()
    editor.commands.toggleBold()

    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('<strong>'))
  })
})
