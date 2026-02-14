import { test, expect } from '@playwright/test'
import { supabaseAdmin, TestDataHelper, dismissCookieBanner } from './fixtures'

/**
 * Visual regression tests — with DB validation for protected pages
 * Captures screenshots of major pages in both dark and light mode
 * Protected page tests verify DB data is loaded before screenshot.
 * Run with --update-snapshots on first run to generate baselines
 */

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

// DB helper for validation queries
const db = new TestDataHelper(supabaseAdmin)

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000, waitUntil: 'domcontentloaded' })
      return
    } catch {
      const rateLimited = await page.locator('text=/rate limit/i').isVisible().catch(() => false)
      if (rateLimited && attempt < 2) {
        await page.waitForTimeout(3000 + attempt * 2000)
        await page.click('button[type="submit"]')
      } else {
        throw new Error(`Login failed after ${attempt + 1} attempts`)
      }
    }
  }
}

// Pages that don't require authentication
const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

// Pages that require authentication — with DB validation method
const protectedPages = [
  { name: 'Home', path: '/home', dbCheck: async () => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()
  }},
  { name: 'Squads', path: '/squads', dbCheck: async () => {
    const squads = await db.getUserSquads()
    expect(Array.isArray(squads)).toBe(true)
  }},
  { name: 'Messages', path: '/messages', dbCheck: async () => {
    const squads = await db.getUserSquads()
    expect(Array.isArray(squads)).toBe(true)
  }},
  { name: 'Profile', path: '/profile', dbCheck: async () => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
  }},
  { name: 'Settings', path: '/settings', dbCheck: async () => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
  }},
  { name: 'Party', path: '/party', dbCheck: async () => {
    const squads = await db.getUserSquads()
    expect(Array.isArray(squads)).toBe(true)
  }},
]

test.describe('Visual Regression - Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page - dark mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

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
  for (const { name, path, dbCheck } of protectedPages) {
    test(`${name} page - dark mode`, async ({ page }) => {
      // DB validation: verify data exists before screenshot
      await dbCheck()

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
      // DB validation: verify data exists before screenshot
      await dbCheck()

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
