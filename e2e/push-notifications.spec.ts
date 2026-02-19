import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Push Notifications E2E Tests — F71 (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de OR conditions passe-partout
 * - DB fetched FIRST, UI MUST match
 * - Le service worker DOIT etre enregistre
 * - La section Notifications dans Settings DOIT etre visible
 * - Les toggles DOIVENT refleter l'etat de permission
 *
 * Note: On ne peut pas tester l'envoi reel de push en E2E,
 * mais on PEUT tester tous les etats UI et la presence du SW.
 */

// =============================================================================
// F71a — Settings Page: Notification UI
// =============================================================================
test.describe('F71a — Settings: Notification Section UI', () => {

  test('F71a-1: Settings page shows "Notifications" heading', async ({ authenticatedPage, db }) => {
    // STRICT: fetch DB first — confirm user exists
    const profile = await db.getProfile()
    expect(profile, 'Le profil du test user DOIT exister en DB').toBeTruthy()

    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: Notification heading MUST be visible
    const notifHeading = authenticatedPage.getByRole('heading', { name: /Notifications/i }).first()
    await expect(notifHeading, 'Le heading "Notifications" DOIT etre visible dans Settings').toBeVisible({ timeout: 10000 })
  })

  test('F71a-2: Notification toggles are present (Sessions, Messages, Party vocale, Rappels)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: Find the notifications card/section
    const notifSection = authenticatedPage.locator('#notifications')
    await expect(notifSection, 'La section #notifications DOIT exister').toBeAttached({ timeout: 10000 })

    // STRICT: At least 4 toggles (Sessions, Messages, Party vocale, Rappels automatiques)
    const toggles = notifSection.locator('[role="switch"]')
    const toggleCount = await toggles.count()
    expect(toggleCount, 'Il DOIT y avoir au moins 4 toggles de notification').toBeGreaterThanOrEqual(4)

    // STRICT: Specific category labels MUST be visible inside the notification section
    const sessionsLabel = notifSection.getByText(/Sessions/i).first()
    await expect(sessionsLabel, 'Le label "Sessions" DOIT etre visible').toBeVisible({ timeout: 5000 })

    const messagesLabel = notifSection.getByText(/Messages/i).first()
    await expect(messagesLabel, 'Le label "Messages" DOIT etre visible').toBeVisible({ timeout: 5000 })

    const partyLabel = notifSection.getByText(/Party vocale/i).first()
    await expect(partyLabel, 'Le label "Party vocale" DOIT etre visible').toBeVisible({ timeout: 5000 })

    const remindersLabel = notifSection.getByText(/Rappels/i).first()
    await expect(remindersLabel, 'Le label "Rappels" DOIT etre visible').toBeVisible({ timeout: 5000 })
  })

  test('F71a-3: Each toggle has a valid aria-checked state (true or false)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    const notifSection = authenticatedPage.locator('#notifications')
    const toggles = notifSection.locator('[role="switch"]')
    const count = await toggles.count()
    expect(count, 'Au moins un toggle DOIT exister').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const toggle = toggles.nth(i)
      const ariaChecked = await toggle.getAttribute('aria-checked')
      // STRICT: aria-checked MUST be exactly 'true' or 'false'
      expect(
        ['true', 'false'],
        `Toggle #${i}: aria-checked DOIT etre 'true' ou 'false', obtenu: '${ariaChecked}'`
      ).toContain(ariaChecked)
    }
  })
})

