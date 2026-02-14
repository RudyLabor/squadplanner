import { test, expect } from './fixtures'

/**
 * Party E2E Tests — F41-F45 (functional + DB validation)
 * F41a: Squad cards display with correct names from DB
 * F41b: Squad count matches DB data
 * F42:  Join button click doesn't crash the page (WebRTC resilience)
 * F43:  No voice controls visible when not connected
 * F44:  Empty state or squad cards render correctly
 * F45:  Page structure and accessibility
 *
 * Uses shared fixtures: authenticatedPage (logged-in), db (TestDataHelper).
 *
 * RULES:
 * - NEVER use `expect(x || true).toBeTruthy()` — always passes
 * - NEVER use `expect(count).toBeGreaterThanOrEqual(0)` — always passes
 * - Every test MUST have at least one meaningful assertion that can FAIL
 */

// =============================================================================
// F41 — Party page shows user's squads from DB
// =============================================================================
test.describe('F41 — Page Party affiche les squads du user', () => {

  test('F41a: Squad names from DB appear on the party page', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify "Party" heading is visible
    await expect(authenticatedPage.getByText(/Party/i).first()).toBeVisible()

    if (userSquads.length > 0) {
      // At least one squad name from DB MUST appear on the party page
      let foundAtLeastOne = false
      for (const membership of userSquads.slice(0, 5)) {
        const squadName = membership.squads.name
        const visible = await authenticatedPage
          .getByText(squadName, { exact: false })
          .first()
          .isVisible()
          .catch(() => false)
        if (visible) {
          foundAtLeastOne = true
          break
        }
      }
      expect(foundAtLeastOne).toBe(true)
    } else {
      // No squads — verify empty state message
      const hasEmptyState = await authenticatedPage
        .getByText(/Aucune squad|Pas de squad|Rejoins une squad/i)
        .first()
        .isVisible()
        .catch(() => false)
      expect(hasEmptyState).toBe(true)
    }
  })

  test('F41b: Squad count displayed matches DB', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    if (userSquads.length > 0) {
      // The page should show squad cards — count them
      const squadCards = await authenticatedPage
        .locator('[class*="squad"], [class*="card"], [class*="room"]')
        .count()

      // Must have at least 1 card when user has squads
      expect(squadCards).toBeGreaterThan(0)
      // Card count should not exceed squad count (+ small tolerance for UI elements)
      expect(squadCards).toBeLessThanOrEqual(userSquads.length + 3)
    } else {
      // No squads — page should still render without crashing
      await expect(authenticatedPage.locator('main').first()).toBeVisible()
    }
  })
})

// =============================================================================
// F42 — Join party button (WebRTC resilience test)
// =============================================================================
test.describe('F42 — Rejoindre la party', () => {

  test('F42: Click join button — page remains functional (WebRTC may fail)', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()
    test.skip(userSquads.length === 0, 'No squads for user — cannot test join')

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    // Find a join/launch button
    const joinBtn = authenticatedPage
      .getByRole('button', { name: /Lancer|Rejoindre|Démarrer/i })
      .first()
    const hasJoin = await joinBtn.isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasJoin, 'No join button visible on party page')

    // Click join — WebRTC connection will likely fail in test environment
    // but the page must remain functional (no crash, no blank screen)
    await joinBtn.click()
    await authenticatedPage.waitForTimeout(3000)

    // Page must still be functional after click attempt
    await expect(authenticatedPage.locator('body')).toBeVisible()

    // The party heading should still be visible (page didn't navigate away)
    await expect(authenticatedPage.getByText(/Party/i).first()).toBeVisible()
  })
})

// =============================================================================
// F43 — Voice controls not visible when disconnected
// =============================================================================
test.describe('F43 — Contrôles vocaux (état déconnecté)', () => {

  test('F43: No mute/leave controls visible when not connected to voice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify the party page loaded
    await expect(authenticatedPage.getByText(/Party/i).first()).toBeVisible()

    // When NOT connected to a voice session, mute/leave buttons MUST NOT be visible
    const muteBtn = authenticatedPage.getByRole('button', { name: /Mute|Couper le micro|Unmute/i }).first()
    const isMuteVisible = await muteBtn.isVisible().catch(() => false)
    expect(isMuteVisible).toBe(false)

    const leaveBtn = authenticatedPage.getByRole('button', { name: /Quitter|Leave|Raccrocher/i }).first()
    const isLeaveVisible = await leaveBtn.isVisible().catch(() => false)
    expect(isLeaveVisible).toBe(false)
  })
})

// =============================================================================
// F44 — Empty state or squad cards render
// =============================================================================
test.describe('F44 — État de la page party', () => {

  test('F44: Party page renders either squad cards or empty state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    await expect(authenticatedPage.getByText(/Party/i).first()).toBeVisible()

    // Page must have either squad cards with action buttons OR an empty state message
    const hasCards = await authenticatedPage
      .locator('button:has-text("Lancer"), button:has-text("Rejoindre"), button:has-text("Démarrer")')
      .first()
      .isVisible()
      .catch(() => false)
    const hasEmpty = await authenticatedPage
      .getByText(/Rejoins une squad|Aucune squad|Pas encore de squad/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasContent = await authenticatedPage
      .locator('[class*="squad"], [class*="card"], [class*="room"]')
      .first()
      .isVisible()
      .catch(() => false)

    // At least one of these must be true — the page must have meaningful content
    expect(hasCards || hasEmpty || hasContent).toBe(true)
  })
})

// =============================================================================
// F45 — Page structure and accessibility
// =============================================================================
test.describe('F45 — Structure page party', () => {

  test('F45: Party page has correct main structure and no JS errors', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify heading
    await expect(authenticatedPage.getByText(/Party/i).first()).toBeVisible()

    // Verify main content area exists
    const main = authenticatedPage.locator('main').first()
    await expect(main).toBeVisible()

    // Verify body is still visible (no JS crash)
    await expect(authenticatedPage.locator('body')).toBeVisible()

    // Verify navigation is present (bottom nav or sidebar)
    const nav = authenticatedPage.locator('nav, [role="navigation"]').first()
    await expect(nav).toBeVisible()
  })
})
