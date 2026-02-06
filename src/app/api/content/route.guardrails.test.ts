/**
 * Content API Route Guardrail Tests (GET /api/content)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockAuth, createMockLandingPageContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/content/queries', () => ({
  getLandingPageContent: vi.fn(),
}))

import { GET } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { getLandingPageContent } from '@/lib/content/queries'

describe('GET /api/content Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] GET MUST call requireApiAuth with "admin" role before getLandingPageContent', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockResolvedValue(createMockLandingPageContent())

      await GET()

      expect(requireApiAuth).toHaveBeenCalledTimes(1)
      expect(requireApiAuth).toHaveBeenCalledWith('admin')

      const authOrder = vi.mocked(requireApiAuth).mock.invocationCallOrder[0]
      const fetchOrder = vi.mocked(getLandingPageContent).mock.invocationCallOrder[0]
      expect(authOrder).toBeLessThan(fetchOrder)
    })

    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('[P0] Unauthenticated request MUST NOT call getLandingPageContent', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await GET()

      expect(getLandingPageContent).not.toHaveBeenCalled()
    })

    it('[P0] Non-admin role MUST return 403 status', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(forbiddenResponse)

      const response = await GET()

      expect(response.status).toBe(403)
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Success response MUST have { data, error } format', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockResolvedValue(createMockLandingPageContent())

      const response = await GET()
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
    })

    it('[P1] Success response MUST have error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockResolvedValue(createMockLandingPageContent())

      const response = await GET()
      const body = await response.json()

      expect(body.error).toBeNull()
    })

    it('[P1] Success response data MUST contain hero, pillars, systems, footer', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockResolvedValue(createMockLandingPageContent())

      const response = await GET()
      const body = await response.json()

      expect(body.data).toHaveProperty('hero')
      expect(body.data).toHaveProperty('pillars')
      expect(body.data).toHaveProperty('systems')
      expect(body.data).toHaveProperty('footer')
    })

    it('[P1] Error response MUST have { data: null, error } format', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const body = await response.json()

      expect(body.data).toBeNull()
      expect(body.error).not.toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })

    it('[P1] Internal error MUST return 500 status', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(getLandingPageContent).mockRejectedValue(new Error('DB error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })
})
