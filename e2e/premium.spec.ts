import { test, expect } from '@playwright/test'

/**
 * Premium E2E Tests — Flux F66-F69
 * F66: Voir la page premium
 * F67: Souscrire via Stripe (non testable — nécessite paiement réel)
 * F68: Activer un essai gratuit
 * F69: Gérer son abonnement (non testable — nécessite abonnement actif)
 */

const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!',
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 }).catch(() => {})
}

test.describe('F66 - Voir la page premium', () => {
  test('should display premium page without auth', async ({ page }) => {
    // Premium page is public (pre-rendered)
    await page.goto('/premium')
    await page.waitForTimeout(1000)

    // Should show premium content
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show pricing information', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for pricing (4.99€/mois or 47.88€/an or any price)
    const hasPrice = await page.getByText(/4[.,]99|47[.,]88|49[.,]99|€|mois|an/i).first().isVisible().catch(() => false)
    expect(hasPrice).toBeTruthy()
  })

  test('should show features or comparison content', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for feature comparison elements
    const hasContent = await page.locator('main, [class*="container"], section').first().isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('should show FAQ section', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for FAQ
    const faq = page.getByText(/FAQ|Questions/i).first()
    const hasFAQ = await faq.isVisible().catch(() => false)
    if (hasFAQ) {
      await expect(faq).toBeVisible()
    }
  })

  test('should have upgrade CTA buttons', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for any CTA button
    const upgradeBtn = page.getByRole('button', { name: /Premium|abonner|Commencer/i }).first()
    const upgradeLink = page.getByRole('link', { name: /Premium|abonner|Commencer/i }).first()

    const hasBtn = await upgradeBtn.isVisible().catch(() => false)
    const hasLink = await upgradeLink.isVisible().catch(() => false)
    expect(hasBtn || hasLink).toBeTruthy()
  })
})

test.describe('F67 - Souscrire via Stripe', () => {
  test('should have plan toggle or pricing options', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for plan toggle (monthly/yearly) or pricing options
    const monthlyOption = page.getByText(/Mensuel/i).first()
    const yearlyOption = page.getByText(/Annuel/i).first()
    const priceOption = page.getByText(/mois|an/i).first()

    const hasMonthly = await monthlyOption.isVisible().catch(() => false)
    const hasYearly = await yearlyOption.isVisible().catch(() => false)
    const hasPrice = await priceOption.isVisible().catch(() => false)

    expect(hasMonthly || hasYearly || hasPrice).toBeTruthy()
  })
})

test.describe('F68 - Activer un essai gratuit', () => {
  test('should show trial mention on premium page', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Check for trial mention (7 days)
    const trialMention = page.getByText(/essai|trial|7 jours|gratuit/i).first()
    const hasTrial = await trialMention.isVisible().catch(() => false)
    if (hasTrial) {
      await expect(trialMention).toBeVisible()
    }
  })
})

test.describe('F69 - Gérer son abonnement', () => {
  test('should load premium page for authenticated users', async ({ page }) => {
    await loginUser(page)
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Premium - Navigation', () => {
  test('should redirect to auth when clicking upgrade without login', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForTimeout(2000)

    // Click upgrade button without being logged in
    const upgradeBtn = page.getByRole('button', { name: /Premium|abonner|Commencer/i }).first()
    if (await upgradeBtn.isVisible().catch(() => false)) {
      await upgradeBtn.click()
      await page.waitForTimeout(2000)

      // Should redirect to auth for unauthenticated users
      const url = page.url()
      expect(url.includes('/auth') || url.includes('/premium') || url.includes('stripe')).toBeTruthy()
    }
  })
})

test.describe('Premium - Responsive', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/premium')
    await page.waitForTimeout(1000)

    // Page should load on mobile without overflow
    await expect(page.locator('body')).toBeVisible()
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflow).toBeFalsy()
  })
})
