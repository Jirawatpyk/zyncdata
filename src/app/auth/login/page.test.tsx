import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockGetCurrentUser = vi.fn()
const mockRedirect = vi.fn()

vi.mock('@/lib/auth/queries', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock('./_components/LoginForm', () => ({
  default: () => <div data-testid="login-form-mock">LoginForm</div>,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', { timeout: 15000 }, () => {
  it('[P1] should redirect to /dashboard when user is authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'admin@dxt-ai.com' })

    const { default: LoginPage } = await import('./page')
    await LoginPage()

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('[P1] should render LoginForm when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const { default: LoginPage } = await import('./page')
    const result = await LoginPage()

    const { container } = render(result)
    expect(container.querySelector('main')).toBeInTheDocument()
  })

  it('[P2] should export correct metadata', async () => {
    const { metadata } = await import('./page')

    expect(metadata).toEqual({
      title: 'Login | zyncdata',
      description: 'Sign in to the zyncdata CMS',
    })
  })
})
