'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { systemHealthConfigQueryOptions } from '@/lib/admin/queries/health'
import { useUpdateHealthConfig } from '@/lib/admin/mutations/health'
import { updateHealthConfigSchema, type UpdateHealthConfig } from '@/lib/validations/health'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

interface HealthConfigDialogProps {
  systemId: string
  systemName: string
}

export default function HealthConfigDialog({ systemId, systemName }: HealthConfigDialogProps) {
  const [open, setOpen] = useState(false)

  const { data: config, isPending } = useQuery({
    ...systemHealthConfigQueryOptions(systemId),
    enabled: open && !!systemId,
  })

  const updateMutation = useUpdateHealthConfig(systemId)

  const form = useForm<UpdateHealthConfig>({
    resolver: zodResolver(updateHealthConfigSchema),
    defaultValues: {
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    },
  })

  // Sync form with server data when dialog opens
  useEffect(() => {
    if (config && open) {
      form.reset({
        checkInterval: config.checkInterval,
        timeoutThreshold: config.timeoutThreshold,
        failureThreshold: config.failureThreshold,
      })
    }
  }, [config, open, form])

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      form.reset()
    }
  }

  async function handleSubmit(data: UpdateHealthConfig) {
    try {
      await updateMutation.mutateAsync(data)
      setOpen(false)
    } catch {
      // onError callback handles toast.error
    }
  }

  function handleResetToDefaults() {
    form.setValue('checkInterval', null, { shouldDirty: true })
    form.setValue('timeoutThreshold', null, { shouldDirty: true })
    form.setValue('failureThreshold', null, { shouldDirty: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          data-testid={`health-config-trigger-${systemId}`}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Health check settings for {systemName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="health-config-dialog">
        <DialogHeader>
          <DialogTitle>Health Check Settings</DialogTitle>
          <DialogDescription>
            Configure health check parameters for {systemName}. Set to empty to use global defaults.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="animate-pulse space-y-4" data-testid="health-config-loading">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Controller
              control={form.control}
              name="checkInterval"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="checkInterval">Check Interval (seconds)</Label>
                  <Input
                    id="checkInterval"
                    type="number"
                    placeholder="60 (default)"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    data-testid="input-check-interval"
                  />
                  <p className="text-xs text-muted-foreground">30s - 24h. Per-system intervals will be enforced in a future update.</p>
                  {fieldState.error && (
                    <p className="text-sm text-destructive" data-testid="error-check-interval">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="timeoutThreshold"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="timeoutThreshold">Timeout Threshold (ms)</Label>
                  <Input
                    id="timeoutThreshold"
                    type="number"
                    placeholder="10000 (default)"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    data-testid="input-timeout-threshold"
                  />
                  <p className="text-xs text-muted-foreground">1,000ms - 60,000ms (1s - 60s)</p>
                  {fieldState.error && (
                    <p className="text-sm text-destructive" data-testid="error-timeout-threshold">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="failureThreshold"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="failureThreshold">Failure Threshold (count)</Label>
                  <Input
                    id="failureThreshold"
                    type="number"
                    placeholder="3 (default)"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    data-testid="input-failure-threshold"
                  />
                  <p className="text-xs text-muted-foreground">1 - 10 consecutive failures before offline</p>
                  {fieldState.error && (
                    <p className="text-sm text-destructive" data-testid="error-failure-threshold">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToDefaults}
                className="min-h-11 text-muted-foreground"
                data-testid="reset-to-defaults"
              >
                Reset to defaults
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
                className="min-h-11"
                data-testid="save-health-config"
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
