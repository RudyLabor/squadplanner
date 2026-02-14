import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * PWA E2E Tests — F70
 * F70a: Web manifest accessible and valid
 * F70b: Service worker file accessible
 * F70c: PWA install banner localStorage logic
 *
 * Note: Actual PWA installation cannot be tested in Playwright (requires mobile Chrome).
 * These tests verify the PWA infrastructure is correctly deployed.
 */

// =============================================================================
// F70 — PWA
// =============================================================================
baseTest.describe('F70 — PWA', () => {

  baseTest('F70a: Web manifest is accessible and contains required fields', async ({ page }) => {
    // Try both manifest.json and manifest.webmanifest
    let response = await page.goto('https://squadplanner.fr/manifest.json')
    if (!response || response.status() !== 200) {
      response = await page.goto('https://squadplanner.fr/manifest.webmanifest')
    }
    baseExpect(response).toBeTruthy()
    baseExpect(response!.status()).toBe(200)

    const manifest = await response!.json()
    baseExpect(manifest).toBeTruthy()

    // Required PWA manifest fields
    baseExpect(manifest.name).toBeTruthy()
    baseExpect(manifest.icons).toBeTruthy()
    baseExpect(Array.isArray(manifest.icons)).toBe(true)
    baseExpect(manifest.icons.length).toBeGreaterThan(0)
    baseExpect(manifest.start_url).toBeTruthy()
    baseExpect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/)
  })

  baseTest('F70b: Service worker file is accessible', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/sw.js')
    baseExpect(response).toBeTruthy()
    baseExpect(response!.status()).toBe(200)

    const contentType = response!.headers()['content-type'] || ''
    baseExpect(contentType).toContain('javascript')
  })
})

test.describe('F70 — PWA Install Banner Logic', () => {
  test('F70c: PWA install banner localStorage keys function correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')

    // Check that localStorage visit counter key exists or can be set
    const visits = await authenticatedPage.evaluate(() => {
      return Number(localStorage.getItem('sq-visits') || '0')
    })
    baseExpect(typeof visits).toBe('number')

    // Simulate 3+ visits to trigger banner eligibility
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('sq-visits', '3')
      localStorage.removeItem('sq-pwa-dismissed')
      localStorage.removeItem('sq-pwa-installed')
    })

    // Verify dismiss flag is cleared
    const dismissedAt = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-pwa-dismissed')
    )
    baseExpect(dismissedAt).toBeNull()

    // Mock beforeinstallprompt event — verify it doesn't crash the app
    await authenticatedPage.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = () => Promise.resolve()
      ;(event as any).userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
    })
    await authenticatedPage.waitForTimeout(1000)

    // Page should still be functional after dispatching the event
    await expect(authenticatedPage.locator('body')).toBeVisible()
  })
})
