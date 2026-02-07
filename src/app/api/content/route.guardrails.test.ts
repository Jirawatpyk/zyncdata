/**
 * Content API Route Guardrail Tests (GET /api/content)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockAuth, createMockHeroContent, createMockPillarsContent, createMockThemeContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'

function setupMockSupabase(rows: Array<{ section_name: string; content: unknown; draft_content: unknown }>) {
  const mockSelect = vi.fn().mockResolvedValue({ data: rows, error: null })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

  return { mockFrom, mockSelect }
}

function setupMockSupabaseError(error: { code: string; message: string }) {
  const mockSelect = vi.fn().mockResolvedValue({ data: null, error })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)
}

function makeContentRows(useDraft = false) {
  const hero = createMockHeroContent()
  const pillars = createMockPillarsContent()
  const footer = { copyright: '2026 zyncdata. All rights reserved.', contact_email: 'contact@example.com', links: [{ label: 'Privacy', url: '/privacy' }] }
  const theme = createMockThemeContent()
  const systems = { heading: 'Our Systems', subtitle: 'Monitoring & management' }

  return [
    { section_name: 'hero', content: hero, draft_content: useDraft ? { ...hero, title: 'Draft Title' } : null },
    { section_name: 'pillars', content: pillars, draft_content: null },
    { section_name: 'systems', content: systems, draft_content: null },
    { section_name: 'footer', content: footer, draft_content: null },
    { section_name: 'theme', content: theme, draft_content: null },
  ]
}

describe('GET /api/content Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] GET MUST call requireApiAuth with "admin" role', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows())

      await GET()

      expect(requireApiAuth).toHaveBeenCalledTimes(1)
      expect(requireApiAuth).toHaveBeenCalledWith('admin')
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

    it('[P0] Unauthenticated request MUST NOT query database', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await GET()

      expect(createClient).not.toHaveBeenCalled()
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

  describe('P0: Draft-Aware Content', () => {
    it('[P0] MUST return draft_content when it exists (over published content)', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows(true))

      const response = await GET()
      const body = await response.json()

      expect(body.data.hero.title).toBe('Draft Title')
    })

    it('[P0] MUST return published content when draft_content is null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows(false))

      const response = await GET()
      const body = await response.json()

      expect(body.data.hero.title).toBe('Test Title')
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Success response MUST have { data, error } format', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows())

      const response = await GET()
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
    })

    it('[P1] Success response MUST have error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows())

      const response = await GET()
      const body = await response.json()

      expect(body.error).toBeNull()
    })

    it('[P1] Success response data MUST contain hero, pillars, systems, footer', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabase(makeContentRows())

      const response = await GET()
      const body = await response.json()

      expect(body.data).toHaveProperty('hero')
      expect(body.data).toHaveProperty('pillars')
      expect(body.data).toHaveProperty('systems')
      expect(body.data).toHaveProperty('footer')
    })

    it('[P1] Error response MUST have { data: null, error } format', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabaseError({ code: 'DB_ERROR', message: 'Database error' })

      const response = await GET()
      const body = await response.json()

      expect(body.data).toBeNull()
      expect(body.error).not.toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })

    it('[P1] Internal error MUST return 500 status', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      setupMockSupabaseError({ code: 'DB_ERROR', message: 'DB error' })

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })
})
