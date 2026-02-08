'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationSettingsQueryOptions } from '@/lib/admin/queries/notifications'
import { useUpdateNotificationSettings } from '@/lib/admin/mutations/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Bell, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { z } from 'zod'

const emailSchema = z.string().email()

export default function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const { data: settings, isPending } = useQuery(notificationSettingsQueryOptions())
  const updateMutation = useUpdateNotificationSettings()

  const [localEmails, setLocalEmails] = useState<string[]>([])
  const [localNotifyFailure, setLocalNotifyFailure] = useState(true)
  const [localNotifyRecovery, setLocalNotifyRecovery] = useState(true)

  // Resync local state when server data changes (render-time adjustment per React docs)
  const [prevSettings, setPrevSettings] = useState(settings)
  if (settings !== prevSettings) {
    setPrevSettings(settings)
    if (settings) {
      setLocalEmails(settings.notificationEmails)
      setLocalNotifyFailure(settings.notifyOnFailure)
      setLocalNotifyRecovery(settings.notifyOnRecovery)
    }
  }

  function handleAddEmail() {
    const trimmed = newEmail.trim()
    if (!trimmed) return

    const parsed = emailSchema.safeParse(trimmed)
    if (!parsed.success) {
      setEmailError('Please enter a valid email address')
      return
    }

    if (localEmails.includes(trimmed)) {
      setEmailError('Email already added')
      return
    }

    if (localEmails.length >= 10) {
      setEmailError('Maximum 10 email addresses')
      return
    }

    setLocalEmails([...localEmails, trimmed])
    setNewEmail('')
    setEmailError('')
  }

  function handleRemoveEmail(email: string) {
    setLocalEmails(localEmails.filter((e) => e !== email))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        notificationEmails: localEmails,
        notifyOnFailure: localNotifyFailure,
        notifyOnRecovery: localNotifyRecovery,
      })
    } catch {
      // onError callback handles toast.error
    }
  }

  const hasChanges = !!settings && (
    JSON.stringify(localEmails) !== JSON.stringify(settings.notificationEmails) ||
    localNotifyFailure !== settings.notifyOnFailure ||
    localNotifyRecovery !== settings.notifyOnRecovery
  )

  return (
    <div className="rounded-lg border border-border bg-card" data-testid="notification-settings">
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between p-4 text-left min-h-11',
          'hover:bg-muted/50 transition-colors',
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        data-testid="notification-settings-toggle"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Notification Settings</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border p-4 space-y-6" data-testid="notification-settings-content">
          {isPending ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          ) : (
            <>
              {/* Email Recipients */}
              <div className="space-y-3">
                <Label>Notification Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value)
                      setEmailError('')
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    data-testid="email-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddEmail}
                    className="min-h-11 min-w-11"
                    data-testid="add-email-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {emailError && (
                  <p className="text-sm text-destructive" data-testid="email-error">{emailError}</p>
                )}

                {localEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="email-list">
                    {localEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 rounded-full p-2 hover:bg-destructive/20 min-h-11 min-w-11 inline-flex items-center justify-center"
                          aria-label={`Remove ${email}`}
                          data-testid={`remove-email-${email}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {localEmails.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recipients configured. Add email addresses to receive notifications.
                  </p>
                )}
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-failure" className="cursor-pointer">
                    Notify on failure
                  </Label>
                  <Switch
                    id="notify-failure"
                    checked={localNotifyFailure}
                    onCheckedChange={setLocalNotifyFailure}
                    data-testid="notify-failure-switch"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-recovery" className="cursor-pointer">
                    Notify on recovery
                  </Label>
                  <Switch
                    id="notify-recovery"
                    checked={localNotifyRecovery}
                    onCheckedChange={setLocalNotifyRecovery}
                    data-testid="notify-recovery-switch"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="min-h-11"
                data-testid="save-notification-settings"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
