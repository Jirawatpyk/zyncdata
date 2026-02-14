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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createUserSchema, ASSIGNABLE_ROLES, ROLE_LABELS, type CreateUserInput } from '@/lib/validations/user'
import { useCreateUser } from '@/lib/admin/mutations/users'

export default function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const createUser = useCreateUser()

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      role: undefined,
    },
  })

  const onSubmit: SubmitHandler<CreateUserInput> = async (data) => {
    setServerError(null)
    try {
      await createUser.mutateAsync(data)
      toast.success('User created successfully', {
        description: `Invite sent to ${data.email}`,
      })
      form.reset()
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user'
      if (message.includes('already exists')) {
        setServerError(message) // Inline error — keep dialog open
      } else {
        toast.error('Unable to create user', { description: message })
      }
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setServerError(null)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="add-user-button">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="add-user-dialog">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a CMS user account. An invite email will be sent so the user can set their
            password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="add-user-form"
          >
            {/* Server error (e.g. duplicate email) */}
            {serverError && (
              <p
                className="text-[0.8rem] font-medium text-destructive"
                role="alert"
                data-testid="server-error"
              >
                {serverError}
              </p>
            )}

            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@dxt.com"
                      data-testid="user-email-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="email-error" />
                </FormItem>
              )}
            />

            {/* Role select */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger data-testid="user-role-select">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role} data-testid={`role-option-${role}`}>
                          {ROLE_LABELS[role]}
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
                data-testid="submit-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
