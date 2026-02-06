import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { POST, DELETE } from './route'
import { createMockSystem, createMockAuth } from '@/lib/test-utils/mock-factories'
import type { System } from '@/lib/validations/system'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()
const mockUploadSystemLogo = vi.fn()
const mockDeleteSystemLogo = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

vi.mock('@/lib/systems/mutations', () => ({
  uploadSystemLogo: (...args: unknown[]) => mockUploadSystemLogo(...args),
  deleteSystemLogo: (...args: unknown[]) => mockDeleteSystemLogo(...args),
}))

const TEST_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function createParams(
  id = TEST_UUID,
): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

/**
 * Create a mock FormData with a file-like object that works in JSDOM.
 * JSDOM's FormData/Blob doesn't always support arrayBuffer(), so we mock the get() method.
 */
function createFileRequest(opts: {
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

  // Create a mock file object that supports all needed APIs
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

function createBadFormDataRequest(): Request {
  return {
    formData: () => Promise.reject(new Error('not form data')),
  } as unknown as Request
}

describe('POST /api/systems/[id]/logo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return auth error when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const response = await POST(createFileRequest(), createParams())

    expect(response).toBe(authErrorResponse)
    expect(mockUploadSystemLogo).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid form data', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await POST(createBadFormDataRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'Invalid form data', code: 'VALIDATION_ERROR' },
    })
  })

  it('should return 400 when no file provided', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await POST(createFileRequest({ noFile: true }), createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      data: null,
      error: { message: 'No file provided', code: 'VALIDATION_ERROR' },
    })
  })

  it('should return 400 for invalid file type', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await POST(
      createFileRequest({ name: 'doc.pdf', type: 'application/pdf' }),
      createParams(),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.message).toBe('File must be JPEG, PNG, SVG, or WebP')
  })

  it('should return 400 for file exceeding size limit', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await POST(
      createFileRequest({ size: 512 * 1024 + 1 }),
      createParams(),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.message).toBe('File must be less than 512KB')
  })

  it('should return 400 for invalid UUID in params', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await POST(createFileRequest(), createParams('bad-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.message).toBe('Invalid system ID')
  })

  it('should upload logo and return 200 on success', async () => {
    const updatedSystem = createMockSystem({
      logoUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
    })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUploadSystemLogo.mockResolvedValue(updatedSystem)

    const response = await POST(createFileRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: updatedSystem, error: null })
    expect(mockUploadSystemLogo).toHaveBeenCalledWith(
      TEST_UUID,
      expect.any(Uint8Array),
      'logo.png',
      'image/png',
    )
  })

  it('should return 404 when system not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUploadSystemLogo.mockRejectedValue(new Error('System not found'))

    const response = await POST(createFileRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      data: null,
      error: { message: 'System not found', code: 'NOT_FOUND' },
    })
  })

  it('should return 500 for generic errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUploadSystemLogo.mockRejectedValue(new Error('Database connection failed'))

    const response = await POST(createFileRequest(), createParams())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to upload logo', code: 'UPLOAD_ERROR' },
    })
  })
})

describe('DELETE /api/systems/[id]/logo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return auth error when not authenticated', async () => {
    const authErrorResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authErrorResponse)
    mockIsAuthError.mockReturnValue(true)

    const request = new Request(`http://localhost/api/systems/${TEST_UUID}/logo`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, createParams())

    expect(response).toBe(authErrorResponse)
    expect(mockDeleteSystemLogo).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid UUID', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const request = new Request('http://localhost/api/systems/not-a-uuid/logo', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createParams('not-a-uuid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(mockDeleteSystemLogo).not.toHaveBeenCalled()
  })

  it('should delete logo and return 200 on success', async () => {
    const updatedSystem = createMockSystem({ logoUrl: null })

    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockDeleteSystemLogo.mockResolvedValue(updatedSystem)

    const request = new Request(`http://localhost/api/systems/${TEST_UUID}/logo`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: updatedSystem, error: null })
    expect(mockDeleteSystemLogo).toHaveBeenCalledWith(TEST_UUID)
  })

  it('should return 404 when system not found', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockDeleteSystemLogo.mockRejectedValue(new Error('System not found'))

    const request = new Request(`http://localhost/api/systems/${TEST_UUID}/logo`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      data: null,
      error: { message: 'System not found', code: 'NOT_FOUND' },
    })
  })

  it('should return 500 for generic errors', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockDeleteSystemLogo.mockRejectedValue(new Error('Storage error'))

    const request = new Request(`http://localhost/api/systems/${TEST_UUID}/logo`, {
      method: 'DELETE',
    })
    const response = await DELETE(request, createParams())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      data: null,
      error: { message: 'Failed to delete logo', code: 'DELETE_ERROR' },
    })
  })
})
