import { test, expect } from '@playwright/test'

test.describe('Landing Page Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for system cards to render
    await page.waitForSelector('[aria-label^="Visit "], [aria-label*="Coming Soon"]', {
      timeout: 10000,
    })
  })

  test('should display status badges on system cards (AC #1)', async ({ page }) => {
    // At least one card should have a status badge
    const badges = page.locator('[aria-label^="System status:"]')
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display gray "Status unknown" badge for null status (AC #4)', async ({
    page,
  }) => {
    // Seeded systems with NULL status show "Status unknown"
    const unknownBadges = page.locator('[aria-label="System status: Status unknown"]')
    const count = await unknownBadges.count()
    // TINEDY and ENEOS have null status in seed data
    expect(count).toBeGreaterThanOrEqual(1)
    await expect(unknownBadges.first()).toBeVisible()
  })

  test('should display "Coming Soon" badge for coming_soon systems (AC #5)', async ({
    page,
  }) => {
    // VOCA, rws, BINANCE are coming_soon in seed data
    const comingSoonBadges = page.locator('[aria-label="System status: Coming Soon"]')
    const count = await comingSoonBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
    await expect(comingSoonBadges.first()).toBeVisible()
  })

  test('should display "Never checked" timestamp for null last_checked_at (AC #1, #5)', async ({
    page,
  }) => {
    // All seeded systems have null last_checked_at
    const neverChecked = page.getByText('Never checked')
    const count = await neverChecked.count()
    // Only non-coming_soon systems show timestamp (coming_soon hides it)
    expect(count).toBeGreaterThanOrEqual(1)
    await expect(neverChecked.first()).toBeVisible()
  })

  test('should NOT display timestamp for coming_soon systems', async ({ page }) => {
    // Find a coming_soon card and verify no timestamp
    const comingSoonCard = page.locator('[aria-label*="Coming Soon"]').first()
    await expect(comingSoonCard).toBeVisible()

    // The card should NOT contain "Never checked" or "Last checked"
    const cardText = await comingSoonCard.textContent()
    expect(cardText).not.toContain('Never checked')
    expect(cardText).not.toContain('Last checked')
  })
})
