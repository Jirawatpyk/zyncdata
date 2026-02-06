'use client'

import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface SectionCardProps {
  sectionName: string
  title: string
  preview: string
  onEdit: () => void
}

export default function SectionCard({ sectionName, title, preview, onEdit }: SectionCardProps) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-6"
      data-testid={`section-card-${sectionName}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {preview || 'No content yet'}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        data-testid={`edit-${sectionName}-button`}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
    </div>
  )
}
