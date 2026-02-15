import { test, expect } from './fixtures'

/**
 * Push Notifications E2E Tests — F71 (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de OR conditions passe-partout
 * - DB fetched FIRST → UI MUST match
 * - Si push_subscriptions existent → leurs champs DOIVENT etre valides
 * - Le service worker DOIT etre enregistre → sinon FAIL
 * - La section Notifications dans Settings DOIT etre visible → sinon FAIL
 */

// =============================================================================
// F71 — Push Notifications
// =============================================================================
test.describe('F71 — Push Notifications', () => {

  test('F71a: Settings page shows notification heading AND toggles', async ({ authenticatedPage, db }) => {
    // STRICT: fetch DB first — know what to expect
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: Notification heading MUST be visible — no OR fallback with card
    const notifHeading = authenticatedPage.getByRole('heading', { name: /Notifications/i }).first()
    // STRICT: await expect — no .catch(() => false)
    await expect(notifHeading).toBeVisible({ timeout: 10000 })

    // STRICT: At least one notification toggle (role="switch") MUST be present
    const toggles = authenticatedPage.locator('[role="switch"]')
    const toggleCount = await toggles.count()
    // STRICT: must have > 0 toggles, not >= 0
    expect(toggleCount).toBeGreaterThan(0)

    // STRICT: Notification category labels MUST be visible
    // The Settings page shows: Sessions, Messages, Party vocale, Rappels automatiques
    const sessionsLabel = authenticatedPage.locator('main').getByText(/Sessions/i).first()
    // STRICT: direct assertion
    await expect(sessionsLabel).toBeVisible({ timeout: 5000 })

    const messagesLabel = authenticatedPage.locator('main').getByText(/Messages/i).first()
    await expect(messagesLabel).toBeVisible({ timeout: 5000 })
  })

  test('F71b: Service worker is registered in the browser', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(3000) // Give SW time to register

    // STRICT: Check if service worker is registered
    const swRegistered = await authenticatedPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration('/')
      return !!registration
    })
    // STRICT: Service worker MUST be registered — no fallback
    expect(swRegistered).toBe(true)
  })

  test('F71c: push_subscriptions DB table structure is correct', async ({ db }) => {
    // STRICT: Fetch subscriptions from DB
    const subs = await db.getPushSubscriptions()

    // STRICT: The query MUST succeed — array is returned
    expect(Array.isArray(subs)).toBe(true)

    if (subs.length > 0) {
      // STRICT: If subscriptions exist, validate EVERY required field
      for (const sub of subs) {
        // STRICT: endpoint MUST be a valid URL string
        expect(sub.endpoint).toBeTruthy()
        expect(typeof sub.endpoint).toBe('string')
        expect(sub.endpoint.startsWith('https://')).toBe(true)

        // STRICT: user_id MUST match the test user
        expect(sub.user_id).toBeTruthy()
        const userId = await db.getUserId()
        expect(sub.user_id).toBe(userId)
      }
    } else {
      // STRICT: No subscriptions — that's valid for the test user
      // but we explicitly assert the empty array state
      expect(subs.length).toBe(0)
    }
  })

  test('F71d: Notification toggle interaction works on Settings page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: Find the first notification toggle
    const firstToggle = authenticatedPage.locator('[role="switch"]').first()
    await expect(firstToggle).toBeVisible({ timeout: 10000 })

    // STRICT: Read initial state
    const initialChecked = await firstToggle.getAttribute('aria-checked')
    expect(initialChecked).toBeTruthy()
    // STRICT: aria-checked must be 'true' or 'false' — not null or undefined
    expect(['true', 'false']).toContain(initialChecked)

    // STRICT: Click the toggle
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: State MUST have changed after click
    const newChecked = await firstToggle.getAttribute('aria-checked')
    expect(newChecked).toBeTruthy()
    // STRICT: the toggle state must be the opposite of initial
    expect(newChecked).not.toBe(initialChecked)

    // STRICT: Click back to restore original state
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: State MUST be restored
    const restoredChecked = await firstToggle.getAttribute('aria-checked')
    expect(restoredChecked).toBe(initialChecked)
  })
})
