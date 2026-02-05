import { Monitor } from 'lucide-react'
import EmptyState from '@/components/patterns/EmptyState'

export default function SystemsEmptyState() {
  return (
    <EmptyState
      icon={<Monitor className="h-12 w-12" />}
      title="No Systems Yet"
      description="Add your first system to get started monitoring."
      action={{
        label: 'Add System',
        href: '/admin/systems/new',
      }}
    />
  )
}
