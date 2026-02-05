import { Suspense } from 'react'
import { getSystems } from '@/lib/systems/queries'
import LoadingSpinner from '@/components/patterns/LoadingSpinner'
import SystemsList from './_components/SystemsList'
import SystemsEmptyState from './_components/SystemsEmptyState'

export const metadata = {
  title: 'Systems | Admin | zyncdata',
}

async function SystemsContent() {
  const systems = await getSystems()

  if (systems.length === 0) {
    return <SystemsEmptyState />
  }

  // Prefetch shows initial data, then client hydrates with React Query
  return <SystemsList />
}

export default function SystemsPage() {
  return (
    <div className="p-6" data-testid="systems-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Systems</h1>
        <p className="text-sm text-muted-foreground">
          Manage your monitored systems
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Suspense fallback={<LoadingSpinner />}>
          <SystemsContent />
        </Suspense>
      </div>
    </div>
  )
}
