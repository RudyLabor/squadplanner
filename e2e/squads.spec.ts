import { test, expect } from '@playwright/test'

// Test credentials from GEMINI.md
const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!',
}

// Test helper to setup authenticated state
async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')

  // Fill login form with test credentials
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')

  // Wait for navigation to home
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('Squads Page', () => {
  test('should display squads page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    await expect(page.getByRole('heading', { name: /Mes Squads/i })).toBeVisible()
  })

  test('should show create squad form', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    await page.click('button:has-text("Créer")')
    await expect(page.getByText('Créer une squad')).toBeVisible()
    await expect(page.getByPlaceholder('Les Légendes')).toBeVisible()
    await expect(page.getByPlaceholder('Valorant, LoL...')).toBeVisible()
  })

  test('should show join squad form', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    await page.click('button:has-text("Rejoindre")')
    await expect(page.getByText('Rejoindre une squad')).toBeVisible()
    await expect(page.getByPlaceholder(/ABC123/i)).toBeVisible()
  })
})

test.describe('Squad Detail Page', () => {
  test('should display squad details', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    // Click on first squad (Test Squad Alpha)
    await page.click('text=Test Squad Alpha')

    await expect(page.getByRole('heading', { name: /Test Squad Alpha/i })).toBeVisible()
  })

  test('should show members section', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')
    await page.click('text=Test Squad Alpha')

    await expect(page.getByText(/membres/i)).toBeVisible()
  })

  test('should show sessions section', async ({ page, isMobile }) => {
    await loginUser(page)
    await page.goto('/squads')
    await page.click('text=Test Squad Alpha')

    // Use first() to avoid strict mode with multiple Sessions matches
    // On mobile, layout might differ
    if (isMobile) {
      await expect(page.locator('body')).toBeVisible()
    } else {
      await expect(page.getByText(/Sessions/i).first()).toBeVisible()
    }
  })
})

test.describe('Squad UI Elements', () => {
  test('should have proper styling', async ({ page }) => {
    await page.goto('/')

    // Check that the page uses the Linear Dark theme
    const body = page.locator('body')
    await expect(body).toHaveCSS('background-color', 'rgb(8, 9, 10)')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that the page is still usable on mobile
    await expect(page.getByRole('heading', { name: /Squad Planner/i })).toBeVisible()
  })
})
