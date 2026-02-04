import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MfaVerifyPage, { metadata } from './page'

describe('MfaVerifyPage', () => {
  it('[P2] should render MFA Verification heading', () => {
    render(<MfaVerifyPage />)

    expect(screen.getByRole('heading', { name: 'MFA Verification' })).toBeInTheDocument()
  })

  it('[P2] should render story placeholder text', () => {
    render(<MfaVerifyPage />)

    expect(screen.getByText('MFA Verification coming in Story 2.4')).toBeInTheDocument()
  })

  it('[P2] should render Back to Login link pointing to /auth/login', () => {
    render(<MfaVerifyPage />)

    const link = screen.getByRole('link', { name: 'Back to Login' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/auth/login')
  })

  it('[P2] should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'MFA Verification | zyncdata',
      description: 'Verify your identity with multi-factor authentication',
    })
  })
})
