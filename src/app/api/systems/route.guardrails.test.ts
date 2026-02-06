/**
 * Systems API Route Guardrail Tests
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

vi.mock('@/lib/systems/queries', () => ({
  getSystems: vi.fn(),
}))

import { GET } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { getSystems } from '@/lib/systems/queries'

describe('GET /api/systems Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] GET MUST call requireApiAuth with "admin" role before getSystems', async () => {
      // Setup: Auth succeeds
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(getSystems).mockResolvedValue([])

      await GET()

      // Verify requireApiAuth was called with 'admin'
      expect(requireApiAuth).toHaveBeenCalledTimes(1)
      expect(requireApiAuth).toHaveBeenCalledWith('admin')

      // Verify call order: requireApiAuth before getSystems
      const requireApiAuthOrder = vi.mocked(requireApiAuth).mock.invocationCallOrder[0]
      const getSystemsOrder = vi.mocked(getSystems).mock.invocationCallOrder[0]
      expect(requireApiAuthOrder).toBeLessThan(getSystemsOrder)
    })

    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      // Setup: Auth fails with 401
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('[P0] Unauthenticated request MUST NOT call getSystems', async () => {
      // Setup: Auth fails
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await GET()

      expect(getSystems).not.toHaveBeenCalled()
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Success response MUST have { data, error } format', async () => {
      // Setup: Auth succeeds
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(getSystems).mockResolvedValue([
        {
          id: 'sys-1',
          name: 'Test',
          url: 'https://test.com',
          logoUrl: null,
          description: null,
          status: 'operational',
          responseTime: 100,
          displayOrder: 0,
          enabled: true,
          category: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          deletedAt: null,
          lastCheckedAt: null,
          consecutiveFailures: 0,
        },
      ])

      const response = await GET()
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
    })

    it('[P1] Success response MUST have error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(getSystems).mockResolvedValue([])

      const response = await GET()
      const body = await response.json()

      expect(body.error).toBeNull()
    })

    it('[P1] Error response MUST have { data, error } format', async () => {
      // Setup: Auth succeeds but getSystems throws
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(getSystems).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
      expect(body.data).toBeNull()
      expect(body.error).not.toBeNull()
    })

    it('[P1] Error response MUST have error.code and error.message', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(getSystems).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const body = await response.json()

      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })
  })
})
