'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { System } from '@/lib/validations/system'
import { useDeleteSystem } from '@/lib/admin/mutations/systems'

interface DeleteSystemDialogProps {
  system: System
  trigger?: React.ReactNode
}

export default function DeleteSystemDialog({
  system,
  trigger,
}: DeleteSystemDialogProps) {
  const [open, setOpen] = useState(false)
  const deleteSystem = useDeleteSystem()

  const isActive = system.status != null && system.status !== 'offline'

  async function handleConfirm() {
    try {
      await deleteSystem.mutateAsync({ id: system.id })
      toast.success('System deleted', {
        description: `${system.name} can be recovered within 30 days.`,
      })
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete system'
      toast.error('Unable to delete system', { description: message })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11"
            data-testid={`delete-system-${system.id}`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {system.name}</span>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="delete-system-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete System</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {system.name}? This can be undone
            within 30 days.
          </AlertDialogDescription>
          {isActive && (
            <p className="mt-2 text-sm font-medium text-amber-600" role="alert">
              This system is currently active. Proceed with caution.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="delete-cancel-button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              void handleConfirm()
            }}
            disabled={deleteSystem.isPending}
            data-testid="delete-confirm-button"
          >
            {deleteSystem.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
