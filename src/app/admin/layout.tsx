import { requireAuth } from '@/lib/auth/guard'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import AdminShell from './_components/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin or Super Admin can access admin panel
  const auth = await requireAuth('admin')

  return (
    <QueryProvider>
      <AdminShell auth={auth}>{children}</AdminShell>
      <Toaster position="bottom-right" visibleToasts={3} />
    </QueryProvider>
  )
}
