import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage, { metadata } from './page'

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

describe('DashboardPage', () => {
  it('[P2] should render Dashboard heading', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('[P2] should render placeholder text', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Dashboard coming in Epic 3+')).toBeInTheDocument()
  })

  it('[P2] should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Dashboard | zyncdata',
      description: 'zyncdata health monitoring dashboard',
    })
  })

  it('[P2] should render logout button', () => {
    render(<DashboardPage />)

    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('[P2] should render logout form', () => {
    const { container } = render(<DashboardPage />)

    expect(container.querySelector('form')).toBeInTheDocument()
  })
})
