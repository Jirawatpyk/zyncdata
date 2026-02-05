import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('should render link to dashboard', () => {
    render(<UnauthorizedPage />)

    const dashboardLink = screen.getByTestId('go-to-dashboard-link')
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(dashboardLink).toHaveTextContent('Go to Dashboard')
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

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
