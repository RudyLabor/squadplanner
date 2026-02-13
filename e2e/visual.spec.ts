import { test, expect } from '@playwright/test'

/**
 * Visual regression tests
 * Captures screenshots of major pages in both dark and light mode
 * Run with --update-snapshots on first run to generate baselines
 */

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

async function dismissCookieBanner(page: import('@playwright/test').Page) {
  try {
    const acceptBtn = page.getByRole('button', { name: /Tout accepter/i })
    await acceptBtn.waitFor({ state: 'visible', timeout: 3000 })
    await acceptBtn.click()
    await page.waitForTimeout(500)
  } catch {
    // Cookie banner not present, continue
  }
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 })
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

      // Use generous diff threshold for CI stability
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
      })
    })

    test(`${name} page - light mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
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
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
      })
    })

    test(`${name} page - light mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await loginUser(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
      })
    })
  }
})
