import { test as baseTest, expect } from '@playwright/test'
import { dismissCookieBanner } from './fixtures'

// ============================================================
// Static Pages E2E Tests — Legal + Help
// These are public pages that don't require authentication.
// ============================================================

// ============================================================
// Legal Page Tests
// ============================================================
baseTest.describe('Legal — Page loads with correct heading', () => {
  baseTest('should display Legal page with CGU or Privacy tab heading', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // The Legal page has two tabs: "Conditions d'utilisation" and "Politique de confidentialité"
    const cguTab = page.getByText(/Conditions d'utilisation/i).first()
    const privacyTab = page.getByText(/Politique de confidentialité/i).first()

    const hasCGU = await cguTab.isVisible().catch(() => false)
    const hasPrivacy = await privacyTab.isVisible().catch(() => false)

    // At least one of the two legal tab headings must be visible
    expect(hasCGU || hasPrivacy).toBe(true)

    // The "Squad Planner" branding should be visible in the header
    const branding = page.getByText(/Squad Planner/i).first()
    const hasBranding = await branding.isVisible().catch(() => false)
    expect(hasBranding).toBe(true)
  })
})

baseTest.describe('Legal — Page has content', () => {
  baseTest('should display legal text content (not empty)', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // The CGU content is loaded by default. Verify there is substantial text on the page.
    const mainContent = page.locator('main').last()
    const mainVisible = await mainContent.isVisible().catch(() => false)
    expect(mainVisible).toBe(true)

    const mainText = await mainContent.textContent()
    expect(mainText).toBeTruthy()
    // Legal content must have meaningful length (at least 100 characters of text)
    expect(mainText!.length).toBeGreaterThan(100)

    // Verify paragraph-like content exists (not just buttons/headers)
    // Look for typical legal terms
    const hasLegalTerms = await page
      .getByText(/utilisateur|responsabilité|données|service|droit/i)
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasLegalTerms).toBe(true)
  })
})

baseTest.describe('Legal — Accessible structure', () => {
  baseTest('should have main landmark and tab navigation', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // Main landmark must exist (use .last() — page may have an outer #main-content wrapper)
    const mainLandmark = page.locator('main').last()
    await expect(mainLandmark).toBeVisible()

    // Header with back button must exist
    const header = page.locator('header')
    const hasHeader = await header.first().isVisible().catch(() => false)
    expect(hasHeader).toBe(true)

    // The back arrow link to "/" must exist
    const backLink = page.locator('a[href="/"]')
    const hasBackLink = await backLink.first().isVisible().catch(() => false)
    expect(hasBackLink).toBe(true)

    // Tab buttons for CGU / Privacy must be clickable
    const cguButton = page.getByText(/Conditions d'utilisation/i).first()
    const privacyButton = page.getByText(/Politique de confidentialité/i).first()

    if (await cguButton.isVisible().catch(() => false)) {
      await cguButton.click()
      await page.waitForTimeout(500)
      // After clicking CGU, legal terms should be visible
      const mainText = await mainLandmark.textContent()
      expect(mainText!.length).toBeGreaterThan(50)
    }

    if (await privacyButton.isVisible().catch(() => false)) {
      await privacyButton.click()
      await page.waitForTimeout(500)
      // After clicking Privacy, privacy-related content should appear
      const mainText = await mainLandmark.textContent()
      expect(mainText!.length).toBeGreaterThan(50)
    }
  })
})

// ============================================================
// Help Page Tests
// ============================================================
baseTest.describe('Help — Page loads with correct heading', () => {
  baseTest('should display Help page with heading', async ({ page }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // The Help page has aria-label="Aide" on <main> and heading "Aide & FAQ"
    const mainLandmark = page.locator('main[aria-label*="Aide" i]')
    const hasMain = await mainLandmark.isVisible().catch(() => false)

    const heading = page.getByText(/Aide & FAQ|Aide|Centre d'aide/i).first()
    const hasHeading = await heading.isVisible().catch(() => false)

    // At least the main landmark or heading must be present
    expect(hasMain || hasHeading).toBe(true)

    // Verify the search input is visible (key feature of the help page)
    const searchInput = page.locator('input[placeholder*="Rechercher" i]')
    const hasSearch = await searchInput.isVisible().catch(() => false)
    expect(hasSearch).toBe(true)
  })
})

baseTest.describe('Help — Page has content sections', () => {
  baseTest('should display FAQ categories and questions', async ({ page }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // The Help page shows FAQ items grouped by categories
    // Category filter buttons include "Tout" + each category name
    const toutButton = page.getByRole('button', { name: /^Tout$/i }).first()
    const hasToutButton = await toutButton.isVisible().catch(() => false)
    expect(hasToutButton).toBe(true)

    // There must be at least one FAQ question visible (rendered as clickable buttons inside Card components)
    const faqQuestions = page.locator('button.w-full').filter({
      has: page.locator('span'),
    })
    const faqCount = await faqQuestions.count()
    expect(faqCount).toBeGreaterThan(0)

    // Verify there are FAQ category headings (h2 elements with category names)
    const categoryHeadings = page.locator('h2')
    const categoryCount = await categoryHeadings.count()
    expect(categoryCount).toBeGreaterThan(0)

    // Verify a category heading has meaningful text
    const firstCategoryText = await categoryHeadings.first().textContent()
    expect(firstCategoryText).toBeTruthy()
    expect(firstCategoryText!.length).toBeGreaterThan(2)
  })
})

baseTest.describe('Help — Accessible structure', () => {
  baseTest('should have main landmark, heading, and keyboard-navigable FAQ', async ({ page }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // Main landmark with aria-label must exist (use specific selector — page has 2 <main> elements)
    const mainLandmark = page.locator('main[aria-label]')
    await expect(mainLandmark).toBeVisible()

    const ariaLabel = await mainLandmark.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('aide')

    // Search input must be focusable
    const searchInput = page.locator('input[placeholder*="Rechercher" i]')
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.focus()
      const isFocused = await searchInput.evaluate((el) => document.activeElement === el)
      expect(isFocused).toBe(true)
    }

    // FAQ items must be clickable — click the first one and verify answer appears
    const firstFaqButton = page.locator('button.w-full').filter({ has: page.locator('span') }).first()
    const hasFaq = await firstFaqButton.isVisible().catch(() => false)

    if (hasFaq) {
      await firstFaqButton.click()
      await page.waitForTimeout(500)

      // After clicking, an answer paragraph should become visible
      const answerText = page.locator('p').filter({ hasText: /.{20,}/ })
      const answerCount = await answerText.count()
      expect(answerCount).toBeGreaterThan(0)
    }

    // Contact section should be present at the bottom
    const contactSection = page.getByText(/Contact|Nous contacter|support/i).first()
    // Scroll to bottom to find it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    const hasContact = await contactSection.isVisible().catch(() => false)

    // Version text "Squad Planner v1.0.0" should be at the very bottom
    const versionText = page.getByText(/Squad Planner v/i).first()
    const hasVersion = await versionText.isVisible().catch(() => false)

    // At least contact section or version text must be present at bottom
    expect(hasContact || hasVersion).toBe(true)
  })
})
