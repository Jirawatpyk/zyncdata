import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET } from './route'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    }),
  ),
}))

const redirectSpy = vi.spyOn(NextResponse, 'redirect')

beforeEach(() => {
  vi.clearAllMocks()
})

function buildRequest(url: string): Request {
  return new Request(url)
}

describe('Auth Callback Route - GET', () => {
  describe('successful code exchange', () => {
    it('[P0] should redirect to /admin on successful exchange with no next param', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest('https://example.com/auth/callback?code=valid-code')
      const response = await GET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code')
      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin')
      expect(response.status).toBe(307)
    })

    it('[P1] should redirect to valid relative next param on successful exchange', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=/settings',
      )
      const response = await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/settings')
      expect(response.status).toBe(307)
    })
  })

  describe('open redirect prevention (P0)', () => {
    it('[P0] should reject //evil.com paths and fall back to /admin', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=//evil.com',
      )
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin')
    })

    it('[P0] should reject absolute URLs and fall back to /admin', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=https://evil.com',
      )
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin')
    })

    it('[P0] should reject protocol-relative URLs like //evil.com/path', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=//evil.com/path',
      )
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin')
    })
  })

  describe('missing or invalid code', () => {
    it('[P1] should redirect to login with error when code param is missing', async () => {
      const request = buildRequest('https://example.com/auth/callback')
      await GET(request)

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
      expect(redirectSpy).toHaveBeenCalledWith(
        'https://example.com/auth/login?error=auth_callback_failed',
      )
    })

    it('[P1] should redirect to login with error when code exchange fails', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: new Error('Invalid code'),
      })

      const request = buildRequest('https://example.com/auth/callback?code=bad-code')
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith(
        'https://example.com/auth/login?error=auth_callback_failed',
      )
    })
  })

  describe('next param edge cases', () => {
    it('[P2] should accept deep relative paths like /admin/users', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=/admin/users',
      )
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin/users')
    })

    it('[P2] should reject empty-string next param and use /admin', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = buildRequest(
        'https://example.com/auth/callback?code=valid-code&next=',
      )
      await GET(request)

      expect(redirectSpy).toHaveBeenCalledWith('https://example.com/admin')
    })
  })
})
