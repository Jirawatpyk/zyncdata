import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET } from './route'
import type { AuthResult } from '@/lib/auth/guard'
import type { User } from '@supabase/supabase-js'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockGetSystems = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/queries', () => ({
  getSystems: () => mockGetSystems(),
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
