'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateUserRoleSchema, ALL_ROLES, ALL_ROLE_LABELS, type UpdateUserRoleInput, type CmsUser } from '@/lib/validations/user'
import { useUpdateUserRole } from '@/lib/admin/mutations/users'

interface EditRoleDialogProps {
  user: CmsUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditRoleDialog({ user, open, onOpenChange }: EditRoleDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const updateRole = useUpdateUserRole()

  const form = useForm<UpdateUserRoleInput>({
    resolver: zodResolver(updateUserRoleSchema),
    defaultValues: {
      role: user.role,
    },
  })

  const onSubmit: SubmitHandler<UpdateUserRoleInput> = async (data) => {
    // No-op guard: same role
    if (data.role === user.role) {
      form.setError('role', { message: 'User already has this role' })
      return
    }

    setServerError(null)
    try {
      await updateRole.mutateAsync({ userId: user.id, role: data.role })
      toast.success('Role updated successfully', {
        description: `Changed ${user.email} to ${ALL_ROLE_LABELS[data.role]}`,
      })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role'
      // Last super admin error → inline error (keep dialog open)
      if (message.includes('Super Admin')) {
        setServerError(message)
      } else {
        toast.error('Unable to update role', { description: message })
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen)
    if (!isOpen) {
      setServerError(null)
      form.reset({ role: user.role })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="edit-role-dialog">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Change the role for this user. This takes effect on their next page load.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="edit-role-form"
          >
            {/* Server error (e.g. last super admin) */}
            {serverError && (
              <p
                className="text-[0.8rem] font-medium text-destructive"
                role="alert"
                data-testid="server-error"
              >
                {serverError}
              </p>
            )}

            {/* User info (read-only) */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Current Role</p>
              <Badge variant="secondary">
                {ALL_ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>

            {/* Role select */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="role-select">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_ROLES.map((role) => (
                        <SelectItem key={role} value={role} data-testid={`role-option-${role}`}>
                          {ALL_ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage data-testid="role-error" />
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
                data-testid="save-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