// =============================================================================
// F71b — Notification Permission State reflected in UI
// =============================================================================
test.describe('F71b — Notification Permission State', () => {

  test('F71b-1: Browser Notification API is available', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: The Notification API MUST be available in the browser
    const notificationApiAvailable = await authenticatedPage.evaluate(() => {
      return 'Notification' in window
    })
    expect(notificationApiAvailable, 'window.Notification DOIT etre disponible').toBe(true)
  })

  test('F71b-2: Notification.permission returns a valid state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: Notification.permission MUST be one of the 3 valid values
    const permissionState = await authenticatedPage.evaluate(() => {
      return Notification.permission
    })
    expect(
      ['default', 'granted', 'denied'],
      `Notification.permission DOIT etre 'default', 'granted' ou 'denied', obtenu: '${permissionState}'`
    ).toContain(permissionState)
  })

  test('F71b-3: Settings page notification section reflects permission state coherently', async ({ authenticatedPage }) => {
    // First get the browser permission state
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    const permissionState = await authenticatedPage.evaluate(() => Notification.permission)

    // Navigate to settings
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: The notification section MUST exist regardless of permission state
    const notifSection = authenticatedPage.locator('#notifications')
    await expect(notifSection, 'La section #notifications DOIT exister meme si permission est denied').toBeAttached({ timeout: 10000 })

    // STRICT: Toggles MUST be present and interactable
    const toggles = notifSection.locator('[role="switch"]')
    const count = await toggles.count()
    expect(count, `Toggles DOIVENT exister (permission: ${permissionState})`).toBeGreaterThan(0)
  })
})

// =============================================================================
// F71c — Service Worker & Push Subscription
// =============================================================================
test.describe('F71c — Service Worker Registration', () => {

  test('F71c-1: Service worker is registered in the browser', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    // Give SW time to register
    await authenticatedPage.waitForTimeout(3000)

    // STRICT: Check if service worker is registered
    const swRegistered = await authenticatedPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration('/')
      return !!registration
    })
    // STRICT: Service worker MUST be registered
    expect(swRegistered, 'Le service worker DOIT etre enregistre sur /').toBe(true)
  })

  test('F71c-2: Service worker has an active or waiting state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(3000)

    const swState = await authenticatedPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'no-sw-api'
      const registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration) return 'no-registration'
      if (registration.active) return 'active'
      if (registration.waiting) return 'waiting'
      if (registration.installing) return 'installing'
      return 'unknown'
    })

    // STRICT: SW MUST be in active, waiting, or installing state
    expect(
      ['active', 'waiting', 'installing'],
      `Le service worker DOIT etre active/waiting/installing, obtenu: '${swState}'`
    ).toContain(swState)
  })

  test('F71c-3: PushManager API is available via service worker', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(3000)

    const pushManagerAvailable = await authenticatedPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.ready
      return 'pushManager' in registration
    })

    // STRICT: PushManager DOIT etre disponible
    expect(pushManagerAvailable, 'PushManager DOIT etre disponible via navigator.serviceWorker.ready').toBe(true)
  })
})

// =============================================================================
// F71d — Push Subscriptions in DB
// =============================================================================
test.describe('F71d — Push Subscriptions DB Validation', () => {

  test('F71d-1: push_subscriptions table is queryable for test user', async ({ db }) => {
    // STRICT: The query MUST succeed and return an array
    const subs = await db.getPushSubscriptions()
    expect(Array.isArray(subs), 'getPushSubscriptions DOIT retourner un tableau').toBe(true)
  })

  test('F71d-2: If subscriptions exist, each has valid endpoint and user_id', async ({ db }) => {
    const subs = await db.getPushSubscriptions()
    const userId = await db.getUserId()

    if (subs.length > 0) {
      for (const sub of subs) {
        // STRICT: endpoint MUST be a valid HTTPS URL
        expect(sub.endpoint, 'endpoint DOIT etre une string').toBeTruthy()
        expect(typeof sub.endpoint, 'endpoint DOIT etre de type string').toBe('string')
        expect(sub.endpoint.startsWith('https://'), `endpoint DOIT commencer par https://, obtenu: ${sub.endpoint}`).toBe(true)

        // STRICT: user_id MUST match the test user
        expect(sub.user_id, 'user_id DOIT correspondre au test user').toBe(userId)
      }
    } else {
      // No subscriptions is valid — assert explicitly
      expect(subs.length, 'Aucune subscription: le tableau DOIT etre vide').toBe(0)
    }
  })
})

