/**
 * Logo API Route Guardrail Tests
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
  uploadSystemLogo: vi.fn(),
  deleteSystemLogo: vi.fn(),
}))

import { POST, DELETE } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { uploadSystemLogo, deleteSystemLogo } from '@/lib/systems/mutations'

const TEST_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function createParams(
  id = TEST_UUID,
): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

function createUploadRequest(opts: {
  name?: string
  type?: string
  size?: number
  noFile?: boolean
} = {}): Request {
  const {
    name = 'logo.png',
    type = 'image/png',
    size = 1024,
    noFile = false,
  } = opts

  const content = new Uint8Array(size)

  const mockFile = {
    name,
    type,
    size,
    arrayBuffer: () => Promise.resolve(content.buffer),
  }

  const mockFormData = {
    get: (key: string) => {
      if (key === 'file' && !noFile) return mockFile
      return null
    },
  }

  return {
    formData: () => Promise.resolve(mockFormData as unknown as FormData),
  } as unknown as Request
}

function createDeleteRequest(): Request {
  return new Request(`http://localhost/api/systems/${TEST_UUID}/logo`, {
    method: 'DELETE',
  })
}

const MOCK_SYSTEM = {
  id: TEST_UUID,
  name: 'Test',
  url: 'https://example.com',
  logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
  description: null,
  status: null,
  responseTime: null,
  displayOrder: 0,
  enabled: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
  lastCheckedAt: null,
}

describe('POST /api/systems/[id]/logo Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await POST(createUploadRequest(), createParams())

      expect(response.status).toBe(401)
    })

    it('[P0] Non-admin role MUST return 403 status', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(forbiddenResponse)

      const response = await POST(createUploadRequest(), createParams())

      expect(response.status).toBe(403)
    })

    it('[P0] Unauthenticated request MUST NOT call uploadSystemLogo', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await POST(createUploadRequest(), createParams())

      expect(uploadSystemLogo).not.toHaveBeenCalled()
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Missing file MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await POST(createUploadRequest({ noFile: true }), createParams())
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Invalid MIME type MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await POST(
        createUploadRequest({ name: 'doc.pdf', type: 'application/pdf' }),
        createParams(),
      )
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] File too large MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await POST(
        createUploadRequest({ size: 512 * 1024 + 1 }),
        createParams(),
      )
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Success response MUST have { data, error } format with error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(uploadSystemLogo).mockResolvedValue(MOCK_SYSTEM)

      const response = await POST(createUploadRequest(), createParams())
      const body = await response.json()

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('error')
      expect(body.error).toBeNull()
    })
  })
})

describe('DELETE /api/systems/[id]/logo Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] Unauthenticated request MUST return 401 status', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      const response = await DELETE(createDeleteRequest(), createParams())

      expect(response.status).toBe(401)
    })

    it('[P0] Non-admin role MUST return 403 status', async () => {
      const forbiddenResponse = NextResponse.json(
        { data: null, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(forbiddenResponse)

      const response = await DELETE(createDeleteRequest(), createParams())

      expect(response.status).toBe(403)
    })

    it('[P0] Unauthenticated request MUST NOT call deleteSystemLogo', async () => {
      const unauthorizedResponse = NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
      vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

      await DELETE(createDeleteRequest(), createParams())

      expect(deleteSystemLogo).not.toHaveBeenCalled()
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Invalid UUID MUST return 400 with VALIDATION_ERROR', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })

      const response = await DELETE(createDeleteRequest(), createParams('not-a-uuid'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(deleteSystemLogo).not.toHaveBeenCalled()
    })

    it('[P1] Success response MUST have { data, error } format with error: null', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue({
        user: { id: 'user-1' } as User,
        role: 'admin',
      })
      vi.mocked(deleteSystemLogo).mockResolvedValue({ ...MOCK_SYSTEM, logoUrl: null })

      const response = await DELETE(createDeleteRequest(), createParams())
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
      vi.mocked(deleteSystemLogo).mockRejectedValue(new Error('Storage error'))

      const response = await DELETE(createDeleteRequest(), createParams())
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.data).toBeNull()
      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
    })
  })
})
