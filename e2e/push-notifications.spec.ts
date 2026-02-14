import { test, expect } from './fixtures'

/**
 * Push Notifications E2E Tests — F71
 * F71a: Settings page shows notification section
 * F71b: Service worker is registered in browser
 * F71c: push_subscriptions DB table is queryable
 *
 * Note: Actual push notification delivery cannot be tested in E2E.
 * These tests verify the notification infrastructure is deployed and functional.
 */

// =============================================================================
// F71 — Push Notifications
// =============================================================================
test.describe('F71 — Push Notifications', () => {

  test('F71a: Settings page shows notification toggle section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // Verify notification section exists — heading "Notifications" (h2) in the card
    const notifHeading = authenticatedPage.getByRole('heading', { name: /Notifications/i })
    const notifCard = authenticatedPage.locator('#notifications')
    const hasHeading = await notifHeading.first().isVisible({ timeout: 10000 }).catch(() => false)
    const hasCard = await notifCard.isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasHeading || hasCard).toBe(true)

    // Verify at least one notification toggle is present (role="switch" buttons)
    const hasToggle = await authenticatedPage
      .locator('#notifications [role="switch"], [role="switch"]')
      .first()
      .isVisible()
      .catch(() => false)
    // Also check for notification-related labels scoped to the settings page main content
    const hasLabel = await authenticatedPage
      .locator('main')
      .getByText(/Sessions|Messages|Party vocale|Rappels automatiques/i)
      .first()
      .isVisible()
      .catch(() => false)

    expect(hasToggle || hasLabel).toBe(true)
  })

  test('F71b: Service worker is registered in the browser', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(3000) // Give SW time to register

    // Check if service worker is registered
    const swRegistered = await authenticatedPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration('/')
      return !!registration
    })
    // Service worker should be registered in production
    expect(swRegistered).toBe(true)
  })

  test('F71c: push_subscriptions table is queryable in DB', async ({ db }) => {
    const subs = await db.getPushSubscriptions()
    // The query must succeed (table exists and is accessible)
    expect(Array.isArray(subs)).toBe(true)

    // If subscriptions exist, validate their structure
    if (subs.length > 0) {
      expect(subs[0].endpoint).toBeTruthy()
      expect(subs[0].user_id).toBeTruthy()
    }
  })
})
