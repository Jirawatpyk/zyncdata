import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCmsUser, updateCmsUserRole, LastSuperAdminError, resetCmsUserPassword } from './mutations'

// Mock server-only (no-op)
vi.mock('server-only', () => ({}))

const mockCreateUser = vi.fn()
const mockInviteUserByEmail = vi.fn()
const mockUpdateUserById = vi.fn()
const mockListUsers = vi.fn()
const mockGetUserById = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        inviteUserByEmail: mockInviteUserByEmail,
        updateUserById: mockUpdateUserById,
        listUsers: mockListUsers,
        getUserById: mockGetUserById,
      },
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}))

const mockAuthUser = {
  id: 'new-user-id',
  email: 'new@dxt.com',
  app_metadata: { role: 'admin' },
  email_confirmed_at: null,
  last_sign_in_at: null,
  created_at: '2026-02-14T00:00:00Z',
}

describe('createCmsUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create user with role in app_metadata and send invite', async () => {
    mockCreateUser.mockResolvedValue({ data: { user: mockAuthUser }, error: null })
    mockInviteUserByEmail.mockResolvedValue({ error: null })

    const result = await createCmsUser({ email: 'new@dxt.com', role: 'admin' })

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'new@dxt.com',
      app_metadata: { role: 'admin' },
      email_confirm: false,
    })
    expect(mockInviteUserByEmail).toHaveBeenCalledWith('new@dxt.com', {
      redirectTo: expect.stringContaining('/auth/login'),
    })
    expect(result).toEqual({
      id: 'new-user-id',
      email: 'new@dxt.com',
      role: 'admin',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-14T00:00:00Z',
    })
  })

  it('should throw "already exists" for duplicate email', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'A user with this email address has already been registered' },
    })

    await expect(createCmsUser({ email: 'dup@dxt.com', role: 'user' })).rejects.toThrow(
      'A user with this email already exists',
    )
    expect(mockInviteUserByEmail).not.toHaveBeenCalled()
  })

  it('should throw generic error for other create failures', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Service unavailable' },
    })

    await expect(createCmsUser({ email: 'err@dxt.com', role: 'admin' })).rejects.toThrow(
      'Failed to create user: Service unavailable',
    )
    expect(mockInviteUserByEmail).not.toHaveBeenCalled()
  })

  it('should succeed even if invite email fails', async () => {
    mockCreateUser.mockResolvedValue({ data: { user: mockAuthUser }, error: null })
    mockInviteUserByEmail.mockResolvedValue({ error: { message: 'SMTP error' } })

    const result = await createCmsUser({ email: 'new@dxt.com', role: 'admin' })

    // User creation succeeds even though invite failed
    expect(result.id).toBe('new-user-id')
    expect(result.email).toBe('new@dxt.com')
  })

  it('should throw when createUser returns null user without error', async () => {
    mockCreateUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(createCmsUser({ email: 'new@dxt.com', role: 'admin' })).rejects.toThrow(
      'Failed to create user: no user returned',
    )
    expect(mockInviteUserByEmail).not.toHaveBeenCalled()
  })

  it('should create user with user role', async () => {
    const userRoleAuthUser = { ...mockAuthUser, app_metadata: { role: 'user' } }
    mockCreateUser.mockResolvedValue({ data: { user: userRoleAuthUser }, error: null })
    mockInviteUserByEmail.mockResolvedValue({ error: null })

    const result = await createCmsUser({ email: 'new@dxt.com', role: 'user' })

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ app_metadata: { role: 'user' } }),
    )
    expect(result.role).toBe('user')
  })
})

