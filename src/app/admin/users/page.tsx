import { requireAuth } from '@/lib/auth/guard'
import UsersTable from './_components/UsersTable'

export const metadata = {
  title: 'Users | Admin | zyncdata',
}

export default async function UsersPage() {
  const { user } = await requireAuth('super_admin')

  return (
    <div className="p-6" data-testid="users-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Manage CMS user accounts</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <UsersTable currentAuthUserId={user.id} />
      </div>
    </div>
  )
}
