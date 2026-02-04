'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction } from '@/lib/actions/auth'
import type { LoginState } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const initialState: LoginState = { error: null, rateLimited: false }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      data-testid="login-submit"
      className={cn(
        'w-full bg-dxt-primary text-white hover:bg-dxt-primary/90',
        'focus-visible:ring-2 focus-visible:ring-dxt-primary',
      )}
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  )
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-sm rounded-xl bg-gradient-to-br from-dxt-primary/25 via-white/10 to-dxt-secondary/25 p-px shadow-xl shadow-dxt-primary/10 motion-safe:animate-fade-up">
    <div className="rounded-xl bg-white/95 p-8 backdrop-blur-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to access the CMS</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-label="Email address"
            data-testid="login-email"
            className="focus-visible:ring-2 focus-visible:ring-dxt-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-label="Password"
              data-testid="login-password"
              className="pr-10 focus-visible:ring-2 focus-visible:ring-dxt-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              data-testid="toggle-password"
              className={cn(
                'absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground',
                'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary',
              )}
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {state.error && (
          <div
            role="alert"
            aria-live="polite"
            data-testid="login-error"
            className={cn(
              'rounded-md p-3 text-sm',
              state.rateLimited
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
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
