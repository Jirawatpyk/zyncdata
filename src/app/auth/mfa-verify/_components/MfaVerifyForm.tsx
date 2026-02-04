'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { verifyMfaEnrollmentAction } from '@/lib/actions/mfa'
import { verifyMfaEnrollment } from '@/lib/auth/mutations'
import type { MfaEnrollState } from '@/lib/actions/mfa'
import BackupCodeVerifyForm from './BackupCodeVerifyForm'

type Mode = 'totp' | 'backup'

const initialState: MfaEnrollState = { error: null, rateLimited: false }

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      data-testid="mfa-verify-submit"
      className={cn(
        'h-10 w-full bg-dxt-primary text-white hover:bg-dxt-primary/90',
        'focus-visible:ring-2 focus-visible:ring-dxt-primary',
      )}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
          Verifying...
        </>
      ) : (
        'Verify'
      )}
    </Button>
  )
}

export default function MfaVerifyForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('totp')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [factorError, setFactorError] = useState<string | null>(null)
  const [loadingFactors, setLoadingFactors] = useState(true)
  const verifyInProgress = useRef(false)
  const factorsLoaded = useRef(false)

  const [actionState, formAction] = useActionState(
    async (prevState: MfaEnrollState, formData: FormData) => {
      setClientError(null)
      const result = await verifyMfaEnrollmentAction(prevState, formData)

      if (result.error) {
        return result
      }

      if (!factorId) {
        return { error: 'MFA setup incomplete. Please refresh and try again.', rateLimited: false }
      }

      if (verifyInProgress.current) {
        return { error: null, rateLimited: false }
      }
      verifyInProgress.current = true
      setVerifying(true)

      try {
        await verifyMfaEnrollment(factorId, formData.get('code') as string)
        verifyInProgress.current = false
        setVerifying(false)
        router.push('/dashboard')
        return result
      } catch {
        verifyInProgress.current = false
        setVerifying(false)
        setClientError('Invalid or expired code')
        return { error: null, rateLimited: false }
      }
    },
    initialState,
  )

  const loadFactors = useCallback(async (cancelled: { current: boolean }) => {
    setLoadingFactors(true)
    setFactorError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (cancelled.current) return

      if (error) {
        setFactorError('Failed to load MFA factors. Please try again.')
        setLoadingFactors(false)
        return
      }

      const totpFactors = data?.totp ?? []
      if (totpFactors.length === 0) {
        router.push('/auth/mfa-enroll')
        return
      }

      setFactorId(totpFactors[0].id)
      setLoadingFactors(false)
      factorsLoaded.current = true
    } catch {
      if (!cancelled.current) {
        setFactorError('Failed to load MFA factors. Please try again.')
        setLoadingFactors(false)
      }
    }
  }, [router])

  useEffect(() => {
    if (factorsLoaded.current) return
    const cancelled = { current: false }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState is called asynchronously after await, not synchronously
    loadFactors(cancelled)
    return () => {
      cancelled.current = true
    }
  }, [loadFactors])

  const handleBackupCodeSuccess = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleRetryFactors = useCallback(() => {
    factorsLoaded.current = false
    loadFactors({ current: false })
  }, [loadFactors])

  const displayError = actionState.error || clientError

  // Loading state
  if (loadingFactors && !factorError) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center"
        data-testid="mfa-verify-loading"
      >
        <Loader2 size={32} className="animate-spin text-dxt-primary" aria-label="Loading" />
      </div>
    )
  }

  // Factor load error
  if (factorError) {
    return (
      <div
        className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10"
        data-testid="mfa-verify-factor-error"
      >
        <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-4 text-center">
          <p className="text-sm text-destructive">{factorError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleRetryFactors}
            data-testid="mfa-verify-retry"
            aria-label="Try again"
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // Backup code mode
  if (mode === 'backup') {
    return (
      <div className="w-full max-w-sm space-y-4" data-testid="mfa-verify-backup-mode">
        <BackupCodeVerifyForm onSuccess={handleBackupCodeSuccess} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode('totp')}
            data-testid="mfa-verify-toggle-totp"
            className={cn(
              'text-sm text-dxt-primary hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2',
            )}
          >
            Back to authenticator
          </button>
        </div>
      </div>
    )
  }

  // TOTP mode (default)
  return (
    <div
      className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10"
      data-testid="mfa-verify-form"
    >
      <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-dxt-primary/10">
            <ShieldCheck size={24} className="text-dxt-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verify Your Identity
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
              autoFocus
              disabled={verifying}
              aria-label="6-digit verification code"
              aria-describedby={displayError ? 'mfa-verify-error-message' : undefined}
              data-testid="mfa-verify-code-input"
              className="text-center text-lg tracking-widest focus-visible:ring-2 focus-visible:ring-dxt-primary"
            />
          </div>

          {displayError && (
            <div
              id="mfa-verify-error-message"
              role="alert"
              data-testid="mfa-verify-error"
              className={cn(
                'rounded-md p-3 text-sm',
                actionState.rateLimited
                  ? 'border border-amber-200 bg-amber-50 text-amber-800'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {displayError}
            </div>
          )}

          <SubmitButton disabled={verifying || !factorId} />
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode('backup')}
            data-testid="mfa-verify-toggle-backup"
            className={cn(
              'inline-flex items-center gap-1.5 text-sm text-dxt-primary hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2',
            )}
          >
            <KeyRound size={14} aria-hidden="true" />
            Use backup code
          </button>
        </div>
      </div>
    </div>
  )
}
