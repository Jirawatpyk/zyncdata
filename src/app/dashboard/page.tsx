import LogoutButton from '@/components/patterns/LogoutButton'

export const metadata = {
  title: 'Dashboard | zyncdata',
  description: 'zyncdata health monitoring dashboard',
}

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <LogoutButton />
        </div>
        <p className="text-sm text-muted-foreground">Dashboard coming in Epic 3+</p>
      </div>
    </main>
  )
}
