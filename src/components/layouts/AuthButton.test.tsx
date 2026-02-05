import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuthButton from './AuthButton'

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthButton', () => {
  it('should show skeleton while loading', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})) // never resolves
    render(<AuthButton />)

    expect(screen.getByTestId('auth-button-skeleton')).toBeInTheDocument()
  })

  it('should show Login link when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByTestId('header-login-link')).toBeInTheDocument()
    })
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByTestId('header-login-link')).toHaveAttribute('href', '/auth/login')
  })

  it('should show Dashboard link when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'admin@dxt-ai.com' } },
    })
    render(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByTestId('header-dashboard-link')).toBeInTheDocument()
    })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('header-dashboard-link')).toHaveAttribute('href', '/admin')
  })

  it('should show Login when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Session expired'),
    })
    render(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByTestId('header-login-link')).toBeInTheDocument()
    })
  })

  it('should show Login when getUser rejects', async () => {
    mockGetUser.mockRejectedValue(new Error('Network failure'))
    render(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByTestId('header-login-link')).toBeInTheDocument()
    })
  })
})
