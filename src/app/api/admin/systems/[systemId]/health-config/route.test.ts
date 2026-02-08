import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((val: unknown) => val instanceof NextResponse),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { requireApiAuth } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { GET, PATCH } from './route'

function createParams(systemId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479') {
  return { params: Promise.resolve({ systemId }) }
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/systems/test-id/health-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/admin/systems/[systemId]/health-config', () => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(requireApiAuth).mockResolvedValue({
      user: { id: 'user-1' } as User,
      role: 'admin',
    })

    mockSingle.mockResolvedValue({
      data: { check_interval: 120, timeout_threshold: null, failure_threshold: 5 },
      error: null,
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('should require admin auth', async () => {
    const unauthorizedResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized' } },
      { status: 401 },
    )
    vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

    const response = await GET(new Request('http://localhost'), createParams())

    expect(response.status).toBe(401)
  })

  it('should return health config with camelCase keys', async () => {
    const response = await GET(new Request('http://localhost'), createParams())
    const body = await response.json()

    expect(body.data).toEqual({
      checkInterval: 120,
      timeoutThreshold: null,
      failureThreshold: 5,
    })
    expect(body.error).toBeNull()
  })

  it('should return 404 for non-existent system', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    const response = await GET(new Request('http://localhost'), createParams())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 500 on unexpected DB error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'XXXXX', message: 'DB crash' },
    })

    const response = await GET(new Request('http://localhost'), createParams())

    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/admin/systems/[systemId]/health-config', () => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(requireApiAuth).mockResolvedValue({
      user: { id: 'user-1' } as User,
      role: 'admin',
    })

    mockSingle.mockResolvedValue({
      data: { check_interval: 120, timeout_threshold: 5000, failure_threshold: null },
      error: null,
    })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockEq.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('should require admin auth', async () => {
    const unauthorizedResponse = NextResponse.json(
      { data: null, error: { message: 'Unauthorized' } },
      { status: 401 },
    )
    vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse)

    const response = await PATCH(createRequest({ checkInterval: 120 }), createParams())

    expect(response.status).toBe(401)
  })

  it('should update config and return camelCase response', async () => {
    const response = await PATCH(
      createRequest({ checkInterval: 120, timeoutThreshold: 5000, failureThreshold: null }),
      createParams(),
    )
    const body = await response.json()

    expect(body.data).toEqual({
      checkInterval: 120,
      timeoutThreshold: 5000,
      failureThreshold: null,
    })
    expect(body.error).toBeNull()

    // Verify DB update used snake_case
    expect(mockUpdate).toHaveBeenCalledWith({
      check_interval: 120,
      timeout_threshold: 5000,
      failure_threshold: null,
    })
  })

  it('should return 400 for invalid check_interval below min', async () => {
    const response = await PATCH(
      createRequest({ checkInterval: 10, timeoutThreshold: null, failureThreshold: null }),
      createParams(),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid timeout_threshold above max', async () => {
    const response = await PATCH(
      createRequest({ checkInterval: null, timeoutThreshold: 99999, failureThreshold: null }),
      createParams(),
    )

    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid failure_threshold above max', async () => {
    const response = await PATCH(
      createRequest({ checkInterval: null, timeoutThreshold: null, failureThreshold: 20 }),
      createParams(),
    )

    expect(response.status).toBe(400)
  })

  it('should accept all null values (reset to defaults)', async () => {
    mockSingle.mockResolvedValue({
      data: { check_interval: null, timeout_threshold: null, failure_threshold: null },
      error: null,
    })

    const response = await PATCH(
      createRequest({ checkInterval: null, timeoutThreshold: null, failureThreshold: null }),
      createParams(),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    })
  })

  it('should return 404 for non-existent system', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    const response = await PATCH(
      createRequest({ checkInterval: 60, timeoutThreshold: null, failureThreshold: null }),
      createParams(),
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 500 on unexpected DB error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'XXXXX', message: 'DB crash' },
    })

    const response = await PATCH(
      createRequest({ checkInterval: 60, timeoutThreshold: null, failureThreshold: null }),
      createParams(),
    )

    expect(response.status).toBe(500)
  })

  it('should return 400 for malformed JSON body', async () => {
    const malformedRequest = new Request('http://localhost/api/admin/systems/test-id/health-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{{{',
    })

    const response = await PATCH(malformedRequest, createParams())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('PARSE_ERROR')
    expect(body.error.message).toBe('Invalid request body')
  })
})
