'use client'

import { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils'

interface TipTapEditorProps {
  content?: string
  onChange?: (html: string) => void
  className?: string
  disabled?: boolean
}

export function TipTapEditor({ content = '', onChange, className, disabled = false }: TipTapEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })

  const handleLinkSubmit = useCallback(() => {
    if (!editor || !linkUrl) return

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }

    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const handleLinkClick = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    setLinkUrl(previousUrl ?? '')
    setShowLinkInput(true)
  }, [editor])

  if (!editor) return null

  return (
    <div className={cn('rounded-md border', disabled && 'opacity-50', className)}>
      <div className="flex flex-wrap gap-1 border-b p-2">
        <button
          type="button"
          aria-label="Bold"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('bold') && 'bg-slate-200 font-bold',
          )}
        >
          B
        </button>
        <button
          type="button"
          aria-label="Italic"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('italic') && 'bg-slate-200 italic',
          )}
        >
          I
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('heading', { level: 2 }) && 'bg-slate-200 font-bold',
          )}
        >
          H2
        </button>
        <button
          type="button"
          aria-label="Heading 3"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('heading', { level: 3 }) && 'bg-slate-200 font-bold',
          )}
        >
          H3
        </button>
        <button
          type="button"
          aria-label="Bullet List"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('bulletList') && 'bg-slate-200',
          )}
        >
          UL
        </button>
        <button
          type="button"
          aria-label="Ordered List"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('orderedList') && 'bg-slate-200',
          )}
        >
          OL
        </button>
        <button
          type="button"
          aria-label="Link"
          disabled={disabled}
          onClick={handleLinkClick}
          className={cn(
            'min-h-11 min-w-11 rounded px-2 py-1 text-sm',
            editor.isActive('link') && 'bg-slate-200',
          )}
        >
          Link
        </button>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 border-b px-2 py-1">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleLinkSubmit()
              }
              if (e.key === 'Escape') setShowLinkInput(false)
            }}
            className="min-h-11 flex-1 rounded border px-2 text-sm"
            aria-label="Link URL"
          />
          <button
            type="button"
            onClick={handleLinkSubmit}
            className="min-h-11 rounded bg-primary px-3 py-1 text-sm text-primary-foreground"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="min-h-11 rounded px-3 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
