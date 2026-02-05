'use client'

import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateSystemSchema, type System } from '@/lib/validations/system'
import { useUpdateSystem } from '@/lib/admin/mutations/systems'

// Form values type derived from schema
type FormValues = z.infer<typeof updateSystemSchema>

interface EditSystemDialogProps {
  system: System
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function EditSystemDialog({
  system,
  trigger,
  onSuccess,
}: EditSystemDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const updateSystem = useUpdateSystem()

  const form = useForm<FormValues>({
    // Type cast required due to @hookform/resolvers generic inference limitation with Zod schemas.
    resolver: zodResolver(updateSystemSchema) as Resolver<FormValues>,
    defaultValues: {
      id: system.id,
      name: system.name,
      url: system.url,
      description: system.description ?? '',
      enabled: system.enabled,
    },
  })

  // Reset form to system values when dialog opens (AC #1)
  useEffect(() => {
    if (open) {
      form.reset({
        id: system.id,
        name: system.name,
        url: system.url,
        description: system.description ?? '',
        enabled: system.enabled,
      })
    }
  }, [open, system, form])

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError(null)
    try {
      await updateSystem.mutateAsync(data)
      toast.success('System updated', {
        description: `${data.name} has been updated.`,
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update system'

      // Show duplicate name as inline error (survives form resets from useEffect)
      if (message.includes('already exists')) {
        setServerError(message)
      } else {
        toast.error('Unable to update system', { description: message })
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setServerError(null)
      // Reset form to original system values when dialog closes (AC #5)
      form.reset({
        id: system.id,
        name: system.name,
        url: system.url,
        description: system.description ?? '',
        enabled: system.enabled,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            data-testid={`edit-system-${system.id}`}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit {system.name}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        data-testid="edit-system-dialog"
      >
        <DialogHeader>
          <DialogTitle>Edit System</DialogTitle>
          <DialogDescription>
            Update the system information. Changes will appear on the public
            landing page if the system is enabled.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="edit-system-form"
          >
            {/* Server error (e.g. duplicate name) */}
            {serverError && (
              <p className="text-[0.8rem] font-medium text-destructive" role="alert">
                {serverError}
              </p>
            )}

            {/* Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ENEOS"
                      data-testid="system-name-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="name-error" />
                </FormItem>
              )}
            />

            {/* URL field */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://eneos.example.com"
                      data-testid="system-url-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="url-error" />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of the system..."
                      data-testid="system-description-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="description-error" />
                </FormItem>
              )}
            />

            {/* Enabled toggle */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">
                    Visible on landing page
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="system-enabled-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                data-testid="submit-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
