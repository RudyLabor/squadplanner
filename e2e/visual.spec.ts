import { test, expect } from '@playwright/test'

/**
 * Visual regression tests
 * Captures screenshots of major pages in both dark and light mode
 */

const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!'
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

// Pages that don't require authentication
const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

// Pages that require authentication
const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Messages', path: '/messages' },
  { name: 'Profile', path: '/profile' },
  { name: 'Settings', path: '/settings' },
  { name: 'Party', path: '/party' },
]

test.describe('Visual Regression - Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page - dark mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test(`${name} page - light mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  }
})

test.describe('Visual Regression - Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page - dark mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await loginUser(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Wait a bit for any animations to settle
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test(`${name} page - light mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await loginUser(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  }
})
