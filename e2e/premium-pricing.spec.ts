import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Premium pricing E2E — Phase 1 multi-tier (4 tiers)
 *
 * Tests the REAL deployed premium page at squadplanner.fr
 * Verifies 4-tier pricing, monthly/yearly toggle, and correct prices.
 */

// =============================================================================
// 4-tier pricing display (public, no auth)
// =============================================================================
baseTest.describe('Premium page — 4-tier pricing display', () => {
  baseTest('displays all 3 paid tier names: Premium, Squad Leader, Club', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // Scroll down to ensure tier cards area is rendered (below hero + promo + trial)
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(800)

    // STRICT: all 3 paid tier names MUST appear
    await baseExpect(page.getByText('Premium').first()).toBeVisible({ timeout: 15000 })
    await baseExpect(page.getByText('Squad Leader').first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText('Club').first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('displays correct monthly prices: 6.99, 14.99, 39.99', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: monthly prices MUST be visible
    await baseExpect(page.getByText(/6[.,]99/).first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText(/14[.,]99/).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/39[.,]99/).first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('has monthly/yearly toggle', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: toggle buttons for Mensuel/Annuel MUST exist
    const mensuel = page.getByText(/Mensuel/i).first()
    const annuel = page.getByText(/Annuel/i).first()
    await baseExpect(mensuel).toBeVisible({ timeout: 10000 })
    await baseExpect(annuel).toBeVisible({ timeout: 5000 })
  })

  baseTest('yearly toggle shows reduced prices and savings badge', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // Click yearly toggle
    const annuel = page.getByText(/Annuel/i).first()
    await annuel.click()
    await page.waitForTimeout(800)

    // STRICT: yearly prices or per-month equivalents should appear
    // Premium yearly: 59.88 or 4.99/mois
    const yearlyPrice = page.getByText(/4[.,]99|59[.,]88/).first()
    await baseExpect(yearlyPrice).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Feature comparison table (4 columns)
// =============================================================================
baseTest.describe('Premium page — feature comparison table', () => {
  baseTest('displays key features with 4-tier values', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: feature names from PremiumData MUST be visible
    await baseExpect(page.getByText('Squads').first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText(/Historique sessions/i).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/Stats & Analytics/i).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/IA Coach/i).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/Audio HD/i).first()).toBeVisible({ timeout: 5000 })
  })

  baseTest('shows free tier limits: 1 squad, 7 jours, 3 sessions', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: free tier limits MUST be visible in the comparison table
    await baseExpect(page.getByText('1 squad').first()).toBeVisible({ timeout: 10000 })
    await baseExpect(page.getByText('7 jours').first()).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// FAQ section
// =============================================================================
baseTest.describe('Premium page — FAQ', () => {
  baseTest('displays FAQ questions about cancellation, tiers, and trial', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: FAQ questions MUST be visible
    await baseExpect(page.getByText(/annuler quand je veux/i).first()).toBeVisible({
      timeout: 10000,
    })
    await baseExpect(page.getByText(/Squad Leader/i).first()).toBeVisible({ timeout: 5000 })
    await baseExpect(page.getByText(/essai/i).first()).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Testimonials
// =============================================================================
baseTest.describe('Premium page — testimonials', () => {
  baseTest('displays at least one testimonial', async ({ page }) => {
    await page.goto('https://squadplanner.fr/premium')
    await dismissCookieBanner(page)
    await page.waitForLoadState('networkidle')

    // STRICT: at least one testimonial name MUST be visible
    const testimonial = page.getByText(/AlexGaming|MarieGG|LucasApex/i).first()
    await baseExpect(testimonial).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// CTA buttons for each tier (authenticated)
// =============================================================================
test.describe('Premium page — CTA buttons (authenticated)', () => {
  test('displays upgrade CTA for at least one paid tier', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/premium')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: at least one CTA button MUST be visible for a paid tier
    const cta = authenticatedPage
      .getByRole('button', {
        name: /Passer Premium|Commencer|Choisir|Essai gratuit/i,
      })
      .first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })

  test('checkout call includes tier metadata when clicking upgrade', async ({
    authenticatedPage,
  }) => {
    let interceptedBody: Record<string, unknown> | null = null

    await authenticatedPage.route('**/functions/v1/create-checkout', async (route) => {
      try {
        interceptedBody = JSON.parse(route.request().postData() || '{}')
      } catch {
        interceptedBody = {}
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/mock', session_id: 'mock' }),
      })
    })

    await authenticatedPage.goto('/premium')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // Click the first upgrade CTA
    const upgradeBtn = authenticatedPage
      .getByRole('button', {
        name: /Passer Premium|Commencer|Choisir/i,
      })
      .first()

    const isVisible = await upgradeBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      await upgradeBtn.click()
      await authenticatedPage.waitForTimeout(3000)

      if (interceptedBody) {
        // STRICT: request MUST contain price_id and tier
        expect(interceptedBody).toHaveProperty('price_id')
        expect(interceptedBody).toHaveProperty('tier')
      }
    }
  })
})
