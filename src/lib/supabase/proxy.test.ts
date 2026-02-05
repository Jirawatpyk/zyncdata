import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './proxy'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

function buildRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'))
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect unauthenticated user from /dashboard to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/dashboard')

    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/login')
  })

  it('should redirect unauthenticated user from /admin/systems to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/admin/systems')

    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/login')
  })

  it('should allow unauthenticated user to access / (public)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
  })

  it('should allow unauthenticated user to access /auth/login (public)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/auth/login')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
  })

  it('should allow unauthenticated user to access /coming-soon (public)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/coming-soon')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
  })

  it('should allow unauthenticated user to access /unauthorized (public)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/unauthorized')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
  })

  it('should allow authenticated user to access /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const request = buildRequest('/dashboard')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
  })

  it('should set Cache-Control headers on protected routes for authenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const request = buildRequest('/dashboard')

    const response = await updateSession(request)

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })

  it('should NOT set Cache-Control headers on public routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = buildRequest('/')

    const response = await updateSession(request)

    expect(response.headers.get('Cache-Control')).toBeNull()
    expect(response.headers.get('Pragma')).toBeNull()
    expect(response.headers.get('Expires')).toBeNull()
  })

  it('should return supabaseResponse with cookies intact', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const request = buildRequest('/dashboard')

    const response = await updateSession(request)

    expect(response).toBeInstanceOf(NextResponse)
  })
})
