/**
 * Publish API Route Tests (POST + GET /api/content/publish)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/content/publish', () => ({
  publishAllContent: vi.fn(),
  getPublishStatus: vi.fn(),
}))

import { POST, GET } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { publishAllContent, getPublishStatus } from '@/lib/content/publish'

describe('POST /api/content/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[P0] MUST call requireApiAuth with "admin" before publishing', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(publishAllContent).mockResolvedValue({ publishedAt: '2026-02-07T00:00:00Z' })

    await POST()

    expect(requireApiAuth).toHaveBeenCalledWith('admin')

    const authOrder = vi.mocked(requireApiAuth).mock.invocationCallOrder[0]
    const publishOrder = vi.mocked(publishAllContent).mock.invocationCallOrder[0]
    expect(authOrder).toBeLessThan(publishOrder)
  })

  it('[P0] Unauthenticated request MUST return 401', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(
      NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      ),
    )

    const response = await POST()

    expect(response.status).toBe(401)
    expect(publishAllContent).not.toHaveBeenCalled()
  })

  it('[P0] Non-admin role MUST return 403', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(
      NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      ),
    )

    const response = await POST()

    expect(response.status).toBe(403)
    expect(publishAllContent).not.toHaveBeenCalled()
  })

  it('should call publishAllContent with user id and return publishedAt', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(publishAllContent).mockResolvedValue({ publishedAt: '2026-02-07T10:00:00Z' })

    const response = await POST()
    const body = await response.json()

    expect(publishAllContent).toHaveBeenCalledWith('user-123')
    expect(body.data.publishedAt).toBe('2026-02-07T10:00:00Z')
    expect(body.error).toBeNull()
  })

  it('should succeed when no drafts exist (idempotent)', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(publishAllContent).mockResolvedValue({ publishedAt: '2026-02-07T10:00:00Z' })

    const response = await POST()

    expect(response.status).toBe(200)
  })

  it('should return 500 on publish failure', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(publishAllContent).mockRejectedValue(new Error('DB failure'))

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('PUBLISH_ERROR')
  })

  it('[P1] Success response MUST have { data, error: null } format', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(publishAllContent).mockResolvedValue({ publishedAt: '2026-02-07T10:00:00Z' })

    const response = await POST()
    const body = await response.json()

    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('error')
    expect(body.error).toBeNull()
  })
})

describe('GET /api/content/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[P0] MUST call requireApiAuth with "admin"', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(getPublishStatus).mockResolvedValue({ hasDrafts: false, draftSections: [] })

    await GET()

    expect(requireApiAuth).toHaveBeenCalledWith('admin')
  })

  it('[P0] Unauthenticated request MUST return 401', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(
      NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      ),
    )

    const response = await GET()

    expect(response.status).toBe(401)
    expect(getPublishStatus).not.toHaveBeenCalled()
  })

  it('should return hasDrafts: true when draft_content exists', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(getPublishStatus).mockResolvedValue({ hasDrafts: true, draftSections: ['hero', 'footer'] })

    const response = await GET()
    const body = await response.json()

    expect(body.data.hasDrafts).toBe(true)
    expect(body.data.draftSections).toEqual(['hero', 'footer'])
  })

  it('should return hasDrafts: false when no drafts', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(getPublishStatus).mockResolvedValue({ hasDrafts: false, draftSections: [] })

    const response = await GET()
    const body = await response.json()

    expect(body.data.hasDrafts).toBe(false)
    expect(body.data.draftSections).toEqual([])
  })

  it('should return 500 on error', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(getPublishStatus).mockRejectedValue(new Error('DB failure'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('FETCH_ERROR')
  })
})