describe('updateCmsUserRole', () => {
  const mockUpdatedUser = {
    id: 'user-001',
    email: 'admin@dxt.com',
    app_metadata: { role: 'user' },
    email_confirmed_at: '2026-01-01T00:00:00Z',
    last_sign_in_at: '2026-02-10T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update user role via admin API', async () => {
    // User is currently admin, has 2 super_admins in the system
    mockUpdateUserById.mockResolvedValue({ data: { user: mockUpdatedUser }, error: null })
    mockListUsers.mockResolvedValue({
      data: { users: [
        { id: 'sa-1', app_metadata: { role: 'super_admin' } },
        { id: 'sa-2', app_metadata: { role: 'super_admin' } },
        { id: 'user-001', app_metadata: { role: 'admin' } },
      ] },
      error: null,
    })

    const result = await updateCmsUserRole('user-001', 'admin', { role: 'user' })

    expect(mockUpdateUserById).toHaveBeenCalledWith('user-001', {
      app_metadata: { role: 'user' },
    })
    expect(result).toEqual({
      id: 'user-001',
      email: 'admin@dxt.com',
      role: 'user',
      isConfirmed: true,
      lastSignInAt: '2026-02-10T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })

  it('should throw LastSuperAdminError when demoting the last super admin', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [
        { id: 'sa-only', app_metadata: { role: 'super_admin' } },
        { id: 'user-002', app_metadata: { role: 'admin' } },
      ] },
      error: null,
    })

    await expect(
      updateCmsUserRole('sa-only', 'super_admin', { role: 'admin' }),
    ).rejects.toThrow(LastSuperAdminError)

    await expect(
      updateCmsUserRole('sa-only', 'super_admin', { role: 'admin' }),
    ).rejects.toThrow('At least one Super Admin is required')

    expect(mockUpdateUserById).not.toHaveBeenCalled()
  })

  it('should allow demoting super admin when multiple exist', async () => {
    const updatedSa = { ...mockUpdatedUser, id: 'sa-1', app_metadata: { role: 'admin' } }
    mockUpdateUserById.mockResolvedValue({ data: { user: updatedSa }, error: null })
    mockListUsers.mockResolvedValue({
      data: { users: [
        { id: 'sa-1', app_metadata: { role: 'super_admin' } },
        { id: 'sa-2', app_metadata: { role: 'super_admin' } },
      ] },
      error: null,
    })

    const result = await updateCmsUserRole('sa-1', 'super_admin', { role: 'admin' })

    expect(mockUpdateUserById).toHaveBeenCalled()
    expect(result.role).toBe('admin')
  })

  it('should skip super admin check when not demoting from super_admin', async () => {
    const updatedAdmin = { ...mockUpdatedUser, app_metadata: { role: 'super_admin' } }
    mockUpdateUserById.mockResolvedValue({ data: { user: updatedAdmin }, error: null })

    await updateCmsUserRole('user-001', 'admin', { role: 'super_admin' })

    // listUsers should NOT be called since we're promoting, not demoting
    expect(mockListUsers).not.toHaveBeenCalled()
    expect(mockUpdateUserById).toHaveBeenCalled()
  })

  it('should throw on updateUserById error', async () => {
    mockUpdateUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not found' },
    })

    await expect(
      updateCmsUserRole('bad-id', 'admin', { role: 'user' }),
    ).rejects.toThrow('Failed to update user role: User not found')
  })
})

describe('resetCmsUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
  })

  it('should look up user by ID and send reset email', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { id: 'user-001', email: 'reset@dxt.com' } },
      error: null,
    })
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const result = await resetCmsUserPassword('user-001')

    expect(mockGetUserById).toHaveBeenCalledWith('user-001')
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('reset@dxt.com', {
      redirectTo: 'http://localhost:3000/auth/update-password',
    })
    expect(result).toEqual({ email: 'reset@dxt.com' })
  })

  it('should throw when user not found', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not found' },
    })

    await expect(resetCmsUserPassword('bad-id')).rejects.toThrow('User not found')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('should throw when getUserById returns null user without error', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    await expect(resetCmsUserPassword('bad-id')).rejects.toThrow('User not found')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('should throw when resetPasswordForEmail fails', async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { id: 'user-001', email: 'reset@dxt.com' } },
      error: null,
    })
    mockResetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded' },
    })

    await expect(resetCmsUserPassword('user-001')).rejects.toThrow(
      'Failed to send password reset email: Rate limit exceeded',
    )
  })

  it('should handle missing NEXT_PUBLIC_SITE_URL gracefully', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    mockGetUserById.mockResolvedValue({
      data: { user: { id: 'user-001', email: 'reset@dxt.com' } },
      error: null,
    })
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const result = await resetCmsUserPassword('user-001')

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('reset@dxt.com', {
      redirectTo: '/auth/update-password',
    })
    expect(result).toEqual({ email: 'reset@dxt.com' })
  })
})
