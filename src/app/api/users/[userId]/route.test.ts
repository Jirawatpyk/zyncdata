import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { PATCH } from './route'
import { LastSuperAdminError } from '@/lib/users/mutations'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockUpdateCmsUserRole = vi.fn()
const mockListCmsUsers = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/users/mutations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/users/mutations')>()
  return {
    ...actual,
    updateCmsUserRole: (...args: unknown[]) => mockUpdateCmsUserRole(...args),
  }
})

vi.mock('@/lib/users/queries', () => ({
  listCmsUsers: () => mockListCmsUsers(),
}))

function createPatchRequest(body: unknown): Request {
  return new Request('http://localhost/api/users/user-001', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createParams(userId: string): Promise<{ userId: string }> {
  return Promise.resolve({ userId })
}

describe('PATCH /api/users/[userId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('user-001') })

    expect(response).toBe(authErrorResponse)
    expect(mockUpdateCmsUserRole).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid role value', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createPatchRequest({ role: 'manager' })
    const response = await PATCH(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateCmsUserRole).not.toHaveBeenCalled()
  })

  it('should return 409 when trying to change own role', async () => {
    mockRequireApiAuth.mockResolvedValue(
      createMockAuth({ user: { id: 'user-001' } as never, role: 'super_admin' }),
    )
    mockIsAuthError.mockReturnValue(false)

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error.message).toBe('Cannot change your own role')
    expect(body.error.code).toBe('CONFLICT')
    expect(mockUpdateCmsUserRole).not.toHaveBeenCalled()
  })

  it('should update role and return 200 on success', async () => {
    const updatedUser = {
      id: 'user-002',
      email: 'target@dxt.com',
      role: 'admin',
      isConfirmed: true,
      lastSignInAt: null,
      createdAt: '2026-01-01T00:00:00Z',
    }
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue([
      { id: 'user-002', email: 'target@dxt.com', role: 'user', isConfirmed: true, lastSignInAt: null, createdAt: '2026-01-01T00:00:00Z' },
    ])
    mockUpdateCmsUserRole.mockResolvedValue(updatedUser)

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('user-002') })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: updatedUser, error: null })
    expect(mockUpdateCmsUserRole).toHaveBeenCalledWith('user-002', 'user', { role: 'admin' })
  })

  it('should return 409 for last super admin error', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue([
      { id: 'sa-only', email: 'sa@dxt.com', role: 'super_admin', isConfirmed: true, lastSignInAt: null, createdAt: '2026-01-01T00:00:00Z' },
    ])
    mockUpdateCmsUserRole.mockRejectedValue(new LastSuperAdminError())

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('sa-only') })
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
    expect(body.error.message).toBe('At least one Super Admin is required')
  })

  it('should return 404 when user not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue([])

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('nonexistent') })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.message).toBe('User not found')
  })

  it('should return 500 for unexpected server errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue([
      { id: 'user-002', email: 'target@dxt.com', role: 'user', isConfirmed: true, lastSignInAt: null, createdAt: '2026-01-01T00:00:00Z' },
    ])
    mockUpdateCmsUserRole.mockRejectedValue(new Error('Database connection failed'))

    const request = createPatchRequest({ role: 'admin' })
    const response = await PATCH(request, { params: createParams('user-002') })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })

  it('should return 400 for missing role in body', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createPatchRequest({})
    const response = await PATCH(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for empty role string', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createPatchRequest({ role: '' })
    const response = await PATCH(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
