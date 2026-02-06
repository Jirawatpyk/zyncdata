'use client'

// D2 Spike: client wrapper for dynamic TipTap import
import dynamic from 'next/dynamic'

const TipTapEditor = dynamic(
  () => import('@/components/patterns/TipTapEditor').then((m) => ({ default: m.TipTapEditor })),
  { ssr: false, loading: () => <p className="p-4 text-muted-foreground">Loading editor...</p> },
)

export function ContentEditor() {
  return <TipTapEditor content="<p>Spike test — type here</p>" />
}
