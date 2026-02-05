import { requireAuth } from '@/lib/auth/guard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any authenticated user can access dashboard
  await requireAuth()

  return <>{children}</>
}
