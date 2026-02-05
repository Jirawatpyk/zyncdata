import LoadingSpinner from '@/components/patterns/LoadingSpinner'

export default function AdminLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <LoadingSpinner delay={0} />
    </div>
  )
}
