import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useFormStatus } from 'react-dom'
import { axe } from 'jest-axe'
import LogoutButton from './LogoutButton'

vi.mock('@/lib/actions/logout', () => ({
  logoutAction: vi.fn(),
}))

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom')
  return {
    ...actual,
    useFormStatus: vi.fn(() => ({ pending: false, data: null, method: null, action: null })),
  }
})

beforeEach(() => {
  vi.mocked(useFormStatus).mockReturnValue({
    pending: false,
    data: null,
    method: null,
    action: null,
  })
})

describe('LogoutButton', () => {
  it('should render logout button with correct text', () => {
    render(<LogoutButton />)

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should render LogOut icon', () => {
    render(<LogoutButton />)

    const button = screen.getByTestId('logout-button')
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('should render form with action attribute', () => {
    const { container } = render(<LogoutButton />)

    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()
  })

  it('should have data-testid on the button', () => {
    render(<LogoutButton />)

    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('should have aria-label on the button', () => {
    render(<LogoutButton />)

    expect(screen.getByTestId('logout-button')).toHaveAttribute('aria-label', 'Logout')
  })

  it('should pass className to the button', () => {
    render(<LogoutButton className="ml-auto" />)

    const button = screen.getByTestId('logout-button')
    expect(button.className).toContain('ml-auto')
  })

  it('should show "Logging out..." and disabled state when form is submitting', () => {
    vi.mocked(useFormStatus).mockReturnValue({
      pending: true,
      data: new FormData(),
      method: 'POST',
      action: '',
    })

    render(<LogoutButton />)

    expect(screen.getByText('Logging out...')).toBeInTheDocument()
    const button = screen.getByTestId('logout-button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-label', 'Logging out')
  })

  it('should have no accessibility violations', async () => {
    const { container } = render(<LogoutButton />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
