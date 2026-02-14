'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CmsUser } from '@/lib/validations/user'
import { useResetUserPassword } from '@/lib/admin/mutations/users'

interface ResetPasswordDialogProps {
  user: CmsUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const resetPassword = useResetUserPassword()

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault() // AlertDialogAction auto-closes — prevent for async
    try {
      await resetPassword.mutateAsync(user.id)
      toast.success('Password reset email sent', {
        description: `Sent to ${user.email}`,
      })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to reset password', { description: message })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="reset-password-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          <AlertDialogDescription>
            A password reset email will be sent to <strong>{user.email}</strong>. The user will
            receive a link to set a new password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="reset-password-cancel">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={resetPassword.isPending}
            data-testid="reset-password-confirm"
          >
            {resetPassword.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Email'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
