'use client'

import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { publishStatusQueryOptions, usePublishChanges } from '@/lib/admin/mutations/publish'
import { Badge } from '@/components/ui/badge'

export default function PublishButton() {
  const { data: status } = useSuspenseQuery(publishStatusQueryOptions)
  const publishMutation = usePublishChanges()
  const [open, setOpen] = useState(false)

  const hasDrafts = status.hasDrafts

  return (
    <div className="flex items-center gap-2">
      {hasDrafts && (
        <Badge variant="outline" className="border-amber-500 text-amber-600" data-testid="draft-badge">
          Unpublished changes
        </Badge>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="min-h-11 gap-2"
            disabled={!hasDrafts}
            data-testid="publish-button"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Publish Changes
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish these changes? They will be live immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="publish-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                try {
                  await publishMutation.mutateAsync()
                  setOpen(false)
                } catch {
                  // Error toast shown by mutation's onError — dialog stays open for retry
                }
              }}
              disabled={publishMutation.isPending}
              data-testid="publish-confirm"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
