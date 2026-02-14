import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCmsUser } from './mutations'

// Mock server-only (no-op)
vi.mock('server-only', () => ({}))

const mockCreateUser = vi.fn()
const mockInviteUserByEmail = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        inviteUserByEmail: mockInviteUserByEmail,
      },
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
