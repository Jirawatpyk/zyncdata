import { Settings } from 'lucide-react'
import EmptyState from '@/components/patterns/EmptyState'

export const metadata = {
  title: 'Settings | Admin | zyncdata',
}

export default function SettingsPage() {
  return (
    <div className="p-6" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure system settings
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<Settings className="h-12 w-12" />}
          title="Settings Coming Soon"
          description="This feature will be available in Epic 6-7."
        />
      </div>
    </div>
  )
}
