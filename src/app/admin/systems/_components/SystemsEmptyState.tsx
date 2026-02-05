import { Monitor, Plus } from 'lucide-react'
import AddSystemDialog from './AddSystemDialog'
import { Button } from '@/components/ui/button'

export default function SystemsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="text-muted-foreground" aria-hidden="true">
        <Monitor className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">No Systems Yet</h2>
        <p className="text-sm text-muted-foreground">
          Add your first system to get started monitoring.
        </p>
      </div>
      <AddSystemDialog
        trigger={
          <Button className="min-h-11" data-testid="empty-state-add-button">
            <Plus className="mr-2 h-4 w-4" />
            Add System
          </Button>
        }
      />
    </div>
  )
}
