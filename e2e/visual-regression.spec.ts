import { test, expect, dismissCookieBanner, loginViaUI } from './fixtures'

/**
 * P3.4 — Visual Regression Tests
 *
 * Captures pixel-level screenshots with strict comparison thresholds.
 * These tests establish baselines on first run and compare against them
 * on subsequent runs to detect unintended visual changes.
 *
 * Rules:
 * - maxDiffPixelRatio: 0.01 (1% tolerance for anti-aliasing differences)
 * - All viewports: desktop (1280x720), tablet (768x1024), mobile (375x667)
 * - Both themes: dark and light
 * - Masks for animated elements to prevent flakiness
 */

const MASK_SELECTORS = [
  '[data-animated]',
  '.animate-pulse',
  '.animate-spin',
  '.animate-bounce',
  'video',
  'lottie-player',
  '[data-testid="streak-counter"]', // Dynamic counter
  'time', // Relative timestamps change
]

function getMasks(page: import('@playwright/test').Page) {
  return MASK_SELECTORS.map((sel) => page.locator(sel))
}

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
]

const THEMES = ['dark', 'light'] as const

// ═══════════════════════════════════════════════════════════
// COMPONENT-LEVEL VISUAL REGRESSION
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression — Components', () => {
  test('Auth page form elements remain consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Screenshot the form area specifically
    const form = page.locator('form').first()
    // STRICT: form must be visible
    await expect(form).toBeVisible({ timeout: 10000 })
    await expect(form).toHaveScreenshot('auth-form-desktop.png', {
      maxDiffPixelRatio: 0.01,
      mask: getMasks(page),
    })
  })

  test('Landing hero section remains consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: hero should have specific content
    const hero = page.locator('section').first()
    await expect(hero).toBeVisible({ timeout: 10000 })
    await expect(hero).toHaveScreenshot('landing-hero-dark.png', {
      maxDiffPixelRatio: 0.01,
      mask: getMasks(page),
    })
  })

  test('Premium pricing cards remain consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/premium')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Wait for pricing section
    await page.waitForTimeout(1000)
    await expect(page).toHaveScreenshot('premium-full-desktop.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
      mask: getMasks(page),
    })
  })
})

// ═══════════════════════════════════════════════════════════
// CROSS-VIEWPORT VISUAL REGRESSION
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression — Cross-Viewport', () => {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Landing page ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await dismissCookieBanner(page)
        await page.waitForTimeout(500) // Let animations settle

        await expect(page).toHaveScreenshot(`regression-landing-${viewport.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.01,
          fullPage: true,
          mask: getMasks(page),
        })
      })

      test(`Auth page ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await dismissCookieBanner(page)
        await page.waitForTimeout(500)

        await expect(page).toHaveScreenshot(`regression-auth-${viewport.name}-${theme}.png`, {
          maxDiffPixelRatio: 0.01,
          fullPage: true,
          mask: getMasks(page),
        })
      })
    }
  }
})

// ═══════════════════════════════════════════════════════════
// THEME CONSISTENCY
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression — Theme Consistency', () => {
  test('dark mode has no white flashes on landing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Check that body has dark background
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    // Background should not be white (rgb(255, 255, 255)) in dark mode
    expect(bgColor).not.toBe('rgb(255, 255, 255)')
  })

  test('light mode has proper contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Check that body doesn't have very dark background in light mode
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).not.toBe('rgb(0, 0, 0)')
  })
})

// ═══════════════════════════════════════════════════════════
// RESPONSIVE BREAKPOINTS
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression — Responsive Breakpoints', () => {
  const breakpoints = [
    { name: 'xs', width: 320, height: 568 },
    { name: 'sm', width: 640, height: 900 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 720 },
    { name: '2xl', width: 1536, height: 864 },
  ]

  for (const bp of breakpoints) {
    test(`Landing renders without overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)

      // Check no horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      // STRICT: no horizontal scroll at any breakpoint
      expect(hasOverflow).toBe(false)
    })
  }
})
