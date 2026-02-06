import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET, POST } from './route'
import type { AuthResult } from '@/lib/auth/guard'
import type { User } from '@supabase/supabase-js'
import type { System } from '@/lib/validations/system'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockGetSystems = vi.fn()
const mockCreateSystem = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/queries', () => ({
  getSystems: () => mockGetSystems(),
}))

vi.mock('@/lib/systems/mutations', () => ({
  createSystem: (input: unknown) => mockCreateSystem(input),
}))

function createMockAuth(): AuthResult {
  return {
    user: { id: 'user-123', email: 'admin@example.com' } as User,
    role: 'admin',
  }
}

describe('GET /api/systems', () => {
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
    expect(mockGetSystems).not.toHaveBeenCalled()
  })

  it('should return systems when authenticated as admin', async () => {
    const mockSystems = [
      { id: 'sys-1', name: 'System 1', enabled: true },
      { id: 'sys-2', name: 'System 2', enabled: false },
    ]
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockGetSystems.mockResolvedValue(mockSystems)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: mockSystems, error: null })
  })

  it('should return 500 when getSystems throws', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockGetSystems.mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to fetch systems', code: 'FETCH_ERROR' },
    })
  })

  it('should return empty array when no systems exist', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockGetSystems.mockResolvedValue([])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: [], error: null })
  })
})

function createMockSystem(overrides?: Partial<System>): System {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Test System',
    url: 'https://example.com',
    logoUrl: null,
    description: null,
    status: null,
    responseTime: null,
    displayOrder: 0,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
    lastCheckedAt: null,
    ...overrides,
  }
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/systems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/systems', () => {
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

    const request = createRequest({ name: 'Test', url: 'https://test.com' })
    const response = await POST(request)

    expect(response).toBe(authErrorResponse)
    expect(mockCreateSystem).not.toHaveBeenCalled()
  })

  it('should create system and return 201 on success', async () => {
    const createdSystem = createMockSystem({
      name: 'New System',
      url: 'https://new.example.com',
      displayOrder: 5,
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockCreateSystem.mockResolvedValue(createdSystem)

    const request = createRequest({
      name: 'New System',
      url: 'https://new.example.com',
      enabled: true,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({ data: createdSystem, error: null })
    expect(mockCreateSystem).toHaveBeenCalledWith({
      name: 'New System',
      url: 'https://new.example.com',
      enabled: true,
    })
  })

  it('should return 400 for invalid URL (AC #3)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: 'Test System',
      url: 'not-a-url',
      enabled: true,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Valid URL required', code: 'VALIDATION_ERROR' },
    })
    expect(mockCreateSystem).not.toHaveBeenCalled()
  })

  it('should return 400 for empty name (AC #4)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = createRequest({
      name: '',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Name required', code: 'VALIDATION_ERROR' },
    })
    expect(mockCreateSystem).not.toHaveBeenCalled()
  })

  it('should return 409 for duplicate name', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockCreateSystem.mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    )

    const request = createRequest({
      name: 'Existing System',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await POST(request)
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

  it('should return 500 for generic errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockCreateSystem.mockRejectedValue(new Error('Database connection failed'))

    const request = createRequest({
      name: 'Test System',
      url: 'https://example.com',
      enabled: true,
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to create system', code: 'CREATE_ERROR' },
    })
  })

  it('should accept optional description', async () => {
    const createdSystem = createMockSystem({
      description: 'A test description',
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockCreateSystem.mockResolvedValue(createdSystem)

    const request = createRequest({
      name: 'Test System',
      url: 'https://example.com',
      description: 'A test description',
      enabled: true,
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockCreateSystem).toHaveBeenCalledWith({
      name: 'Test System',
      url: 'https://example.com',
      description: 'A test description',
      enabled: true,
    })
  })

  it('should default enabled to true', async () => {
    const createdSystem = createMockSystem({ enabled: true })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockCreateSystem.mockResolvedValue(createdSystem)

    const request = createRequest({
      name: 'Test System',
      url: 'https://example.com',
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockCreateSystem).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    )
  })

  // ===============================================
  // GUARDRAIL TESTS - Additional Error Cases
  // ===============================================

  describe('validation edge cases', () => {
    it('should return 400 for name over 100 characters', async () => {
      mockRequireApiAuth.mockResolvedValue(createMockAuth())
      mockIsAuthError.mockReturnValue(false)

      const request = createRequest({
        name: 'A'.repeat(101),
        url: 'https://example.com',
        enabled: true,
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(mockCreateSystem).not.toHaveBeenCalled()
    })

    it('should return 400 for description over 500 characters', async () => {
      mockRequireApiAuth.mockResolvedValue(createMockAuth())
      mockIsAuthError.mockReturnValue(false)

      const request = createRequest({
        name: 'Test System',
        url: 'https://example.com',
        description: 'A'.repeat(501),
        enabled: true,
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(mockCreateSystem).not.toHaveBeenCalled()
    })

    it('should accept empty description string', async () => {
      const createdSystem = createMockSystem({ description: '' })

      mockRequireApiAuth.mockResolvedValue(createMockAuth())
      mockIsAuthError.mockReturnValue(false)
      mockCreateSystem.mockResolvedValue(createdSystem)

      const request = createRequest({
        name: 'Test System',
        url: 'https://example.com',
        description: '',
        enabled: true,
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should strip unknown fields from request body', async () => {
      const createdSystem = createMockSystem()

      mockRequireApiAuth.mockResolvedValue(createMockAuth())
      mockIsAuthError.mockReturnValue(false)
      mockCreateSystem.mockResolvedValue(createdSystem)

      const request = createRequest({
        name: 'Test System',
        url: 'https://example.com',
        enabled: true,
        unknownField: 'should be stripped',
        anotherUnknown: 123,
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      // Verify createSystem was called without unknown fields
      expect(mockCreateSystem).toHaveBeenCalledWith({
        name: 'Test System',
        url: 'https://example.com',
        enabled: true,
      })
    })
  })

  describe('authorization edge cases', () => {
    it('should return 403 for non-admin roles', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      mockRequireApiAuth.mockResolvedValue(forbiddenResponse)
      mockIsAuthError.mockReturnValue(true)

      const request = createRequest({
        name: 'Test',
        url: 'https://test.com',
        enabled: true,
      })
      const response = await POST(request)

      expect(response).toBe(forbiddenResponse)
      expect(mockCreateSystem).not.toHaveBeenCalled()
    })
  })
})
