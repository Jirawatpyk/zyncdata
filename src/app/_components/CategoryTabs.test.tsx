import { describe, it, expect } from 'vitest'
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
    // Other panels should be hidden (content not rendered)
    expect(screen.queryByTestId('solutions-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-content')).not.toBeInTheDocument()
  })

  it('should switch content when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    await user.click(screen.getByRole('tab', { name: /DxT Solutions/ }))

    expect(screen.getByTestId('solutions-content')).toBeVisible()
    // Previous tab content no longer in DOM
    expect(screen.queryByTestId('platform-content')).not.toBeInTheDocument()
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

  // Keyboard navigation tests (M3 fix)
  it('should set tabindex=0 on active tab and tabindex=-1 on inactive tabs', () => {
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    const solutionsTab = screen.getByRole('tab', { name: /DxT Solutions/ })
    const gameTab = screen.getByRole('tab', { name: /DxT Game/ })

    expect(platformTab).toHaveAttribute('tabindex', '0')
    expect(solutionsTab).toHaveAttribute('tabindex', '-1')
    expect(gameTab).toHaveAttribute('tabindex', '-1')
  })

  it('should navigate to next tab on ArrowRight', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    platformTab.focus()

    await user.keyboard('{ArrowRight}')

    const solutionsTab = screen.getByRole('tab', { name: /DxT Solutions/ })
    expect(solutionsTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(solutionsTab)
  })

  it('should navigate to previous tab on ArrowLeft', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    // First click Solutions to make it active
    await user.click(screen.getByRole('tab', { name: /DxT Solutions/ }))

    const solutionsTab = screen.getByRole('tab', { name: /DxT Solutions/ })
    solutionsTab.focus()

    await user.keyboard('{ArrowLeft}')

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    expect(platformTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(platformTab)
  })

  it('should wrap around from last to first tab on ArrowRight', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    // Click last tab
    await user.click(screen.getByRole('tab', { name: /DxT Game/ }))

    const gameTab = screen.getByRole('tab', { name: /DxT Game/ })
    gameTab.focus()

    await user.keyboard('{ArrowRight}')

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    expect(platformTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(platformTab)
  })

  it('should navigate to first tab on Home key', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    // Click last tab
    await user.click(screen.getByRole('tab', { name: /DxT Game/ }))

    const gameTab = screen.getByRole('tab', { name: /DxT Game/ })
    gameTab.focus()

    await user.keyboard('{Home}')

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    expect(platformTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(platformTab)
  })

  it('should navigate to last tab on End key', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    const platformTab = screen.getByRole('tab', { name: /DxT Smart Platform/ })
    platformTab.focus()

    await user.keyboard('{End}')

    const gameTab = screen.getByRole('tab', { name: /DxT Game/ })
    expect(gameTab).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(gameTab)
  })

  // Fade-in transition test (M1 fix)
  it('should render active tab content with fade-in animation wrapper', async () => {
    const user = userEvent.setup()
    render(<CategoryTabs tabs={mockTabs}>{mockChildren}</CategoryTabs>)

    // Default tab should have animation wrapper
    const platformContent = screen.getByTestId('platform-content')
    expect(platformContent.parentElement).toHaveClass('animate-tab-fade-in')

    // Switch tab — new content should also have animation wrapper
    await user.click(screen.getByRole('tab', { name: /DxT Solutions/ }))

    const solutionsContent = screen.getByTestId('solutions-content')
    expect(solutionsContent.parentElement).toHaveClass('animate-tab-fade-in')
  })
})
