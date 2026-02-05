import { requireAuth } from '@/lib/auth/guard'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin or Super Admin can access admin panel
  await requireAuth('admin')

  return <>{children}</>
}
