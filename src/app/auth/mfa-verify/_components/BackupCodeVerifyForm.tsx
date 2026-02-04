'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { verifyBackupCodeAction } from '@/lib/actions/backup-codes'
import type { VerifyBackupCodeState } from '@/lib/actions/backup-codes'

const initialState: VerifyBackupCodeState = {
  error: null,
  rateLimited: false,
  success: false,
  remainingCodes: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      data-testid="backup-code-submit"
      className={cn(
        'w-full bg-dxt-primary text-white hover:bg-dxt-primary/90',
        'focus-visible:ring-2 focus-visible:ring-dxt-primary',
      )}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
          Verifying...
        </>
      ) : (
        'Verify Backup Code'
      )}
    </Button>
  )
}

type BackupCodeVerifyFormProps = {
  onSuccess: () => void
}

export default function BackupCodeVerifyForm({ onSuccess }: BackupCodeVerifyFormProps) {
  const [state, formAction] = useActionState(
    async (prevState: VerifyBackupCodeState, formData: FormData) => {
      const result = await verifyBackupCodeAction(prevState, formData)
      if (result.success) {
        onSuccess()
      }
      return result
    },
    initialState,
  )

  return (
    <div
      className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10"
      data-testid="backup-code-verify-form"
    >
      <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Use Backup Code
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter one of your saved backup codes to verify your identity
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Backup Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              autoComplete="off"
              maxLength={9}
              placeholder="A1B2-C3D4"
              required
              aria-label="Backup code"
              aria-describedby={state.error ? 'backup-code-error' : undefined}
              data-testid="backup-code-input"
              className="text-center text-lg font-mono tracking-widest focus-visible:ring-2 focus-visible:ring-dxt-primary"
            />
          </div>

          {state.error && (
            <div
              id="backup-code-error"
              role="alert"
              aria-live="polite"
              data-testid="backup-code-error"
              className={cn(
                'rounded-md p-3 text-sm',
                state.rateLimited
                  ? 'border border-amber-200 bg-amber-50 text-amber-800'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
