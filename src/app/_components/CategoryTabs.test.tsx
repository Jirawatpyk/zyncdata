import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTabs from './CategoryTabs'

const mockTabs = [
  { key: 'dxt_smart_platform', label: 'DxT Smart Platform' },
  { key: 'dxt_solutions', label: 'DxT Solutions' },
  { key: 'dxt_game', label: 'DxT Game' },
]

const mockChildren: Record<string, React.ReactNode> = {
  dxt_smart_platform: <div data-testid="platform-content">Platform systems</div>,
  dxt_solutions: <div data-testid="solutions-content">Solutions systems</div>,
  dxt_game: <div data-testid="game-content">Game systems</div>,
}

describe('CategoryTabs', () => {
  it('should render all tab triggers', () => {
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    expect(screen.getByRole('tab', { name: /DxT Smart Platform/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /DxT Solutions/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /DxT Game/ })).toBeInTheDocument()
  })

  it('should show first tab content by default', () => {
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    expect(screen.getByTestId('platform-content')).toBeVisible()
    // Other panels should be hidden
    expect(screen.getByTestId('solutions-content').closest('[role="tabpanel"]')).toHaveAttribute('hidden')
    expect(screen.getByTestId('game-content').closest('[role="tabpanel"]')).toHaveAttribute('hidden')
  })

  it('should switch content when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    await user.click(screen.getByRole('tab', { name: /DxT Solutions/ }))

    expect(screen.getByTestId('solutions-content')).toBeVisible()
    expect(screen.getByTestId('platform-content').closest('[role="tabpanel"]')).toHaveAttribute('hidden')
  })

  it('should mark active tab with aria-selected', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    const solutionsTab = screen.getByRole('tab', { name: /DxT Solutions/ })

    expect(platformTab).toHaveAttribute('aria-selected', 'true')
    expect(solutionsTab).toHaveAttribute('aria-selected', 'false')

    await user.click(solutionsTab)

    expect(platformTab).toHaveAttribute('aria-selected', 'false')
    expect(solutionsTab).toHaveAttribute('aria-selected', 'true')
  })

  it('should render nothing when tabs array is empty', () => {
    const { container } = render(<CategoryTabs tabs={[]}>{{}}</CategoryTabs>)
    expect(container.firstChild).toBeNull()
  })

  it('should render Other tab when provided', () => {
    const tabsWithOther = [
      ...mockTabs,
      { key: 'other', label: 'Other' },
    ]
    const childrenWithOther = {
      ...mockChildren,
      other: <div data-testid="other-content">Other systems</div>,
    }

    render(<CategoryTabs tabs={tabsWithOther}>{childrenWithOther}</CategoryTabs>)

    expect(screen.getByRole('tab', { name: /Other/ })).toBeInTheDocument()
  })

  it('should have correct ARIA attributes for tabpanels', () => {
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    const platformPanel = screen.getByRole('tabpanel')
    expect(platformPanel).toHaveAttribute('id', 'tabpanel-dxt_smart_platform')
    expect(platformPanel).toHaveAttribute('aria-labelledby', 'tab-dxt_smart_platform')
  })
})
