import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET, POST } from './route'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockListCmsUsers = vi.fn()
const mockCreateCmsUser = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/users/queries', () => ({
  listCmsUsers: () => mockListCmsUsers(),
}))

vi.mock('@/lib/users/mutations', () => ({
  createCmsUser: (input: unknown) => mockCreateCmsUser(input),
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/users', () => {
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

    const response = await GET()

    expect(response).toBe(authErrorResponse)
    expect(mockListCmsUsers).not.toHaveBeenCalled()
  })

  it('should return 403 when authenticated as admin (not super_admin)', async () => {
    const forbiddenResponse = NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(forbiddenResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await GET()

    expect(response).toBe(forbiddenResponse)
    expect(mockListCmsUsers).not.toHaveBeenCalled()
  })

  it('should return users when authenticated as super_admin', async () => {
    const mockUsers = [
      { id: 'u1', email: 'admin@dxt.com', role: 'admin', isConfirmed: true, lastSignInAt: null, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'u2', email: 'user@dxt.com', role: 'user', isConfirmed: false, lastSignInAt: null, createdAt: '2026-02-01T00:00:00Z' },
    ]
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue(mockUsers)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: mockUsers, error: null })
  })

  it('should return empty array when no users exist', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockResolvedValue([])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: [], error: null })
  })

  it('should return 500 when listCmsUsers throws', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockListCmsUsers.mockRejectedValue(new Error('Service error'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to fetch users', code: 'INTERNAL_ERROR' },
    })
  })
})

describe('POST /api/users', () => {
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

    const request = createRequest({ email: 'test@dxt.com', role: 'admin' })
    const response = await POST(request)

    expect(response).toBe(authErrorResponse)
    expect(mockCreateCmsUser).not.toHaveBeenCalled()
  })

  it('should create user and return 201 on success', async () => {
    const createdUser = {
      id: 'new-id',
      email: 'new@dxt.com',
      role: 'admin',
      isConfirmed: false,
      lastSignInAt: null,
      createdAt: '2026-02-14T00:00:00Z',
    }
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockCreateCmsUser.mockResolvedValue(createdUser)

    const request = createRequest({ email: 'new@dxt.com', role: 'admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({ data: createdUser, error: null })
    expect(mockCreateCmsUser).toHaveBeenCalledWith({ email: 'new@dxt.com', role: 'admin' })
  })

  it('should return 400 for invalid email format', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({ email: 'not-email', role: 'admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateCmsUser).not.toHaveBeenCalled()
  })

  it('should return 400 for missing email', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({ role: 'admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for super_admin role (rejected by schema)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({ email: 'test@dxt.com', role: 'super_admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateCmsUser).not.toHaveBeenCalled()
  })

  it('should return 409 for duplicate email', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockCreateCmsUser.mockRejectedValue(new Error('A user with this email already exists'))

    const request = createRequest({ email: 'dup@dxt.com', role: 'admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      data: null,
      error: { message: 'A user with this email already exists', code: 'CONFLICT' },
    })
  })

  it('should return 500 for generic server errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockCreateCmsUser.mockRejectedValue(new Error('Database connection failed'))

    const request = createRequest({ email: 'test@dxt.com', role: 'admin' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to create user', code: 'INTERNAL_ERROR' },
    })
  })
})
