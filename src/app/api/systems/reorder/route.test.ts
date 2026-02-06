import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from './route'
import { createMockSystem, createMockAuth } from '@/lib/test-utils/mock-factories'
import type { System } from '@/lib/validations/system'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockReorderSystems = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/mutations', () => ({
  reorderSystems: (systems: unknown) => mockReorderSystems(systems),
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/systems/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const UUID_1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const UUID_2 = 'a47ac10b-58cc-4372-a567-0e02b2c3d480'

describe('PATCH /api/systems/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =======================
  // Malformed JSON Test
  // =======================

  it('should return 400 for malformed JSON body', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = new Request('http://localhost/api/systems/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {',
    })
    const response = await PATCH(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('Invalid JSON body')
    expect(json.data).toBeNull()
  })

  // =======================
  // Authentication Tests
  // =======================

  it('should return auth error when not authenticated (AC: auth)', async () => {
    const authResponse = new Response(
      JSON.stringify({ data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await PATCH(createRequest({ systems: [] }))

    expect(response.status).toBe(401)
    expect(mockReorderSystems).not.toHaveBeenCalled()
  })

  it('should return auth error for non-admin role', async () => {
    const authResponse = new Response(
      JSON.stringify({ data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } }),
      { status: 403 },
    )
    mockRequireApiAuth.mockResolvedValue(authResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await PATCH(createRequest({ systems: [] }))

    expect(response.status).toBe(403)
    expect(mockReorderSystems).not.toHaveBeenCalled()
  })

  // =======================
  // Validation Tests (AC #1)
  // =======================

  it('should return 400 for empty systems array', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(createRequest({ systems: [] }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('At least 2 systems required for reorder')
  })

  it('should return 400 for single system (min 2)', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(
      createRequest({
        systems: [{ id: UUID_1, displayOrder: 0 }],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid UUID in systems', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(
      createRequest({
        systems: [
          { id: 'not-a-uuid', displayOrder: 0 },
          { id: UUID_2, displayOrder: 1 },
        ],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('Invalid system ID')
  })

  it('should return 400 for negative displayOrder', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(
      createRequest({
        systems: [
          { id: UUID_1, displayOrder: -1 },
          { id: UUID_2, displayOrder: 0 },
        ],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('Display order must be non-negative')
  })

  it('should return 400 for duplicate system IDs', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(
      createRequest({
        systems: [
          { id: UUID_1, displayOrder: 0 },
          { id: UUID_1, displayOrder: 1 },
        ],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('Duplicate system IDs are not allowed')
  })

  it('should return 400 for missing systems field', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(createRequest({}))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  // =======================
  // Success Tests (AC #1, #2)
  // =======================

  it('should return 200 with reordered system list on success', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const reorderedList = [
      createMockSystem({ id: UUID_2, name: 'System B', displayOrder: 0 }),
      createMockSystem({ id: UUID_1, name: 'System A', displayOrder: 1 }),
    ]
    mockReorderSystems.mockResolvedValue(reorderedList)

    const response = await PATCH(
      createRequest({
        systems: [
          { id: UUID_1, displayOrder: 1 },
          { id: UUID_2, displayOrder: 0 },
        ],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].displayOrder).toBe(0)
    expect(json.data[1].displayOrder).toBe(1)
    expect(json.error).toBeNull()
  })

  it('should call reorderSystems with validated payload', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockReorderSystems.mockResolvedValue([])

    await PATCH(
      createRequest({
        systems: [
          { id: UUID_1, displayOrder: 1 },
          { id: UUID_2, displayOrder: 0 },
        ],
      }),
    )

    expect(mockReorderSystems).toHaveBeenCalledWith([
      { id: UUID_1, displayOrder: 1 },
      { id: UUID_2, displayOrder: 0 },
    ])
  })

  // =======================
  // Server Error Tests (AC #5)
  // =======================

  it('should return 500 when reorderSystems throws', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockReorderSystems.mockRejectedValue(new Error('Database failure'))

    const response = await PATCH(
      createRequest({
        systems: [
          { id: UUID_1, displayOrder: 1 },
          { id: UUID_2, displayOrder: 0 },
        ],
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error.code).toBe('UPDATE_ERROR')
    expect(json.error.message).toBe('Failed to reorder systems')
    expect(json.data).toBeNull()
  })
})
