'use client'

import { useFormStatus } from 'react-dom'
import { logoutAction } from '@/lib/actions/logout'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

function LogoutSubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className={cn('gap-2 min-h-11', className)}
      aria-label={pending ? 'Logging out' : 'Logout'}
      data-testid="logout-button"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {pending ? 'Logging out...' : 'Logout'}
    </Button>
  )
}

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton className={className} />
    </form>
  )
}
