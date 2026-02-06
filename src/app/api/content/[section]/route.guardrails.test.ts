/**
 * Content Section API Route Guardrail Tests (PATCH /api/content/[section])
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockAuth, createMockHeroContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/content/mutations', () => ({
  updateSectionContent: vi.fn(),
}))

import { PATCH } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { updateSectionContent } from '@/lib/content/mutations'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/content/hero', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeParams(section: string): { params: Promise<{ section: string }> } {
  return { params: Promise.resolve({ section }) }
}

describe('PATCH /api/content/[section] Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Auth Guard', () => {
    it('[P0] MUST call requireApiAuth with "admin" before updating', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'hero', content: {}, metadata: null,
        updated_by: 'user-123', created_at: '', updated_at: '',
      })

      await PATCH(makeRequest(createMockHeroContent()), makeParams('hero'))

      expect(requireApiAuth).toHaveBeenCalledWith('admin')
    })

    it('[P0] Unauthenticated request MUST return 401', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(
        NextResponse.json(
          { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
          { status: 401 },
        ),
      )

      const response = await PATCH(makeRequest({}), makeParams('hero'))

      expect(response.status).toBe(401)
      expect(updateSectionContent).not.toHaveBeenCalled()
    })
  })

  describe('P0: Section Validation', () => {
    it('[P0] Invalid section name MUST return 404', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const response = await PATCH(makeRequest({}), makeParams('systems'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('[P0] Garbage section name MUST return 404', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const response = await PATCH(makeRequest({}), makeParams('nonexistent'))

      expect(response.status).toBe(404)
    })

    it('[P0] Valid section names MUST be accepted: hero, pillars, footer', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'hero', content: {}, metadata: null,
        updated_by: 'user-123', created_at: '', updated_at: '',
      })

      for (const section of ['hero', 'pillars', 'footer']) {
        vi.clearAllMocks()
        vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
        vi.mocked(updateSectionContent).mockResolvedValue({
          id: '1', section_name: section, content: {}, metadata: null,
          updated_by: 'user-123', created_at: '', updated_at: '',
        })

        const body = section === 'hero'
          ? createMockHeroContent()
          : section === 'pillars'
            ? { heading: 'Test', items: [{ title: 'A', description: 'B', url: null }] }
            : { copyright: 'Test', links: [] }

        const response = await PATCH(makeRequest(body), makeParams(section))
        expect(response.status).not.toBe(404)
      }
    })
  })

  describe('P1: Validation', () => {
    it('[P1] Invalid body MUST return 400 with VALIDATION_ERROR', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      // Hero requires title, subtitle, description
      const response = await PATCH(makeRequest({ invalid: true }), makeParams('hero'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Non-JSON body MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const request = new Request('http://localhost/api/content/hero', {
        method: 'PATCH',
        body: 'not json',
      })

      const response = await PATCH(request, makeParams('hero'))

      expect(response.status).toBe(400)
    })
  })

  describe('P1: XSS Sanitization', () => {
    it('[P1] Script tags MUST be stripped from hero title', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'hero', content: {}, metadata: null,
        updated_by: 'user-123', created_at: '', updated_at: '',
      })

      await PATCH(
        makeRequest({
          title: '<script>alert("xss")</script>Hello',
          subtitle: 'Clean',
          description: '<p>Safe</p>',
        }),
        makeParams('hero'),
      )

      expect(updateSectionContent).toHaveBeenCalledTimes(1)
      const [, content] = vi.mocked(updateSectionContent).mock.calls[0]
      expect(content.title).toBe('Hello')
      expect(content.title).not.toContain('<script>')
    })

    it('[P1] HTML tags MUST be stripped from plain text fields', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'hero', content: {}, metadata: null,
        updated_by: 'user-123', created_at: '', updated_at: '',
      })

      await PATCH(
        makeRequest({
          title: '<b>Bold</b> title',
          subtitle: '<em>Italic</em> sub',
          description: '<p><strong>Safe</strong></p>',
        }),
        makeParams('hero'),
      )

      const [, content] = vi.mocked(updateSectionContent).mock.calls[0]
      expect(content.title).toBe('Bold title')
      expect(content.subtitle).toBe('Italic sub')
      // Description is rich text — safe tags preserved
      expect(content.description).toContain('<strong>')
    })
  })

  describe('P1: Footer Reverse Transform', () => {
    it('[P1] contactEmail MUST be stored as contact_email in DB', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'footer', content: {}, metadata: null,
        updated_by: 'user-123', created_at: '', updated_at: '',
      })

      await PATCH(
        makeRequest({
          copyright: '2026 Test',
          contactEmail: 'test@example.com',
          links: [],
        }),
        makeParams('footer'),
      )

      const [, content] = vi.mocked(updateSectionContent).mock.calls[0]
      expect(content).toHaveProperty('contact_email', 'test@example.com')
      expect(content).not.toHaveProperty('contactEmail')
    })
  })

  describe('P1: Response Format', () => {
    it('[P1] Success response MUST have { data, error: null } format', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockResolvedValue({
        id: '1', section_name: 'hero',
        content: createMockHeroContent() as unknown as Record<string, unknown>,
        metadata: null, updated_by: 'user-123', created_at: '', updated_at: '',
      })

      const response = await PATCH(makeRequest(createMockHeroContent()), makeParams('hero'))
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body.error).toBeNull()
    })

    it('[P1] Internal error MUST return 500', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(updateSectionContent).mockRejectedValue(new Error('DB error'))

      const response = await PATCH(makeRequest(createMockHeroContent()), makeParams('hero'))

      expect(response.status).toBe(500)
    })
  })
})
