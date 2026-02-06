/**
 * Toggle System API Route Guardrail Tests
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
  toggleSystem: vi.fn(),
}))

import { PATCH } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { toggleSystem } from '@/lib/systems/mutations'

const TEST_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function createRequest(body: unknown): Request {
  return new Request(`http://localhost/api/systems/${TEST_UUID}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createParams(
  id = TEST_UUID,
): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/systems/[id]/toggle Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] PATCH MUST call requireApiAuth with "admin" role before toggleSystem', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(toggleSystem).mockResolvedValue({
        id: TEST_UUID,
        name: 'Test',
        url: 'https://example.com',
        logoUrl: null,
        description: null,
        status: null,
        responseTime: null,
        displayOrder: 0,
        enabled: false,
        category: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        deletedAt: null,
        lastCheckedAt: null,
      })

      await PATCH(createRequest({ enabled: false }), createParams())

      expect(requireApiAuth).toHaveBeenCalledTimes(1)
      expect(requireApiAuth).toHaveBeenCalledWith('admin')

      // Verify call order: requireApiAuth before toggleSystem
      const requireApiAuthOrder = vi.mocked(requireApiAuth).mock.invocationCallOrder[0]
      const toggleSystemOrder = vi.mocked(toggleSystem).mock.invocationCallOrder[0]
      expect(requireApiAuthOrder).toBeLessThan(toggleSystemOrder)
    })

    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await PATCH(createRequest({ enabled: false }), createParams())

      expect(response.status).toBe(401)
    })

    it('[P0] Unauthenticated request MUST NOT call toggleSystem', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await PATCH(createRequest({ enabled: false }), createParams())

      expect(toggleSystem).not.toHaveBeenCalled()
    })

    it('[P0] Non-admin role MUST return 403 status', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(forbiddenResponse)

      const response = await PATCH(createRequest({ enabled: true }), createParams())

      expect(response.status).toBe(403)
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Invalid body MUST return 400 with VALIDATION_ERROR code', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await PATCH(createRequest({}), createParams())
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.data).toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Missing enabled field MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await PATCH(createRequest({ name: 'test' }), createParams())
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Success response MUST have { data, error } format with error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(toggleSystem).mockResolvedValue({
        id: TEST_UUID,
        name: 'Test',
        url: 'https://example.com',
        logoUrl: null,
        description: null,
        status: null,
        responseTime: null,
        displayOrder: 0,
        enabled: true,
        category: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        deletedAt: null,
        lastCheckedAt: null,
      })

      const response = await PATCH(createRequest({ enabled: true }), createParams())
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
      expect(body.error).toBeNull()
    })

    it('[P1] Server error MUST return 500 with { data: null, error: { code, message } }', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(toggleSystem).mockRejectedValue(new Error('Database error'))

      const response = await PATCH(createRequest({ enabled: false }), createParams())
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.data).toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })
  })
})
