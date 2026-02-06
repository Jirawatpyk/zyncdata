import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { PATCH } from './route'
import { createMockSystem, createMockAuth } from '@/lib/test-utils/mock-factories'
import type { System } from '@/lib/validations/system'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockToggleSystem = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/mutations', () => ({
  toggleSystem: (id: string, enabled: boolean) => mockToggleSystem(id, enabled),
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479/toggle', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createParams(
  id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/systems/[id]/toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =======================
  // Authentication Tests
  // =======================

  it('should return 401 when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = createRequest({ enabled: false })
    const response = await PATCH(request, createParams())

    expect(response).toBe(authErrorResponse)
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  it('should return 403 for non-admin roles', async () => {
    const forbiddenResponse = NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(forbiddenResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = createRequest({ enabled: true })
    const response = await PATCH(request, createParams())

    expect(response).toBe(forbiddenResponse)
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  // =======================
  // Malformed JSON Test
  // =======================

  it('should return 400 for malformed JSON body', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = new Request('http://localhost/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {',
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
    })
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  // =======================
  // Validation Tests
  // =======================

  it('should return 400 for invalid UUID in params', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({ enabled: true })
    const response = await PATCH(request, createParams('invalid-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Invalid system ID', code: 'VALIDATION_ERROR' },
    })
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for missing enabled field', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({})
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for non-boolean enabled', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({ enabled: 'true' })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockToggleSystem).not.toHaveBeenCalled()
  })

  // =======================
  // Success Cases
  // =======================

  it('should toggle system to disabled and return 200', async () => {
    const toggledSystem = createMockSystem({ enabled: false })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockToggleSystem.mockResolvedValue(toggledSystem)

    const request = createRequest({ enabled: false })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: toggledSystem, error: null })
    expect(mockToggleSystem).toHaveBeenCalledWith(
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      false,
    )
  })

  it('should toggle system to enabled and return 200', async () => {
    const toggledSystem = createMockSystem({ enabled: true })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockToggleSystem.mockResolvedValue(toggledSystem)

    const request = createRequest({ enabled: true })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: toggledSystem, error: null })
    expect(mockToggleSystem).toHaveBeenCalledWith(
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      true,
    )
  })

  // =======================
  // Error Cases
  // =======================

  it('should return 404 when system not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockToggleSystem.mockRejectedValue(new Error('System not found'))

    const request = createRequest({ enabled: true })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      data: null,
      error: { message: 'System not found', code: 'NOT_FOUND' },
    })
  })

  it('should return 500 for generic errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockToggleSystem.mockRejectedValue(new Error('Database connection failed'))

    const request = createRequest({ enabled: false })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to toggle system visibility', code: 'UPDATE_ERROR' },
    })
  })

  it('should strip unknown fields from request body', async () => {
    const toggledSystem = createMockSystem({ enabled: false })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockToggleSystem.mockResolvedValue(toggledSystem)

    const request = createRequest({ enabled: false, name: 'should be ignored' })
    const response = await PATCH(request, createParams())

    expect(response.status).toBe(200)
    expect(mockToggleSystem).toHaveBeenCalledWith(
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      false,
    )
  })
})
