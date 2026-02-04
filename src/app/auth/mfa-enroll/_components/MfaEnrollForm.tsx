'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { enrollMfaFactor, verifyMfaEnrollment } from '@/lib/auth/mutations'
import { verifyMfaEnrollmentAction } from '@/lib/actions/mfa'
import { generateBackupCodesAction } from '@/lib/actions/backup-codes'
import type { MfaEnrollState } from '@/lib/actions/mfa'
import BackupCodesDisplay from './BackupCodesDisplay'

const initialState: MfaEnrollState = { error: null, rateLimited: false }

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      data-testid="mfa-verify-submit"
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
        'Verify & Enable MFA'
      )}
    </Button>
  )
}

export default function MfaEnrollForm() {
  const router = useRouter()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [enrolling, setEnrolling] = useState(true)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const enrollInProgress = useRef(false)

  const [actionState, formAction] = useActionState(
    async (prevState: MfaEnrollState, formData: FormData) => {
      setVerifyError(null)
      const result = await verifyMfaEnrollmentAction(prevState, formData)

      if (result.error) {
        return result
      }

      // Guard: factorId must exist before client-side verify
      if (!factorId) {
        return { error: 'MFA setup incomplete. Please refresh and try again.', rateLimited: false }
      }

      // Server action passed — now call client-side verify
      setVerifying(true)
      try {
        await verifyMfaEnrollment(factorId, formData.get('code') as string)

        // Generate backup codes after successful MFA verification
        const backupResult = await generateBackupCodesAction()
        if (backupResult.codes) {
          setBackupCodes(backupResult.codes)
          setShowBackupCodes(true)
        } else {
          // Backup code generation failed — still allow dashboard access
          router.push('/dashboard')
        }
        setVerifying(false)
        return result
      } catch {
        setVerifying(false)
        setVerifyError('Invalid code. Please try again.')
        return { error: null, rateLimited: false }
      }
    },
    initialState,
  )

  const displayError = actionState.error || verifyError || enrollError

  const performEnrollment = useCallback(async (cancelled: { current: boolean }) => {
    if (enrollInProgress.current) return
    enrollInProgress.current = true
    setEnrolling(true)
    setEnrollError(null)
    try {
      const data = await enrollMfaFactor()
      if (!cancelled.current) {
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setEnrolling(false)
      }
    } catch {
      if (!cancelled.current) {
        setEnrollError('Failed to set up MFA. Please try again.')
        setEnrolling(false)
      }
    } finally {
      enrollInProgress.current = false
    }
  }, [])

  useEffect(() => {
    const cancelled = { current: false }
    performEnrollment(cancelled)
    return () => {
      cancelled.current = true
    }
  }, [performEnrollment])

  function handleRetryEnroll() {
    setFactorId(null)
    setQrCode(null)
    setSecret(null)
    performEnrollment({ current: false })
  }

  if (showBackupCodes && backupCodes) {
    return (
      <BackupCodesDisplay
        codes={backupCodes}
        onContinue={() => router.push('/dashboard')}
      />
    )
  }

  return (
    <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10">
      <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Set Up MFA
          </h1>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with your authenticator app
          </p>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center space-y-4" data-testid="mfa-qr-section">
          {enrolling && (
            <div
              className="flex h-[200px] w-[200px] items-center justify-center"
              data-testid="mfa-enrolling-spinner"
            >
              <Loader2 size={32} className="animate-spin text-dxt-primary" aria-label="Loading MFA setup" />
            </div>
          )}

          {!enrolling && enrollError && (
            <div className="space-y-3 text-center" data-testid="mfa-enroll-error">
              <p className="text-sm text-destructive">{enrollError}</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetryEnroll}
                data-testid="mfa-retry-enroll"
                aria-label="Try again"
              >
                Try again
              </Button>
            </div>
          )}

          {!enrolling && qrCode && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="Scan this QR code with your authenticator app"
                width={200}
                height={200}
                data-testid="mfa-qr-code"
              />

              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                className={cn(
                  'text-sm text-dxt-primary hover:underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:ring-offset-2',
                )}
                data-testid="mfa-toggle-secret"
                aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
              >
                {showSecret ? 'Hide secret key' : "Can't scan? Show secret key"}
              </button>

              {showSecret && secret && (
                <output
                  className="select-all rounded-md bg-muted px-4 py-2 font-mono text-sm tracking-widest"
                  data-testid="mfa-secret-text"
                  aria-label="TOTP secret key for manual entry"
                >
                  {secret}
                </output>
              )}
            </>
          )}
        </div>

        {/* Verification Form */}
        {!enrolling && !enrollError && (
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
                aria-label="6-digit verification code"
                aria-describedby={displayError && !enrollError ? 'mfa-error-message' : undefined}
                data-testid="mfa-code-input"
                className="text-center text-lg tracking-widest focus-visible:ring-2 focus-visible:ring-dxt-primary"
              />
            </div>

            {displayError && !enrollError && (
              <div
                id="mfa-error-message"
                role="alert"
                aria-live="polite"
                data-testid="mfa-error"
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
        )}
      </div>
    </div>
  )
}
