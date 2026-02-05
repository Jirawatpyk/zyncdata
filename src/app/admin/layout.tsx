import { requireAuth } from '@/lib/auth/guard'
import { QueryProvider } from '@/components/providers/query-provider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin or Super Admin can access admin panel
  await requireAuth('admin')

  return <QueryProvider>{children}</QueryProvider>
}
