'use client'

/**
 * D2 Spike: TipTap WYSIWYG editor prototype.
 *
 * This is a minimal prototype to validate:
 * 1. TipTap works with React 19 + Next.js 16
 * 2. Bundle impact is acceptable (dynamic import)
 * 3. Basic editing operations function correctly
 *
 * NOT production-ready — just a spike for Epic 4 feasibility.
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

interface TipTapEditorProps {
  content?: string
  onChange?: (html: string) => void
  className?: string
}

export function TipTapEditor({ content = '', onChange, className }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  if (!editor) return null

  return (
    <div className={cn('rounded-md border', className)}>
      <div className="flex gap-1 border-b p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'rounded px-2 py-1 text-sm',
            editor.isActive('bold') && 'bg-muted font-bold',
          )}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'rounded px-2 py-1 text-sm',
            editor.isActive('italic') && 'bg-muted italic',
          )}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'rounded px-2 py-1 text-sm',
            editor.isActive('heading', { level: 2 }) && 'bg-muted font-bold',
          )}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'rounded px-2 py-1 text-sm',
            editor.isActive('bulletList') && 'bg-muted',
          )}
        >
          List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
