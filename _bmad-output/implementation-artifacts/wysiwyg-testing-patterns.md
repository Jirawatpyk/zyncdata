# WYSIWYG (TipTap) Testing Patterns

**Scope:** TipTap editor components in `/admin/` routes (Epic 4+)
**Stack:** TipTap v2 + @tiptap/react + StarterKit, Vitest + RTL, Playwright
**Origin:** Epic 3 Retrospective Action Item DOC2

---

## Testing Pyramid for WYSIWYG

| Level | What to Test | Tool | Priority |
|-------|-------------|------|----------|
| **Unit** | Editor commands, content serialization, toolbar state | Vitest + `@tiptap/core` (headless) | HIGH |
| **Component** | Toolbar buttons, onChange callbacks, render output | Vitest + RTL + `@tiptap/react` | HIGH |
| **Integration** | Form submission with editor content, React Query mutations | Vitest + RTL + mock fetch | MEDIUM |
| **E2E** | Full editing flow, content persistence, save/publish | Playwright | MEDIUM |
| **A11y** | WCAG 2.1 AA compliance, keyboard nav, screen reader | jest-axe + Playwright a11y | HIGH |

---

## 1. Unit Tests (Headless Editor)

TipTap's `@tiptap/core` Editor works without DOM — ideal for fast unit tests.

### Pattern: Test Editor Commands

```typescript
import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

describe('TipTap editor commands', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('should toggle bold on selected text', () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<p>Hello World</p>',
    })

    // Select all and toggle bold
    editor.chain().selectAll().toggleBold().run()

    expect(editor.getHTML()).toContain('<strong>')
    expect(editor.isActive('bold')).toBe(true)
  })

  it('should set heading level', () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<p>Title</p>',
    })

    editor.chain().selectAll().toggleHeading({ level: 2 }).run()

    expect(editor.getHTML()).toBe('<h2>Title</h2>')
    expect(editor.isActive('heading', { level: 2 })).toBe(true)
  })
})
```

### Pattern: Test Content Serialization (JSON ↔ HTML)

```typescript
it('should round-trip content through JSON', () => {
  const html = '<h2>Title</h2><p>Body text with <strong>bold</strong></p>'

  editor = new Editor({
    extensions: [StarterKit],
    content: html,
  })

  const json = editor.getJSON()
  expect(json.content).toHaveLength(2)
  expect(json.content[0].type).toBe('heading')

  // Recreate editor from JSON — verifies JSONB storage compatibility
  const editor2 = new Editor({
    extensions: [StarterKit],
    content: json,
  })

  expect(editor2.getHTML()).toBe(html)
  editor2.destroy()
})
```

**Why this matters:** Content is stored as JSONB in `landing_page_content`. Round-trip fidelity prevents data corruption.

---

## 2. Component Tests (React + RTL)

### Pattern: Test TipTap React Component

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TipTapEditor } from '@/components/patterns/TipTapEditor'

describe('TipTapEditor', () => {
  it('should render editor with initial content', async () => {
    render(<TipTapEditor content="<p>Hello</p>" />)

    // TipTap renders async — wait for EditorContent
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should call onChange when content changes', async () => {
    const onChange = vi.fn()
    render(<TipTapEditor content="" onChange={onChange} />)

    const editor = await screen.findByRole('textbox')
    await userEvent.click(editor)
    await userEvent.type(editor, 'New text')

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('New text'))
    })
  })
})
```

### Pattern: Test Toolbar Button State

```typescript
it('should toggle bold button active state', async () => {
  render(<TipTapEditor content="<p>Hello</p>" />)

  const boldButton = await screen.findByRole('button', { name: /bold/i })
  expect(boldButton).not.toHaveClass('bg-muted')

  // Click bold — button should become active
  await userEvent.click(boldButton)

  await waitFor(() => {
    expect(boldButton).toHaveClass('bg-muted')
  })
})
```

### Critical: TipTap Async Initialization

TipTap's `useEditor` hook initializes asynchronously. Always use `findBy*` or `waitFor`:

```typescript
// BAD — editor may not be mounted yet
const editor = screen.getByRole('textbox')

// GOOD — waits for async mount
const editor = await screen.findByRole('textbox')
```

### Critical: Editor Cleanup

TipTap editors MUST be destroyed to avoid memory leaks. RTL's `cleanup()` (automatic in Vitest) handles unmount, but if creating headless editors in tests, always call `editor.destroy()` in `afterEach`.

---

## 3. Integration Tests (Form + Editor + Mutation)

### Pattern: Content Form Submission

```typescript
import { createQueryWrapper } from '@/lib/test-utils'

describe('ContentEditForm', () => {
  it('should submit editor content via mutation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1' } }),
    })
    global.fetch = mockFetch

    render(<ContentEditForm sectionId="hero" />, {
      wrapper: createQueryWrapper(),
    })

    // Wait for editor
    const editor = await screen.findByRole('textbox')
    await userEvent.click(editor)
    await userEvent.type(editor, 'Updated content')

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/content'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Updated content'),
        }),
      )
    })
  })
})
```

---

## 4. E2E Tests (Playwright)

### Pattern: Full WYSIWYG Editing Flow

```typescript
import { test, expect } from '@playwright/test'

