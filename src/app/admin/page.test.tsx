import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import AdminPage, { metadata } from './page'

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

describe('AdminPage', () => {
  it('should render admin panel heading', () => {
    render(<AdminPage />)

    expect(screen.getByRole('heading', { name: 'Admin Panel' })).toBeInTheDocument()
  })

  it('should render LogoutButton', () => {
    render(<AdminPage />)

    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('should render placeholder text', () => {
    render(<AdminPage />)

    expect(screen.getByText('Admin features coming in Epic 3+')).toBeInTheDocument()
  })

  it('should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Admin | zyncdata',
    })
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<AdminPage />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
