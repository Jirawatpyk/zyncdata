import { test, expect } from '@playwright/test'

test.describe('Landing Page Category Tabs (Story 4-B)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display category tab bar with tab names', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'System categories' })
    await expect(tablist).toBeVisible()

    await expect(page.getByRole('tab', { name: /Smart Platform/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Solutions/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Game/ })).toBeVisible()
  })

  test('should show Smart Platform tab as active by default', async ({ page }) => {
    const platformTab = page.getByRole('tab', { name: /Smart Platform/ })
    await expect(platformTab).toHaveAttribute('aria-selected', 'true')
  })

  test('should switch displayed systems when clicking a different tab', async ({ page }) => {
    // Click Solutions tab
    const solutionsTab = page.getByRole('tab', { name: /Solutions/ })
    await solutionsTab.click()

    await expect(solutionsTab).toHaveAttribute('aria-selected', 'true')

    // Platform tab should no longer be selected
    const platformTab = page.getByRole('tab', { name: /Smart Platform/ })
    await expect(platformTab).toHaveAttribute('aria-selected', 'false')

    // Solutions tabpanel should be visible
    const solutionsPanel = page.locator('#tabpanel-dxt_solutions')
    await expect(solutionsPanel).toBeVisible()

    // System cards should be present in the active panel
    await expect(solutionsPanel.locator('[aria-label^="Visit "]').first()).toBeVisible()
  })

  test('should display system cards within active tab', async ({ page }) => {
    // Default tab is Smart Platform — should have cards
    const platformPanel = page.locator('#tabpanel-dxt_smart_platform')
    const cards = platformPanel.locator('[aria-label^="Visit "]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have pillars section visible', async ({ page }) => {
    // Story 4-A — pillars should be rendered above tabs
    await expect(page.getByText('Our Pillars')).toBeVisible()
  })
})
