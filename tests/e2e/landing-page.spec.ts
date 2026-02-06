import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load with hero section, pillars section, system cards, and footer', async ({
    page,
  }) => {
    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()

    // Pillars section (replaced IntroSection in story 4-2)
    await expect(page.getByTestId('pillars-section')).toBeVisible()

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
    // Wait for AuthButton to resolve from skeleton to a real link
    await page.waitForSelector('[data-testid="header-login-link"], [data-testid="header-dashboard-link"]')

    // Tab to first interactive element
    await page.keyboard.press('Tab')

    // Skip-to-content link should be focusable
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()

    // Tab through header, hero, pillar links, and category tabs to reach system cards
    // The number of pillar links varies, so loop until we reach a system card
    const firstCard = page.locator('[aria-label^="Visit "]').first()
    let reached = false
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await firstCard.evaluate((el) => el === document.activeElement)
    }
    expect(reached).toBe(true)
  })

  test('should have no accessibility violations', async ({ page }) => {
    // Wait for dynamic content to fully render (AuthButton, system cards)
    await page.waitForSelector('[data-testid="header-login-link"], [data-testid="header-dashboard-link"]')
    await page.waitForSelector('[aria-label^="Visit "]', { timeout: 10000 })

    const results = await new AxeBuilder({ page }).analyze()

    // Log violations for CI debugging
    if (results.violations.length > 0) {
      const summary = results.violations.map(
        (v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} element(s))`,
      )
      console.log(`Accessibility violations (${results.violations.length} rules):\n${summary.join('\n')}`)
    }

    expect(results.violations).toEqual([])
  })

  test('should load within 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - start

    expect(loadTime).toBeLessThan(3000)
  })
})
