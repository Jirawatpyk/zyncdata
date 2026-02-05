/**
 * Reorder Systems API Route Guardrail Tests
 *
 * These tests verify INVARIANTS that must never change.
 * Breaking these tests indicates a contract violation that will break consumers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

// Mock dependencies before imports
vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/systems/mutations', () => ({
  reorderSystems: vi.fn(),
}))

import { PATCH } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { reorderSystems } from '@/lib/systems/mutations'

const UUID_1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const UUID_2 = 'a47ac10b-58cc-4372-a567-0e02b2c3d480'

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/systems/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/systems/reorder Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] PATCH MUST call requireApiAuth with "admin" role before reorderSystems', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(reorderSystems).mockResolvedValue([])

      await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )

      expect(requireApiAuth).toHaveBeenCalledTimes(1)
      expect(requireApiAuth).toHaveBeenCalledWith('admin')

      // Verify call order: requireApiAuth before reorderSystems
      const requireApiAuthOrder = vi.mocked(requireApiAuth).mock.invocationCallOrder[0]
      const reorderSystemsOrder = vi.mocked(reorderSystems).mock.invocationCallOrder[0]
      expect(requireApiAuthOrder).toBeLessThan(reorderSystemsOrder)
    })

    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )

      expect(response.status).toBe(401)
    })

    it('[P0] Unauthenticated request MUST NOT call reorderSystems', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )

      expect(reorderSystems).not.toHaveBeenCalled()
    })

    it('[P0] Non-admin role MUST return 403 status', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(forbiddenResponse)

      const response = await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )

      expect(response.status).toBe(403)
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Success response MUST have { data, error } format with error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(reorderSystems).mockResolvedValue([])

      const response = await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
      expect(body.error).toBeNull()
    })

    it('[P1] Validation error MUST return 400 with { data: null, error: { code, message } }', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await PATCH(createRequest({ systems: [] }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.data).toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Server error MUST return 500 with { data: null, error: { code, message } }', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(reorderSystems).mockRejectedValue(new Error('Database error'))

      const response = await PATCH(
        createRequest({
          systems: [
            { id: UUID_1, displayOrder: 1 },
            { id: UUID_2, displayOrder: 0 },
          ],
        }),
      )
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.data).toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })
  })
})
