import { test, expect, dismissCookieBanner, loginViaUI } from './fixtures'

/**
 * STRICT MODE — Visual Regression Tests
 *
 * Captures screenshots of all major pages across 3 viewports (desktop, mobile, tablet)
 * in both dark and light modes. No fallbacks — if a page does not render, the test FAILS.
 *
 * Rules enforced:
 * - Import from ./fixtures (test, expect)
 * - No .catch(() => false)
 * - No early returns without assertions
 * - No fallback selectors
 * - // STRICT: before every critical assertion
 */

// Mask animated/dynamic elements to prevent flaky screenshots
const ANIMATION_MASK_SELECTORS = [
  '[data-animated]',
  '.animate-pulse',
  '.animate-spin',
  '.animate-bounce',
  'video',
  'lottie-player',
]

/** Collect mask locators for animated elements */
function getAnimationMasks(page: import('@playwright/test').Page) {
  return ANIMATION_MASK_SELECTORS.map((sel) => page.locator(sel))
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

// ============================================================
// Desktop Visual Regression (1280x720) — dark/light
// ============================================================

test.describe('Visual Regression - Desktop Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page - dark mode @desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: page must have visible content before screenshot
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // STRICT: visual screenshot comparison — no fallback
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-desktop-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: page must have visible content before screenshot
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // STRICT: visual screenshot comparison — no fallback
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-desktop-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})

test.describe('Visual Regression - Desktop Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page - dark mode @desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page (login succeeded)
      expect(page.url()).not.toContain('/auth')

      // STRICT: page must have visible content
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // STRICT: visual screenshot comparison — no fallback
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-desktop-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.emulateMedia({ colorScheme: 'light' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page (login succeeded)
      expect(page.url()).not.toContain('/auth')

      // STRICT: page must have visible content
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // STRICT: visual screenshot comparison — no fallback
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-desktop-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})

// ============================================================
// Mobile (375x812) Visual Regression — dark/light
// ============================================================

test.describe('Visual Regression - Mobile (375px) Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page - dark mode @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: body must be visible
      await expect(page.locator('body')).toBeVisible()

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-mobile-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: body must be visible
      await expect(page.locator('body')).toBeVisible()

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-mobile-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})

test.describe('Visual Regression - Mobile (375px) Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page - dark mode @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page
      expect(page.url()).not.toContain('/auth')

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-mobile-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.emulateMedia({ colorScheme: 'light' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page
      expect(page.url()).not.toContain('/auth')

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-mobile-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})

// ============================================================
// Tablet (768x1024) Visual Regression — dark/light
// ============================================================

test.describe('Visual Regression - Tablet (768px) Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page - dark mode @tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: body must be visible
      await expect(page.locator('body')).toBeVisible()

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-tablet-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: body must be visible
      await expect(page.locator('body')).toBeVisible()

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-tablet-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})

test.describe('Visual Regression - Tablet (768px) Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page - dark mode @tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.emulateMedia({ colorScheme: 'dark' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page
      expect(page.url()).not.toContain('/auth')

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-tablet-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })

    test(`${name} page - light mode @tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.emulateMedia({ colorScheme: 'light' })
      await loginViaUI(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // STRICT: must not be on auth page
      expect(page.url()).not.toContain('/auth')

      // STRICT: visual screenshot comparison
      await expect(page).toHaveScreenshot(`${name.toLowerCase()}-tablet-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.15,
        mask: getAnimationMasks(page),
      })
    })
  }
})
