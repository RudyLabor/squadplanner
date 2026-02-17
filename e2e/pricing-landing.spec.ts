import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { dismissCookieBanner } from './fixtures'

/**
 * Landing page PricingSection E2E — Phase 1
 *
 * Tests the pricing section on the public landing page.
 * Verifies 4-tier display with monthly/yearly toggle.
 *
 * The PricingSection is inside a LazySection (id="pricing")
 * that only renders when scrolled into view.
 */

/** Scroll to the #pricing LazySection and wait for it to render */
async function scrollToPricing(page: import('@playwright/test').Page) {
  await dismissCookieBanner(page)
  await page.waitForLoadState('networkidle')

  // Scroll directly to the #pricing LazySection wrapper
  await page.locator('#pricing').scrollIntoViewIfNeeded()
  // Wait for lazy-loaded content to render (LazySection + framer-motion whileInView)
  await page.waitForTimeout(1500)
}

baseTest.describe('Landing page — PricingSection 4 tiers', () => {
  baseTest('displays pricing section with tier names', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await scrollToPricing(page)

    // STRICT: tier names MUST be visible in the pricing section
    await baseExpect(page.getByText('Gratuit').first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText('Premium').first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText('Squad Leader').first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText('Club').first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('displays pricing amounts on landing page', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await scrollToPricing(page)

    // STRICT: monthly prices MUST be visible
    await baseExpect(page.getByText(/6[.,]99/).first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText(/14[.,]99/).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/39[.,]99/).first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('monthly/yearly toggle exists on landing page', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await scrollToPricing(page)

    // STRICT: Mensuel/Annuel toggle MUST exist
    await baseExpect(page.getByText('Mensuel').first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText(/Annuel/).first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('free tier shows reduced limits: 1 squad, 3 sessions', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await scrollToPricing(page)

    // STRICT: free tier limits should appear in pricing
    await baseExpect(page.getByText('1 squad').first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText(/3 sessions/i).first()).toBeVisible({ timeout: 5000 })
  })
})
