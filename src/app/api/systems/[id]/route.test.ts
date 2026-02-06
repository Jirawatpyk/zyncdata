import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { PATCH, DELETE } from './route'
import { createMockSystem, createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockUpdateSystem = vi.fn()
const mockDeleteSystem = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/mutations', () => ({
  updateSystem: (input: unknown) => mockUpdateSystem(input),
  deleteSystem: (id: string) => mockDeleteSystem(id),
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479', {
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

describe('PATCH /api/systems/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =======================
  // Malformed JSON Test
  // =======================

  it('should return 400 for malformed JSON body', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = new Request('http://localhost/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479', {
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
    expect(mockUpdateSystem).not.toHaveBeenCalled()
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

    const request = createRequest({
      name: 'Updated',
      url: 'https://updated.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())

    expect(response).toBe(authErrorResponse)
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 403 for non-admin roles', async () => {
    const forbiddenResponse = NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(forbiddenResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = createRequest({
      name: 'Updated',
      url: 'https://updated.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())

    expect(response).toBe(forbiddenResponse)
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  // =======================
  // Success Case
  // =======================

  it('should update system and return 200 on success', async () => {
    const updatedSystem = createMockSystem({
      name: 'Updated System',
      url: 'https://updated.example.com',
      description: 'Updated description',
      enabled: false,
      updatedAt: '2026-02-05T15:00:00Z',
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockResolvedValue(updatedSystem)

    const request = createRequest({
      name: 'Updated System',
      url: 'https://updated.example.com',
      description: 'Updated description',
      enabled: false,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: updatedSystem, error: null })
    expect(mockUpdateSystem).toHaveBeenCalledWith({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Updated System',
      url: 'https://updated.example.com',
      description: 'Updated description',
      enabled: false,
    })
  })

  it('should return full system object with updated timestamp', async () => {
    const updatedSystem = createMockSystem({
      name: 'Updated',
      updatedAt: '2026-02-05T16:00:00Z',
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockResolvedValue(updatedSystem)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(body.data.updatedAt).toBe('2026-02-05T16:00:00Z')
    expect(body.data.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  // =======================
  // Validation Tests (AC #3)
  // =======================

  it('should return 400 for invalid UUID in params', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams('invalid-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Invalid system ID', code: 'VALIDATION_ERROR' },
    })
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for empty name (AC #3)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: '',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Name required', code: 'VALIDATION_ERROR' },
    })
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid URL (AC #3)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'Updated',
      url: 'not-a-url',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Valid URL required', code: 'VALIDATION_ERROR' },
    })
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for name over 100 characters', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'A'.repeat(101),
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for description over 500 characters', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      description: 'A'.repeat(501),
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for missing enabled field', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      // enabled intentionally missing
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateSystem).not.toHaveBeenCalled()
  })

  // =======================
  // Not Found Test
  // =======================

  it('should return 404 when system not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockRejectedValue(new Error('System not found'))

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams('00000000-0000-0000-0000-000000000000'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      data: null,
      error: { message: 'System not found', code: 'NOT_FOUND' },
    })
  })

  // =======================
  // Duplicate Name Test
  // =======================

  it('should return 409 for duplicate name', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    )

    const request = createRequest({
      name: 'Existing System',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      data: null,
      error: {
        message: 'A system with this name already exists',
        code: 'DUPLICATE_NAME',
      },
    })
  })

  // =======================
  // Generic Error Test
  // =======================

  it('should return 500 for generic errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockRejectedValue(new Error('Database connection failed'))

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to update system', code: 'UPDATE_ERROR' },
    })
  })

  // =======================
  // Optional Fields
  // =======================

  it('should accept empty description string', async () => {
    const updatedSystem = createMockSystem({ description: '' })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockResolvedValue(updatedSystem)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      description: '',
      enabled: true,
    })
    const response = await PATCH(request, createParams())

    expect(response.status).toBe(200)
  })

  it('should accept request without description field', async () => {
    const updatedSystem = createMockSystem()

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockResolvedValue(updatedSystem)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await PATCH(request, createParams())

    expect(response.status).toBe(200)
    expect(mockUpdateSystem).toHaveBeenCalledWith({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
  })

  it('should strip unknown fields from request body', async () => {
    const updatedSystem = createMockSystem()

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSystem.mockResolvedValue(updatedSystem)

    const request = createRequest({
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
      unknownField: 'should be stripped',
      anotherUnknown: 123,
    })
    const response = await PATCH(request, createParams())

    expect(response.status).toBe(200)
    expect(mockUpdateSystem).toHaveBeenCalledWith({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Updated',
      url: 'https://example.com',
      enabled: true,
    })
  })
})

describe('DELETE /api/systems/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createDeleteRequest(): Request {
    return new Request('http://localhost/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479', {
      method: 'DELETE',
    })
  }

  it('should return 401 when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await DELETE(createDeleteRequest(), createParams())

    expect(response).toBe(authErrorResponse)
    expect(mockDeleteSystem).not.toHaveBeenCalled()
  })

  it('should return 403 for non-admin roles', async () => {
    const forbiddenResponse = NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(forbiddenResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await DELETE(createDeleteRequest(), createParams())

    expect(response).toBe(forbiddenResponse)
    expect(mockDeleteSystem).not.toHaveBeenCalled()
  })

  it('should soft-delete system and return 200 on success', async () => {
    const deletedSystem = createMockSystem({
      enabled: false,
      deletedAt: '2026-02-05T12:00:00Z',
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockDeleteSystem.mockResolvedValue(deletedSystem)

    const response = await DELETE(createDeleteRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: deletedSystem, error: null })
    expect(mockDeleteSystem).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479')
  })

  it('should return 400 for invalid UUID in params', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await DELETE(createDeleteRequest(), createParams('invalid-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Invalid system ID', code: 'VALIDATION_ERROR' },
    })
    expect(mockDeleteSystem).not.toHaveBeenCalled()
  })

  it('should return 404 when system not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockDeleteSystem.mockRejectedValue(new Error('System not found'))

    const response = await DELETE(createDeleteRequest(), createParams())
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
    mockDeleteSystem.mockRejectedValue(new Error('Database connection failed'))

    const response = await DELETE(createDeleteRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to delete system', code: 'DELETE_ERROR' },
    })
  })
})
