import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockGetCurrentUser = vi.fn()
const mockRedirect = vi.fn()

vi.mock('@/lib/auth/queries', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

vi.mock('./_components/LoginForm', () => ({
  default: () => <div data-testid="login-form-mock">LoginForm</div>,
}))

import LoginPage, { metadata } from './page'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('[P1] should redirect to /admin when user is authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'admin@dxt-ai.com' })

    await expect(LoginPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })

  it('[P1] should render LoginForm when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await LoginPage()

    const { container } = render(result)
    expect(container.querySelector('main')).toBeInTheDocument()
  })

  it('[P2] should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Login | zyncdata',
      description: 'Sign in to the zyncdata CMS',
    })
  })
})
