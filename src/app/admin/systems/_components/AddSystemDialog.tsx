'use client'

import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createSystemSchema, SYSTEM_CATEGORIES, CATEGORY_LABELS } from '@/lib/validations/system'
import { useCreateSystem, useUploadLogo } from '@/lib/admin/mutations/systems'
import LogoUpload from './LogoUpload'

// Form values type derived from schema
type FormValues = z.infer<typeof createSystemSchema>

interface AddSystemDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function AddSystemDialog({
  trigger,
  onSuccess,
}: AddSystemDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const createSystem = useCreateSystem()
  const uploadLogo = useUploadLogo()

  const handlePendingLogoSelect = (file: File) => {
    setPendingLogoFile(file)
  }

  const handlePendingLogoRemove = () => {
    setPendingLogoFile(null)
  }

  const form = useForm<FormValues>({
    // Type cast required due to @hookform/resolvers generic inference limitation with Zod schemas
    // that have .default() transforms. The resolver works correctly at runtime.
    resolver: zodResolver(createSystemSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      url: '',
      description: '',
      enabled: true,
      category: null,
    },
  })

  const watchedName = useWatch({ control: form.control, name: 'name' })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError(null)
    try {
      const created = await createSystem.mutateAsync(data)

      // Upload logo if one was selected (two-step: create system → upload logo)
      if (pendingLogoFile) {
        try {
          await uploadLogo.mutateAsync({ systemId: created.id, file: pendingLogoFile })
        } catch {
          toast.error('System created but logo upload failed. Edit the system to retry.')
        }
      }

      toast.success('System added', {
        description: `${data.name} is now available.`,
      })
      form.reset()
      setPendingLogoFile(null)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add system'

      // Show duplicate name as inline error (survives query-triggered re-renders)
      if (message.includes('already exists')) {
        setServerError(message)
      } else {
        toast.error('Unable to add system', { description: message })
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setServerError(null)
      setPendingLogoFile(null)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="add-system-button">
            <Plus className="mr-2 h-4 w-4" />
            Add System
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        data-testid="add-system-dialog"
      >
        <DialogHeader>
          <DialogTitle>Add New System</DialogTitle>
          <DialogDescription>
            Add a new system to the portfolio. It will appear on the public
            landing page if enabled.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="add-system-form"
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

            {/* Category field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="system-category-select">
                        <SelectValue placeholder="None (uncategorized)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (uncategorized)</SelectItem>
                      {SYSTEM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo upload */}
            <LogoUpload
              currentLogoUrl={null}
              systemName={watchedName || 'New System'}
              isUploading={uploadLogo.isPending}
              onUpload={handlePendingLogoSelect}
              onRemove={handlePendingLogoRemove}
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
                disabled={form.formState.isSubmitting}
                data-testid="submit-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add System'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
