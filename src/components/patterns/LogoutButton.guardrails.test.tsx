import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useFormStatus } from 'react-dom'
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

describe('LogoutButton — guardrail edge cases', () => {
  it('[P0] should use form action pattern for progressive enhancement', () => {
    // Given LogoutButton is rendered
    const { container } = render(<LogoutButton />)

    // Then it should use a form element (works without JavaScript)
    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()

    // And the submit button should be type="submit" inside the form
    const button = screen.getByTestId('logout-button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(form!.contains(button)).toBe(true)
  })

  it('[P1] should not render nested forms', () => {
    // Given LogoutButton is rendered
    const { container } = render(<LogoutButton />)

    // Then there should be exactly one form element (nested forms are invalid HTML)
    const forms = container.querySelectorAll('form')
    expect(forms).toHaveLength(1)
  })

  it('[P1] should have minimum touch target for mobile accessibility', () => {
    // Given LogoutButton is rendered
    render(<LogoutButton />)

    // Then the button should have min-h-11 class (44px WCAG 2.1 AA touch target)
    const button = screen.getByTestId('logout-button')
    expect(button.className).toContain('min-h-11')
  })

  it('[P2] should render correctly without className prop', () => {
    // Given LogoutButton is rendered without optional className
    render(<LogoutButton />)

    // Then it should render without error and show default content
    const button = screen.getByTestId('logout-button')
    expect(button).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
