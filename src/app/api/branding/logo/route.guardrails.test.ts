/**
 * Branding Logo API Route Guardrail Tests (POST/DELETE /api/branding/logo)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { createMockAuth, createMockLandingPageContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result) => result instanceof NextResponse),
}))

vi.mock('@/lib/content/branding-mutations', () => ({
  uploadBrandingAsset: vi.fn(),
  deleteBrandingAsset: vi.fn(),
}))

vi.mock('@/lib/content/mutations', () => ({
  updateSectionContent: vi.fn(),
}))

vi.mock('@/lib/content/queries', () => ({
  getLandingPageContent: vi.fn(),
}))

import { POST, DELETE } from './route'
import { requireApiAuth } from '@/lib/auth/guard'
import { uploadBrandingAsset, deleteBrandingAsset } from '@/lib/content/branding-mutations'
import { updateSectionContent } from '@/lib/content/mutations'
import { getLandingPageContent } from '@/lib/content/queries'

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
    formData: () => Promise.resolve(mockFormData),
  } as unknown as Request
}

describe('POST /api/branding/logo Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLandingPageContent).mockResolvedValue(createMockLandingPageContent())
  })

  describe('P0: Auth Guard', () => {
    it('[P0] MUST call requireApiAuth with "admin"', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(uploadBrandingAsset).mockResolvedValue('https://example.com/branding/logo/new.png')

      await POST(createUploadRequest())

      expect(requireApiAuth).toHaveBeenCalledWith('admin')
    })

    it('[P0] Unauthenticated request MUST return 401', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(
        NextResponse.json(
          { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
          { status: 401 },
        ),
      )

      const response = await POST(createUploadRequest())

      expect(response.status).toBe(401)
      expect(uploadBrandingAsset).not.toHaveBeenCalled()
    })
  })

  describe('P1: Validation', () => {
    it('[P1] No file provided MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const response = await POST(createUploadRequest({ noFile: true }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] File too large (>512KB) MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const response = await POST(createUploadRequest({ size: 600 * 1024 }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('[P1] Invalid MIME type MUST return 400', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

      const response = await POST(createUploadRequest({ type: 'text/plain' }))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('P1: Success', () => {
    it('[P1] Valid upload MUST return new URL', async () => {
      vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
      vi.mocked(uploadBrandingAsset).mockResolvedValue('https://example.com/branding/logo/new.png')

      const response = await POST(createUploadRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data.logoUrl).toBe('https://example.com/branding/logo/new.png')
      expect(updateSectionContent).toHaveBeenCalled()
    })
  })
})

describe('DELETE /api/branding/logo Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLandingPageContent).mockResolvedValue(
      createMockLandingPageContent({
        theme: { colorScheme: 'dxt-default', font: 'nunito', logoUrl: 'https://example.com/logo.png', faviconUrl: null },
      }),
    )
  })

  it('[P0] MUST call requireApiAuth with "admin"', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

    await DELETE()

    expect(requireApiAuth).toHaveBeenCalledWith('admin')
  })

  it('[P1] MUST delete asset and clear URL', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())

    const response = await DELETE()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.logoUrl).toBeNull()
    expect(deleteBrandingAsset).toHaveBeenCalled()
    expect(updateSectionContent).toHaveBeenCalled()
  })
})
