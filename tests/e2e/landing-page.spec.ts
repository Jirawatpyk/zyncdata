import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load with hero section, intro section, system cards, and footer', async ({
    page,
  }) => {
    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()

    // Intro section
    await expect(page.getByTestId('intro-section')).toBeVisible()

    // System cards
    await expect(page.locator('[aria-label^="Visit "]').first()).toBeVisible()

    // Footer
    await expect(page.locator('footer')).toBeVisible()
  })

  test('should display system cards with correct hrefs', async ({ page }) => {
    const cards = page.locator('[aria-label^="Visit "]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href')
      expect(href).toBeTruthy()
      expect(href).toMatch(/^https?:\/\//)
    }
  })

  test('should have responsive grid layout', async ({ page }) => {
    // Desktop: 3 columns
    await page.setViewportSize({ width: 1280, height: 720 })
    const grid = page.locator('.grid.grid-cols-1')
    await expect(grid.first()).toBeVisible()

    // Mobile: 1 column
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(grid.first()).toBeVisible()
  })

  test('should support keyboard navigation through cards', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab')

    // Skip-to-content link should be focusable
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()

    // Continue tabbing to reach cards
    // Tab through header links first
    await page.keyboard.press('Tab') // DxT AI Platform link
    await page.keyboard.press('Tab') // Login link

    // Tab to first system card
    await page.keyboard.press('Tab')
    const firstCard = page.locator('[aria-label^="Visit "]').first()
    await expect(firstCard).toBeFocused()
  })

  test('should have no accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('should load within 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - start

    expect(loadTime).toBeLessThan(3000)
  })
})
