import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage, { metadata } from './page'

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
})
