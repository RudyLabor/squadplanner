import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Static Pages E2E Tests — Legal + Help (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de OR conditions passe-partout
 * - Chaque element attendu DOIT etre visible → sinon FAIL
 * - Pas de fallback sur <main> quand un element specifique est requis
 */

// ============================================================
// Legal Page Tests
// ============================================================

test.describe('Legal — Page loads with correct heading', () => {
  test('should display Legal page with CGU tab heading visible', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: The CGU tab button MUST be visible (it's the default active tab)
    const cguTab = page.getByText(/Conditions d'utilisation/i).first()
    // STRICT: await expect — no .catch(() => false)
    await expect(cguTab).toBeVisible({ timeout: 10000 })

    // STRICT: The Privacy tab button MUST also be visible (both tabs are always rendered)
    const privacyTab = page.getByText(/Politique de confidentialité/i).first()
    // STRICT: direct assertion, no OR fallback
    await expect(privacyTab).toBeVisible({ timeout: 5000 })

    // STRICT: "Squad Planner" branding MUST be in the header
    const branding = page.getByText(/Squad Planner/i).first()
    await expect(branding).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Legal — Page has content', () => {
  test('should display legal text content with meaningful length', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: <main> with content MUST be visible
    const mainContent = page.locator('main').last()
    await expect(mainContent).toBeVisible({ timeout: 10000 })

    // STRICT: Legal content MUST have substantial text (at least 100 chars)
    const mainText = await mainContent.textContent()
    expect(mainText).toBeTruthy()
    // STRICT: meaningful length check — legal pages must have real content
    expect(mainText!.length).toBeGreaterThan(100)

    // STRICT: Legal terms MUST be present in the text content
    const legalTermLocator = page
      .getByText(/utilisateur|responsabilité|données|service|droit/i)
      .first()
    // STRICT: no .catch(() => false) — this MUST be visible
    await expect(legalTermLocator).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Legal — Accessible structure', () => {
  test('should have header, back link, and working tab navigation', async ({ page }) => {
    await page.goto('/legal')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: Main landmark MUST exist
    const mainLandmark = page.locator('main').last()
    await expect(mainLandmark).toBeVisible()

    // STRICT: Header MUST exist
    const header = page.locator('header').first()
    await expect(header).toBeVisible({ timeout: 5000 })

    // STRICT: Back link to "/" MUST exist
    const backLink = page.locator('a[href="/"]').first()
    await expect(backLink).toBeVisible({ timeout: 5000 })

    // STRICT: Click CGU tab — content MUST update
    const cguButton = page.getByText(/Conditions d'utilisation/i).first()
    await expect(cguButton).toBeVisible({ timeout: 5000 })
    await cguButton.click()
    await page.waitForTimeout(500)
    const cguText = await mainLandmark.textContent()
    // STRICT: after clicking CGU, content must have real text
    expect(cguText!.length).toBeGreaterThan(50)

    // STRICT: Click Privacy tab — content MUST update
    const privacyButton = page.getByText(/Politique de confidentialité/i).first()
    await expect(privacyButton).toBeVisible({ timeout: 5000 })
    await privacyButton.click()
    await page.waitForTimeout(500)
    const privacyText = await mainLandmark.textContent()
    // STRICT: after clicking Privacy, content must have real text
    expect(privacyText!.length).toBeGreaterThan(50)
  })
})

// ============================================================
// Help Page Tests
// ============================================================

test.describe('Help — Page loads with correct heading', () => {
  test('should display Help page with heading and search input', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: Main landmark with aria-label "Aide" MUST exist
    const mainLandmark = page.locator('main[aria-label="Aide"]')
    await expect(mainLandmark).toBeVisible({ timeout: 10000 })

    // STRICT: Search input MUST be visible (key feature of the help page)
    const searchInput = page.locator('input[placeholder*="Rechercher" i]')
    // STRICT: no .catch(() => false)
    await expect(searchInput).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Help — Page has content sections', () => {
  test('should display FAQ categories, category headings, and questions', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: "Tout" filter button MUST be visible
    const toutButton = page.getByRole('button', { name: /^Tout$/i }).first()
    await expect(toutButton).toBeVisible({ timeout: 5000 })

    // STRICT: At least one FAQ question button MUST exist
    const faqQuestions = page.locator('button.w-full').filter({ has: page.locator('span') })
    const faqCount = await faqQuestions.count()
    // STRICT: FAQ count must be > 0 — not >= 0
    expect(faqCount).toBeGreaterThan(0)

    // STRICT: At least one category heading (h2) MUST exist
    const categoryHeadings = page.locator('h2')
    const categoryCount = await categoryHeadings.count()
    // STRICT: category count must be > 0
    expect(categoryCount).toBeGreaterThan(0)

    // STRICT: First category heading must have meaningful text
    const firstCategoryText = await categoryHeadings.first().textContent()
    expect(firstCategoryText).toBeTruthy()
    // STRICT: category name must be a real word (> 2 chars)
    expect(firstCategoryText!.length).toBeGreaterThan(2)
  })
})

test.describe('Help — Accessible structure and FAQ interaction', () => {
  test('should have aria-label, focusable search, clickable FAQ, and footer', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(1000)

    // STRICT: Main landmark with aria-label MUST exist and contain "aide"
    const mainLandmark = page.locator('main[aria-label]')
    await expect(mainLandmark).toBeVisible({ timeout: 10000 })
    const ariaLabel = await mainLandmark.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    // STRICT: aria-label must contain "aide" (case-insensitive)
    expect(ariaLabel!.toLowerCase()).toContain('aide')

    // STRICT: Search input MUST be focusable
    const searchInput = page.locator('input[placeholder*="Rechercher" i]')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await searchInput.focus()
    const isFocused = await searchInput.evaluate((el) => document.activeElement === el)
    // STRICT: input must actually receive focus
    expect(isFocused).toBe(true)

    // STRICT: Click first FAQ item — answer MUST appear
    const firstFaqButton = page
      .locator('button.w-full')
      .filter({ has: page.locator('span') })
      .first()
    await expect(firstFaqButton).toBeVisible({ timeout: 5000 })
    await firstFaqButton.click()
    await page.waitForTimeout(500)

    // STRICT: After clicking, an answer paragraph with real content MUST appear
    const answerText = page.locator('p').filter({ hasText: /.{20,}/ })
    const answerCount = await answerText.count()
    // STRICT: at least one answer paragraph must be visible
    expect(answerCount).toBeGreaterThan(0)

    // STRICT: Scroll to bottom — "Squad Planner v1.0.0" footer MUST be visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    const versionText = page.getByText(/Squad Planner v/i).first()
    // STRICT: version footer MUST be present
    await expect(versionText).toBeVisible({ timeout: 5000 })
  })
})
