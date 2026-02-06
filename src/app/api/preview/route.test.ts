import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockAuth, createMockLandingPageContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/auth/guard', () => ({
  requireApiAuth: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof Response),
}))

vi.mock('@/lib/systems/queries', () => ({
  getEnabledSystemsByCategory: vi.fn().mockResolvedValue({
    dxt_smart_platform: [
      {
        id: '1',
        name: 'Test System',
        url: 'https://example.com',
        logoUrl: null,
        description: 'A test system',
        status: 'healthy',
        lastCheckedAt: '2026-01-01T00:00:00Z',
        category: 'dxt_smart_platform',
      },
    ],
  }),
}))

const { requireApiAuth, isAuthError } = await import('@/lib/auth/guard')

describe('POST /api/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    const unauthorizedResponse = Response.json(
      { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
    vi.mocked(requireApiAuth).mockResolvedValue(unauthorizedResponse as never)
    vi.mocked(isAuthError).mockReturnValue(true)

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createMockLandingPageContent()),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 when body is invalid', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeTruthy()
    expect(body.data).toBeNull()
  })

  it('should return HTML string on valid request', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const mockContent = createMockLandingPageContent()
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockContent),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.error).toBeNull()
    expect(body.data).toContain('<!DOCTYPE html>')
    expect(body.data).toContain('PREVIEW - Not Published')
  })

  it('should include hero content in HTML', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const mockContent = createMockLandingPageContent({
      hero: { title: 'Custom Title', subtitle: 'Custom Subtitle', description: 'Custom Desc' },
    })
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockContent),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.data).toContain('Custom Title')
    expect(body.data).toContain('Custom Subtitle')
    expect(body.data).toContain('Custom Desc')
  })

  it('should apply theme CSS variables in HTML', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const mockContent = createMockLandingPageContent({
      theme: { colorScheme: 'ocean-blue', font: 'inter', logoUrl: null, faviconUrl: null },
    })
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockContent),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.data).toContain('--dxt-primary')
    expect(body.data).toContain('#0077b6') // ocean-blue primary
  })

  it('should include footer content in HTML', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const mockContent = createMockLandingPageContent({
      footer: { copyright: '2026 Test Corp', contactEmail: 'test@corp.com', links: [] },
    })
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockContent),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.data).toContain('2026 Test Corp')
    expect(body.data).toContain('test@corp.com')
  })

  it('should wrap response in { data, error } format', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createMockLandingPageContent()),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('error')
  })

  it('should return 400 when body is not valid JSON', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{{{',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.message).toBe('Invalid JSON body')
    expect(body.data).toBeNull()
  })

  it('should escape HTML in content to prevent XSS', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(createMockAuth())
    vi.mocked(isAuthError).mockReturnValue(false)

    const { POST } = await import('./route')
    const xssPayload = createMockLandingPageContent({
      hero: {
        title: '<script>alert("xss")</script>',
        subtitle: '"><img src=x onerror=alert(1)>',
        description: "Normal description with 'quotes'",
      },
    })
    const request = new Request('http://localhost/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xssPayload),
    })

    const response = await POST(request)
    const body = await response.json()
    expect(body.data).not.toContain('<script>')
    expect(body.data).toContain('&lt;script&gt;')
    expect(body.data).not.toContain('<img')
    expect(body.data).toContain('&lt;img')
    expect(body.data).toContain('&#039;quotes&#039;')
  })
})
