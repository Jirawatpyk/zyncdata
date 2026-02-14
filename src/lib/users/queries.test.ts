import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listCmsUsers } from './queries'

// Mock server-only (no-op)
vi.mock('server-only', () => ({}))

const mockListUsers = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
  }),
}))

describe('listCmsUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return transformed CMS users', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-1',
            email: 'admin@dxt.com',
            app_metadata: { role: 'admin' },
            email_confirmed_at: '2026-01-15T00:00:00Z',
            last_sign_in_at: '2026-02-14T10:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'user-2',
            email: 'viewer@dxt.com',
            app_metadata: { role: 'user' },
            email_confirmed_at: null,
            last_sign_in_at: null,
            created_at: '2026-02-10T00:00:00Z',
          },
        ],
      },
      error: null,
    })

    const result = await listCmsUsers()

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'user-1',
      email: 'admin@dxt.com',
      role: 'admin',
      isConfirmed: true,
      lastSignInAt: '2026-02-14T10:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(result[1]).toEqual({
      id: 'user-2',
      email: 'viewer@dxt.com',
      role: 'user',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-10T00:00:00Z',
    })
  })

  it('should default role to user when app_metadata.role is missing', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-3',
            email: 'norole@dxt.com',
            app_metadata: {},
            email_confirmed_at: '2026-01-01T00:00:00Z',
            last_sign_in_at: null,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      },
      error: null,
    })

    const result = await listCmsUsers()
    expect(result[0].role).toBe('user')
  })

  it('should default email to empty string when null', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-4',
            email: null,
            app_metadata: { role: 'admin' },
            email_confirmed_at: null,
            last_sign_in_at: null,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      },
      error: null,
    })

    const result = await listCmsUsers()
    expect(result[0].email).toBe('')
  })

  it('should return empty array when no users exist', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    })

    const result = await listCmsUsers()
    expect(result).toEqual([])
  })

  it('should throw when Supabase returns an error', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: { message: 'Service unavailable' },
    })

    await expect(listCmsUsers()).rejects.toThrow('Failed to list users: Service unavailable')
  })
})
