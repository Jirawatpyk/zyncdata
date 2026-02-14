'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/validations/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const sessionChecked = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  })

  useEffect(() => {
    const supabase = createClient()

    // Listen for PASSWORD_RECOVERY event (hash fragment auto-detection)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true)
        sessionChecked.current = true
      }
    })

    // Fallback: check existing session (hash may have already been processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true)
        sessionChecked.current = true
      }
    })

    // Timeout: redirect if no session detected within 3 seconds
    const timeout = setTimeout(() => {
      if (!sessionChecked.current) {
        router.replace('/auth/login?error=session_expired')
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  async function onSubmit(data: UpdatePasswordInput) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setServerError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.replace('/auth/login')
    }, 2000)
  }

  // Loading state while checking session
  if (!hasSession && !success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying recovery link...
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10">
        <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Set New Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div
              role="status"
              className="rounded-md bg-emerald-50 p-4 text-center text-sm text-emerald-800 border border-emerald-200"
              data-testid="update-password-success"
            >
              Password updated successfully. Redirecting to login...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              data-testid="update-password-form"
            >
              {serverError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                  data-testid="update-password-error"
                >
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  aria-label="New Password"
                  data-testid="update-password-input"
                  className="focus-visible:ring-2 focus-visible:ring-dxt-primary"
                />
                {errors.password && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  aria-label="Confirm Password"
                  data-testid="update-password-confirm-input"
                  className="focus-visible:ring-2 focus-visible:ring-dxt-primary"
                />
                {errors.confirmPassword && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="update-password-submit"
                className={cn(
                  'w-full bg-dxt-primary text-white hover:bg-dxt-primary/90',
                  'focus-visible:ring-2 focus-visible:ring-dxt-primary',
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
