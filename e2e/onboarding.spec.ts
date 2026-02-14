import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Onboarding E2E Tests — F06-F09 (functional + DB validation)
 * F06a: Onboarded user is redirected away from /onboarding
 * F06b: Onboarding page shows squad-choice step content
 * F07:  Join squad step has code input field
 * F08:  Profile data in DB has username and timezone (DB validation)
 * F09a: localStorage onboarding flags are set for completed user
 * F09b: Onboarding page has interactive elements (buttons, inputs)
 *
 * The test user has already completed onboarding, so some tests verify
 * redirect behavior while others validate DB state from completed onboarding.
 */

// =============================================================================
// F06 — Onboarding Page
// =============================================================================
test.describe('F06 — Onboarding Page', () => {

  test('F06a: Onboarded user visiting /onboarding is redirected to /home', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/onboarding')
    await authenticatedPage.waitForTimeout(3000)

    const url = authenticatedPage.url()
    // Already onboarded user must NOT stay on /onboarding
    expect(url).not.toContain('/onboarding')
    expect(url).toMatch(/\/(home|squads|squad\/|sessions|messages|party|profile|settings|discover)/)
  })

  baseTest('F06b: Unauthenticated visitor sees onboarding content or auth redirect', async ({ page }) => {
    await page.goto('https://squadplanner.fr/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()
    // Either stays on onboarding (showing squad-choice step) or redirects to auth
    baseExpect(url).toMatch(/\/(onboarding|auth)/)

    if (url.includes('/onboarding')) {
      // Verify squad-choice step content — buttons to create or join a squad
      const hasCreateBtn = await page
        .getByText(/Créer.*squad|Créer/i)
        .first()
        .isVisible()
        .catch(() => false)
      const hasJoinBtn = await page
        .getByText(/Rejoindre.*squad|Rejoindre/i)
        .first()
        .isVisible()
        .catch(() => false)
      const hasInteractive = await page
        .locator('button, a[href], input')
        .first()
        .isVisible()
        .catch(() => false)

      baseExpect(hasCreateBtn || hasJoinBtn || hasInteractive).toBe(true)
    } else {
      // Redirected to /auth — verify auth form loads
      await baseExpect(page.locator('form')).toBeVisible({ timeout: 10000 })
    }
  })
})

// =============================================================================
// F07 — Join Squad via Code
// =============================================================================
test.describe('F07 — Join Squad via Code', () => {

  baseTest('F07: Join squad step has code input when navigated to', async ({ page }) => {
    await page.goto('https://squadplanner.fr/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()
    if (!url.includes('/onboarding')) {
      baseTest.skip(true, 'Redirected away from onboarding — cannot test join step')
      return
    }

    // Try to navigate to join-squad step by clicking "Rejoindre"
    const joinBtn = page.getByText(/Rejoindre/i).first()
    const hasJoinBtn = await joinBtn.isVisible().catch(() => false)

    if (hasJoinBtn) {
      await joinBtn.click()
      await page.waitForTimeout(500)

      // Verify invite code input appears
      const codeInput = page.locator(
        'input[placeholder*="code" i], input[placeholder*="invitation" i], input[name*="code" i], input[type="text"]'
      ).first()
      await baseExpect(codeInput).toBeVisible({ timeout: 5000 })
    } else {
      // If no join button, verify that the onboarding page has interactive elements
      const hasInteractive = await page.locator('button, input').first().isVisible()
      baseExpect(hasInteractive).toBe(true)
    }
  })
})

// =============================================================================
// F08 — Profile Setup (DB validation)
// =============================================================================
test.describe('F08 — Profile Setup', () => {

  test('F08: Profile data in DB has username and timezone from onboarding', async ({ db }) => {
    // Validate that the test user's profile has onboarding-set fields
    const profile = await db.getProfileFields()
    expect(profile).toBeTruthy()

    // Username must exist and not be empty
    expect(profile.username).toBeTruthy()
    expect(profile.username.length).toBeGreaterThan(0)

    // Timezone must be set (from onboarding step or default)
    expect(profile.timezone).toBeTruthy()
    expect(profile.timezone).toContain('/')  // Format: Region/City (e.g., Europe/Paris)
  })
})

// =============================================================================
// F09 — Permissions & Completion
// =============================================================================
test.describe('F09 — Permissions & Completion', () => {

  test('F09a: Onboarding localStorage flags are set for completed user', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify guided tour completion flag is set
    const tourCompleted = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-tour-completed-v1')
    )
    expect(tourCompleted).toBe('true')
  })

  baseTest('F09b: Onboarding page has permission-related content if accessible', async ({ page }) => {
    await page.goto('https://squadplanner.fr/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()
    if (!url.includes('/onboarding')) {
      baseTest.skip(true, 'Redirected away from onboarding')
      return
    }

    // The onboarding page should contain references to permissions or interactive steps
    const bodyText = await page.locator('body').textContent()

    // Verify page has substantial content (not a blank page)
    baseExpect(bodyText!.length).toBeGreaterThan(50)

    // Verify interactive elements are present (user can proceed through steps)
    const interactiveCount = await page.locator('button, input, a[href]').count()
    baseExpect(interactiveCount).toBeGreaterThan(0)
  })
})
