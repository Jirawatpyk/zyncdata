import Link from 'next/link'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export default function PreviewButton() {
  return (
    <Link
      href="/admin/preview"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-11 gap-2')}
      data-testid="preview-button"
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      Preview
    </Link>
  )
}
