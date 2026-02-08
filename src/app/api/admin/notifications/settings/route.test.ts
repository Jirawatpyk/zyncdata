import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET, PATCH } from './route'
import { createMockAuth } from '@/lib/test-utils/mock-factories'

const mockRequireApiAuth = vi.fn()
const mockIsAuthError = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: () => mockRequireApiAuth(),
  isAuthError: (result: unknown) => mockIsAuthError(result),
}))

const mockGetSettings = vi.fn()
const mockUpdateSettings = vi.fn()

vi.mock('@/lib/health/notification-queries', () => ({
  getNotificationSettings: () => mockGetSettings(),
  updateNotificationSettings: (data: unknown) => mockUpdateSettings(data),
}))

const mockSettings = {
  id: 'settings-1',
  notificationEmails: ['admin@test.com'],
  notifyOnFailure: true,
  notifyOnRecovery: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('GET /api/admin/notifications/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const authError = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authError)
    mockIsAuthError.mockReturnValue(true)

    const response = await GET()
    expect(response).toBe(authError)
  })

  it('returns notification settings when authenticated', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockGetSettings.mockResolvedValue(mockSettings)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual(mockSettings)
    expect(body.error).toBeNull()
  })

  it('returns 500 when query fails', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockGetSettings.mockRejectedValue(new Error('DB error'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.data).toBeNull()
    expect(body.error.code).toBe('FETCH_ERROR')
  })
})

describe('PATCH /api/admin/notifications/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createRequest(body: unknown): Request {
    return new Request('http://localhost/api/admin/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('returns 401 when not authenticated', async () => {
    const authError = NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    mockRequireApiAuth.mockResolvedValue(authError)
    mockIsAuthError.mockReturnValue(true)

    const response = await PATCH(createRequest({}))
    expect(response).toBe(authError)
  })

  it('validates and updates settings', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const updateData = {
      notificationEmails: ['new@test.com'],
      notifyOnFailure: false,
      notifyOnRecovery: true,
    }
    const updatedSettings = { ...mockSettings, ...updateData }
    mockUpdateSettings.mockResolvedValue(updatedSettings)

    const response = await PATCH(createRequest(updateData))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.notificationEmails).toEqual(['new@test.com'])
    expect(body.data.notifyOnFailure).toBe(false)
    expect(mockUpdateSettings).toHaveBeenCalledWith(updateData)
  })

  it('returns 400 for invalid email', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(createRequest({
      notificationEmails: ['not-an-email'],
      notifyOnFailure: true,
      notifyOnRecovery: true,
    }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for missing fields', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)

    const response = await PATCH(createRequest({
      notificationEmails: ['admin@test.com'],
      // missing notifyOnFailure and notifyOnRecovery
    }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 500 when update fails', async () => {
    mockRequireApiAuth.mockResolvedValue(createMockAuth())
    mockIsAuthError.mockReturnValue(false)
    mockUpdateSettings.mockRejectedValue(new Error('DB error'))

    const response = await PATCH(createRequest({
      notificationEmails: ['admin@test.com'],
      notifyOnFailure: true,
      notifyOnRecovery: true,
    }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('UPDATE_ERROR')
  })
})
