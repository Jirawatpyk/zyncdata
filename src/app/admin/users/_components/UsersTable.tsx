'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersQueryOptions } from '@/lib/admin/queries/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { KeyRound, MoreHorizontal, UserCog } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { CmsUser } from '@/lib/validations/user'
import AddUserDialog from './AddUserDialog'
import EditRoleDialog from './EditRoleDialog'
import ResetPasswordDialog from './ResetPasswordDialog'

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'super_admin':
      return 'default' as const
    case 'admin':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Admin'
    case 'user':
      return 'User'
    default:
      return role
  }
}

function getStatusInfo(isConfirmed: boolean) {
  if (isConfirmed) {
    return { label: 'Active', variant: 'default' as const }
  }
  return { label: 'Invited', variant: 'outline' as const }
}

interface UsersTableProps {
  currentAuthUserId: string
}

export default function UsersTable({ currentAuthUserId }: UsersTableProps) {
  const { data: users, isLoading, isError } = useQuery(usersQueryOptions)
  const [editingUser, setEditingUser] = useState<CmsUser | null>(null)
  const [resettingUser, setResettingUser] = useState<CmsUser | null>(null)

  if (isLoading) {
    return (
      <div className="p-4" data-testid="users-table-loading">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-3 flex gap-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-destructive" data-testid="users-table-error">
        Failed to load users. Please try again later.
      </div>
    )
  }

  // Filter out only the super_admin user — show "no users" when only super_admin exists
  const displayUsers = users ?? []

  return (
    <>
      <div className="flex items-center justify-between border-b border-border p-4">
        <p className="text-sm text-muted-foreground">
          {displayUsers.length} {displayUsers.length === 1 ? 'user' : 'users'}
        </p>
        <AddUserDialog />
      </div>

      {displayUsers.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground" data-testid="users-empty-state">
          No users found. Add a user to get started.
        </div>
      ) : (
        <Table data-testid="users-table">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className={cn('w-[100px]')}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user) => {
              const statusInfo = getStatusInfo(user.isConfirmed)
              return (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastSignInAt
                      ? formatDistanceToNow(new Date(user.lastSignInAt), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {user.id !== currentAuthUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`user-actions-${user.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setEditingUser(user)}
                            data-testid={`change-role-${user.id}`}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setResettingUser(user)}
                            data-testid={`reset-password-${user.id}`}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          {/* Story 6-4 actions */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {editingUser && (
        <EditRoleDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null)
          }}
        />
      )}

      {resettingUser && (
        <ResetPasswordDialog
          user={resettingUser}
          open={!!resettingUser}
          onOpenChange={(open) => {
            if (!open) setResettingUser(null)
          }}
        />
      )}
    </>
  )
}
