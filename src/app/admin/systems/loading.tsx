import SystemsSkeleton from './_components/SystemsSkeleton'

export default function SystemsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-lg border border-border bg-card">
        <SystemsSkeleton />
      </div>
    </div>
  )
}
