import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'jest-axe'
import UnauthorizedPage, { metadata } from './page'

describe('UnauthorizedPage', () => {
  it('should render Access Denied heading', () => {
    render(<UnauthorizedPage />)

    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
  })

  it('should render permission message', () => {
    render(<UnauthorizedPage />)

    expect(
      screen.getByText("You don't have permission to access this page."),
    ).toBeInTheDocument()
  })

  it('should render link to admin', () => {
    render(<UnauthorizedPage />)

    const adminLink = screen.getByTestId('go-to-admin-link')
    expect(adminLink).toBeInTheDocument()
    expect(adminLink).toHaveAttribute('href', '/admin')
    expect(adminLink).toHaveTextContent('Go to Admin')
  })

  it('should render link to login page', () => {
    render(<UnauthorizedPage />)

    const loginLink = screen.getByTestId('go-to-login-link')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
    expect(loginLink).toHaveTextContent('Go to Login')
  })

  it('should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Unauthorized | zyncdata',
    })
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<UnauthorizedPage />)

    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
