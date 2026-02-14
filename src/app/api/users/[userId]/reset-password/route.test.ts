import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { POST } from './route'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockResetCmsUserPassword = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/users/mutations', () => ({
  resetCmsUserPassword: (...args: unknown[]) => mockResetCmsUserPassword(...args),
}))

function createPostRequest(): Request {
  return new Request('http://localhost/api/users/user-001/reset-password', {
    method: 'POST',
  })
}

function createParams(userId: string): Promise<{ userId: string }> {
  return Promise.resolve({ userId })
}

describe('POST /api/users/[userId]/reset-password', () => {
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

    const request = createPostRequest()
    const response = await POST(request, { params: createParams('user-001') })

    expect(response).toBe(authErrorResponse)
    expect(mockResetCmsUserPassword).not.toHaveBeenCalled()
  })

  it('should send reset email and return 200 on success', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockResetCmsUserPassword.mockResolvedValue({ email: 'target@dxt.com' })

    const request = createPostRequest()
    const response = await POST(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: { email: 'target@dxt.com' }, error: null })
    expect(mockResetCmsUserPassword).toHaveBeenCalledWith('user-001')
  })

  it('should return 404 when user not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockResetCmsUserPassword.mockRejectedValue(new Error('User not found'))

    const request = createPostRequest()
    const response = await POST(request, { params: createParams('bad-id') })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.message).toBe('User not found')
  })

  it('should return 500 for email delivery failures', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth({ role: 'super_admin' }))
    mockIsAuthError.mockReturnValue(false)
    mockResetCmsUserPassword.mockRejectedValue(
      new Error('Failed to send password reset email: SMTP error'),
    )

    const request = createPostRequest()
    const response = await POST(request, { params: createParams('user-001') })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Failed to send password reset email')
  })

  it('should return 403 when non-super_admin user calls endpoint', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = createPostRequest()
    const response = await POST(request, { params: createParams('user-001') })

    expect(response).toBe(authErrorResponse)
    expect(mockResetCmsUserPassword).not.toHaveBeenCalled()
  })
})
