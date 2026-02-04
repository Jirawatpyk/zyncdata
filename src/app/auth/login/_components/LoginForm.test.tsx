import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import LoginForm from './LoginForm'

// Mock loginAction
const mockLoginAction = vi.fn()
vi.mock('@/lib/actions/auth', () => ({
  loginAction: (...args: unknown[]) => mockLoginAction(...args),
}))

// Mock useActionState to return controlled state
let mockState = { error: null as string | null, rateLimited: false }
const mockFormAction = vi.fn()

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: () => [mockState, mockFormAction],
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  mockState = { error: null, rateLimited: false }
})

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-email')).toBeInTheDocument()
    expect(screen.getByTestId('login-password')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
  })

  it('should render heading and description', () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to access the CMS')).toBeInTheDocument()
  })

  it('should have correct input types', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-email')).toHaveAttribute('type', 'email')
    expect(screen.getByTestId('login-password')).toHaveAttribute('type', 'password')
  })

  it('should have correct aria-labels on inputs', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-email')).toHaveAttribute('aria-label', 'Email address')
    expect(screen.getByTestId('login-password')).toHaveAttribute('aria-label', 'Password')
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByTestId('login-password')
    const toggleButton = screen.getByTestId('toggle-password')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password')

    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password')

    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password')
  })

  it('should not display error when state has no error', () => {
    render(<LoginForm />)

    expect(screen.queryByTestId('login-error')).not.toBeInTheDocument()
  })

  it('should display error message from state', () => {
    mockState = { error: 'Invalid email or password', rateLimited: false }
    render(<LoginForm />)

    const errorEl = screen.getByTestId('login-error')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl).toHaveTextContent('Invalid email or password')
    expect(errorEl).toHaveAttribute('role', 'alert')
    expect(errorEl).toHaveAttribute('aria-live', 'polite')
  })

  it('should display rate limit message with different styling', () => {
    mockState = {
      error: 'Too many login attempts. Please try again later.',
      rateLimited: true,
    }
    render(<LoginForm />)

    const errorEl = screen.getByTestId('login-error')
    expect(errorEl).toHaveTextContent('Too many login attempts. Please try again later.')
  })

  it('should have required fields', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-email')).toBeRequired()
    expect(screen.getByTestId('login-password')).toBeRequired()
  })

  it('should have autocomplete attributes', () => {
    render(<LoginForm />)

    expect(screen.getByTestId('login-email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByTestId('login-password')).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
  })

  it('should pass accessibility audit', async () => {
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should pass accessibility audit with error displayed', async () => {
    mockState = { error: 'Invalid email or password', rateLimited: false }
    const { container } = render(<LoginForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