test.describe('Content Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Auth as admin (use auth fixture)
    await page.goto('/admin/content')
  })

  test('should edit and save content', async ({ page }) => {
    // Click edit on a content section
    await page.click('[data-testid="edit-hero-section"]')

    // TipTap editor loads via dynamic import — wait for it
    const editor = page.locator('.ProseMirror')
    await expect(editor).toBeVisible({ timeout: 10000 })

    // Clear and type new content
    await editor.click()
    await page.keyboard.press('Control+A')
    await page.keyboard.type('New Hero Title')

    // Use toolbar
    await page.keyboard.press('Control+A')
    await page.click('button:has-text("B")') // Bold

    // Save
    await page.click('button:has-text("Save")')

    // Verify success
    await expect(page.getByText('Content saved')).toBeVisible()
  })

  test('should preserve formatting after save and reload', async ({ page }) => {
    // Edit with formatting
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await page.keyboard.type('Bold text')
    await page.keyboard.press('Control+A')
    await page.click('button:has-text("B")')
    await page.click('button:has-text("Save")')

    // Reload and verify formatting persists
    await page.reload()
    await expect(editor.locator('strong')).toContainText('Bold text')
  })
})
```

### E2E Key Considerations

- **Dynamic import delay:** TipTap loads via `dynamic(() => import(...), { ssr: false })`. Use `timeout: 10000` for first appearance.
- **ProseMirror selector:** TipTap renders with class `.ProseMirror` — use this as the editor locator.
- **Keyboard shortcuts:** Use `page.keyboard.press('Control+B')` for formatting — more reliable than toolbar clicks.
- **Content verification:** Check `editor.innerHTML` or specific child elements (`strong`, `h2`, `ul`) rather than text content alone.

---

## 5. Accessibility Testing

### Pattern: jest-axe for Editor Component

```typescript
import { axe } from 'jest-axe'

it('should have no accessibility violations', async () => {
  const { container } = render(
    <TipTapEditor content="<p>Accessible content</p>" />
  )

  // Wait for editor to mount
  await screen.findByRole('textbox')

  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### A11y Checklist for WYSIWYG

| Requirement | How to Test | Priority |
|-------------|------------|----------|
| Editor has `role="textbox"` | RTL `getByRole('textbox')` | P0 |
| Toolbar buttons have accessible names | `getByRole('button', { name })` | P0 |
| Keyboard navigation (Tab through toolbar) | E2E: `page.keyboard.press('Tab')` | P0 |
| Bold/Italic via keyboard shortcuts (Ctrl+B/I) | E2E: verify formatting applied | P1 |
| Focus visible on editor and toolbar | Visual regression or E2E screenshot | P1 |
| Toolbar min-h-11 (44px touch targets) | RTL: check computed style or class | P1 |
| `aria-label` on editor container | RTL: `getByLabelText('Content editor')` | P1 |
| Read-only mode announced to screen reader | RTL: check `aria-readonly` | P2 |

---

## 6. Mock Patterns

### Mock TipTap for Non-Editor Tests

When testing parent components that contain TipTapEditor but don't need real editing:

```typescript
vi.mock('@/components/patterns/TipTapEditor', () => ({
  TipTapEditor: ({ content, onChange }: { content: string; onChange?: (html: string) => void }) => (
    <textarea
      data-testid="mock-editor"
      defaultValue={content}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))
```

**When to mock vs. real editor:**
- Mock: Testing form layout, submission flow, validation around the editor
- Real: Testing editor commands, toolbar, content serialization, a11y

### Content Test Fixtures

```typescript
// src/lib/test-utils/content-fixtures.ts
export const mockTipTapJSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Test Heading' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Test paragraph content.' }],
    },
  ],
}

export const mockTipTapHTML = '<h2>Test Heading</h2><p>Test paragraph content.</p>'
```

---

## 7. Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Tests fail because editor not mounted | Use `await screen.findByRole('textbox')` before assertions |
| Memory leaks from undestroyed editors | Always `editor.destroy()` in `afterEach` for headless tests |
| `userEvent.type()` doesn't work in ProseMirror | ProseMirror intercepts keyboard events — use `page.keyboard.type()` in E2E; for RTL, use `editor.commands.setContent()` as alternative |
| Dynamic import breaks Vitest | Mock the dynamic wrapper or import TipTapEditor directly in unit tests |
| Toolbar button state stale | Use `waitFor` — TipTap state updates are async after commands |
| `getByRole('textbox')` finds multiple | Add `aria-label` to distinguish multiple editors on same page |

---

## Quick Reference

```
Unit (headless):     @tiptap/core Editor → commands, serialization, state
Component (RTL):     @tiptap/react → render, toolbar clicks, onChange
Integration (RTL):   Form + Editor + fetch mock → submission flow
E2E (Playwright):    .ProseMirror locator → keyboard input, save, persist
A11y:                jest-axe + keyboard nav + screen reader attributes
```

---

**Document Status:** Complete
**Last Updated:** 2026-02-06
