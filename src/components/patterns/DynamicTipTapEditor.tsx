'use client'

import dynamic from 'next/dynamic'

const TipTapEditor = dynamic(
  () => import('@/components/patterns/TipTapEditor').then((m) => ({ default: m.TipTapEditor })),
  {
    ssr: false,
    loading: () => <div className="min-h-[200px] animate-pulse rounded-md bg-slate-100" />,
  },
)

interface DynamicTipTapEditorProps {
  content?: string
  onChange?: (html: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function DynamicTipTapEditor(props: DynamicTipTapEditorProps) {
  return <TipTapEditor {...props} />
}