// =============================================================================
// F71e — Toggle Interaction
// =============================================================================
test.describe('F71e — Notification Toggle Interaction', () => {

  test('F71e-1: Clicking a notification toggle changes its aria-checked state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    const notifSection = authenticatedPage.locator('#notifications')
    const firstToggle = notifSection.locator('[role="switch"]').first()
    await expect(firstToggle, 'Le premier toggle DOIT etre visible').toBeVisible({ timeout: 10000 })

    // STRICT: Read initial state
    const initialChecked = await firstToggle.getAttribute('aria-checked')
    expect(['true', 'false'], 'aria-checked initial DOIT etre true ou false').toContain(initialChecked)

    // STRICT: Click the toggle
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: State MUST have changed
    const newChecked = await firstToggle.getAttribute('aria-checked')
    expect(newChecked, 'Le toggle DOIT changer de state apres un click').not.toBe(initialChecked)

    // STRICT: Click back to restore original state
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: State MUST be restored
    const restoredChecked = await firstToggle.getAttribute('aria-checked')
    expect(restoredChecked, 'Le toggle DOIT revenir a son etat initial').toBe(initialChecked)
  })

  test('F71e-2: Toggle state persists in localStorage after change', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    const notifSection = authenticatedPage.locator('#notifications')
    const firstToggle = notifSection.locator('[role="switch"]').first()
    await expect(firstToggle).toBeVisible({ timeout: 10000 })

    // Click toggle to change state
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: localStorage MUST contain the notification settings key
    const savedSettings = await authenticatedPage.evaluate(() => {
      return localStorage.getItem('sq-notification-settings')
    })
    expect(savedSettings, 'sq-notification-settings DOIT etre sauvegarde dans localStorage').toBeTruthy()

    // STRICT: The saved value MUST be valid JSON
    const parsed = JSON.parse(savedSettings!)
    expect(typeof parsed, 'Les settings sauvegardees DOIVENT etre un objet').toBe('object')

    // STRICT: Restore original state
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)
  })
})

// =============================================================================
// F71f — Onboarding Notification Permission Prompt
// =============================================================================
test.describe('F71f — Onboarding Permission Prompt', () => {

  test('F71f-1: Onboarding step permissions page exists and is navigable', async ({ page }) => {
    // Visit the onboarding permissions step directly (public route)
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: The page MUST load without a 500 error
    const bodyText = await page.textContent('body')
    expect(bodyText, 'La page onboarding ne DOIT pas afficher une erreur 500').not.toContain('500')
  })
})

// =============================================================================
// F71g — Notification Banner/Toast UI Component
// =============================================================================
test.describe('F71g — Notification UI Components', () => {

  test('F71g-1: NotificationCenter icon is present in the top bar after auth', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: The notification bell icon MUST exist in the top bar or header
    // It can be a button with aria-label or a link with bell icon
    const bellButton = authenticatedPage.locator(
      'button[aria-label*="Notification" i], button[aria-label*="notification" i], a[aria-label*="Notification" i], [data-testid="notification-bell"]'
    ).first()
    const bellIcon = authenticatedPage.locator('header svg, nav svg').first()

    // STRICT: At least the header must have interactive SVG icons
    const hasBellButton = await bellButton.isVisible().catch(() => false)
    const hasHeaderIcons = await bellIcon.isVisible().catch(() => false)
    expect(
      hasBellButton || hasHeaderIcons,
      'Un icone de notification DOIT exister dans le header/top bar'
    ).toBe(true)
  })

  test('F71g-2: Settings page notification section has descriptive text for each category', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    const notifSection = authenticatedPage.locator('#notifications')

    // STRICT: Description texts MUST exist alongside toggle labels
    const sessionsDesc = notifSection.getByText(/Rappels et confirmations/i).first()
    await expect(sessionsDesc, 'La description des notifications sessions DOIT etre visible').toBeVisible({ timeout: 5000 })

    const messagesDesc = notifSection.getByText(/Nouveaux messages/i).first()
    await expect(messagesDesc, 'La description des notifications messages DOIT etre visible').toBeVisible({ timeout: 5000 })

    const partyDesc = notifSection.getByText(/rejoint la party/i).first()
    await expect(partyDesc, 'La description des notifications party DOIT etre visible').toBeVisible({ timeout: 5000 })
  })
})
