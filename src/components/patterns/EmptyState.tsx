import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 text-center',
        className,
      )}
      data-testid="empty-state"
    >
      <div className="text-muted-foreground" aria-hidden="true">
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <>
          {action.href ? (
            <Button asChild className="min-h-11">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="min-h-11">
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
