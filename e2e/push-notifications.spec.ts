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

    // Verify notification section exists with toggles
    const notifSection = authenticatedPage.locator('#notifications')
      .or(authenticatedPage.getByText(/Notification/i).first())
    await expect(notifSection).toBeVisible({ timeout: 10000 })

    // Verify at least one notification toggle is present
    const hasToggle = await authenticatedPage
      .locator('#notifications input[type="checkbox"], #notifications [role="switch"], [class*="notification"] input[type="checkbox"]')
      .first()
      .isVisible()
      .catch(() => false)
    const hasLabel = await authenticatedPage
      .getByText(/Sessions|Messages|Party|Rappels/i)
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
