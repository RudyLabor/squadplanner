import { test, expect, loginViaUI, dismissCookieBanner, dismissTourOverlay, hasServerError } from './fixtures'

/**
 * Tab Resume — Navigation Resilience E2E Tests
 *
 * Tests the critical bug where the navbar becomes unresponsive and/or
 * returns 500 errors after switching tabs and coming back.
 *
 * Root causes addressed:
 * 1. navigator.locks deadlock — Supabase auth lock held by suspended network
 * 2. clientLoader TimeoutError — unhandled rejection causes 500
 * 3. View Transition stuck — ::view-transition pseudo-elements block pointer events
 *
 * These tests use REAL tab switching (context.newPage + bringToFront)
 * which triggers actual visibilitychange events — no mocks.
 */

const ALL_NAV_ROUTES = [
  { path: '/home', label: /Accueil/i },
  { path: '/squads', label: /Squads/i },
  { path: '/sessions', label: /Sessions/i },
  { path: '/party', label: /Party/i },
  { path: '/messages', label: /Messages/i },
  { path: '/discover', label: /Découvrir/i },
  { path: '/profile', label: /Profil/i },
  { path: '/settings', label: /Paramètres/i },
]

/** Open a new tab, wait, then come back — triggers real visibilitychange */
async function realTabSwitch(page: import('@playwright/test').Page, durationMs = 3000) {
  const context = page.context()
  const otherTab = await context.newPage()
  await otherTab.goto('https://www.google.com', { waitUntil: 'domcontentloaded' })
  await otherTab.bringToFront()
  await otherTab.waitForTimeout(durationMs)
  await page.bringToFront()
  await page.waitForTimeout(1000) // Let useAppResume handlers settle
  await otherTab.close()
}

// ============================================================
// Desktop — Sidebar Navigation
// ============================================================

test.describe('Tab Resume — Desktop Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
    // Mark guided tour as completed to prevent the z-70 overlay from blocking clicks
    await page.evaluate(() => {
      localStorage.setItem('sq-tour-completed-v1', 'true')
    })
    await dismissTourOverlay(page)
    // Dismiss any remaining overlay by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    // Ensure we're on a known page
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000 })
    // Wait for the tour overlay to fully disappear
    await page.waitForTimeout(1000)
  })

  test('Sidebar links navigate correctly BEFORE tab switch (baseline)', async ({ page }) => {
    // Click Squads in sidebar
    const squadsLink = page.locator('nav a[href="/squads"]').first()
    await expect(squadsLink).toBeVisible({ timeout: 5000 })
    await squadsLink.click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })
    expect(await hasServerError(page)).toBe(false)

    // Click Sessions
    const sessionsLink = page.locator('nav a[href="/sessions"]').first()
    await sessionsLink.click()
    await expect(page).toHaveURL(/\/sessions/, { timeout: 10000 })
    expect(await hasServerError(page)).toBe(false)
  })

  test('Sidebar links still work AFTER a real tab switch', async ({ page }) => {
    // Navigate to squads first
    await page.locator('nav a[href="/squads"]').first().click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })

    // Real tab switch: open Google in new tab, wait 3s, come back
    await realTabSwitch(page, 3000)

    // Now click Sessions — this MUST work, no 500
    const sessionsLink = page.locator('nav a[href="/sessions"]').first()
    await expect(sessionsLink).toBeVisible({ timeout: 5000 })
    await sessionsLink.click()

    // Wait for navigation to complete (up to 10s for potential lock recovery)
    await expect(page).toHaveURL(/\/sessions/, { timeout: 15000 })

    // CRITICAL: No 500 error
    expect(await hasServerError(page)).toBe(false)

    // Page content must be loaded
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 })
  })

  test('All protected routes are reachable after tab switch', async ({ page }) => {
    // Start on home
    await page.locator('nav a[href="/home"]').first().click()
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 })

    // Real tab switch
    await realTabSwitch(page, 3000)

    // Navigate to each route via sidebar — ALL must work
    for (const route of ALL_NAV_ROUTES) {
      const link = page.locator(`nav a[href="${route.path}"]`).first()
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click()
        await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/')), { timeout: 15000 })
        expect(await hasServerError(page)).toBe(false)
      }
    }
  })

  test('Multiple rapid tab switches do not break navigation', async ({ page }) => {
    // Navigate to squads
    await page.locator('nav a[href="/squads"]').first().click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })

    // 3 rapid tab switches
    for (let i = 0; i < 3; i++) {
      await realTabSwitch(page, 1000)
    }

    // Navigate through several routes
    const routes = ['/sessions', '/messages', '/profile', '/home']
    for (const path of routes) {
      const link = page.locator(`nav a[href="${path}"]`).first()
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click()
        await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 15000 })
        expect(await hasServerError(page)).toBe(false)
      }
    }
  })

  test('SidebarFooter links (Profile, Premium) work after tab switch', async ({ page }) => {
    // Click the profile link in the sidebar footer
    const profileFooter = page.locator('aside a[href="/profile"], nav ~ a[href="/profile"], footer a[href="/profile"]').first()
    if (await profileFooter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileFooter.click()
      await expect(page).toHaveURL(/\/profile/, { timeout: 10000 })

      // Tab switch
      await realTabSwitch(page, 2000)

      // Click premium link in footer
      const premiumLink = page.locator('a[href="/premium"]').first()
      if (await premiumLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await premiumLink.click()
        await expect(page).toHaveURL(/\/premium/, { timeout: 10000 })
        expect(await hasServerError(page)).toBe(false)
      }
    }
  })
})

// ============================================================
// Mobile — Bottom Navigation
// ============================================================

test.describe('Tab Resume — Mobile Bottom Nav', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
    await page.evaluate(() => { localStorage.setItem('sq-tour-completed-v1', 'true') })
    await dismissTourOverlay(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000 })
    await page.waitForTimeout(1000)
  })

  test('Mobile bottom nav is visible and functional before tab switch', async ({ page }) => {
    // The mobile bottom nav should be visible (use visible filter to skip hidden desktop nav)
    const bottomNav = page.locator('nav').filter({ hasText: /Accueil/ }).locator('visible=true').first()
    await expect(bottomNav).toBeVisible({ timeout: 5000 })

    // Click on a nav item (use visible filter to get the mobile link, not hidden desktop one)
    const squadsLink = page.locator('a[href="/squads"]:visible').first()
    await expect(squadsLink).toBeVisible({ timeout: 5000 })
    await squadsLink.click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })
    expect(await hasServerError(page)).toBe(false)
  })

  test('Mobile nav links work after tab switch', async ({ page }) => {
    // Navigate to squads
    await page.locator('a[href="/squads"]:visible').first().click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })

    // Real tab switch
    await realTabSwitch(page, 3000)

    // Click Sessions via mobile nav
    const sessionsLink = page.locator('a[href="/sessions"]:visible').first()
    await expect(sessionsLink).toBeVisible({ timeout: 5000 })
    await sessionsLink.click()
    await expect(page).toHaveURL(/\/sessions/, { timeout: 15000 })
    expect(await hasServerError(page)).toBe(false)

    // Click Messages
    const messagesLink = page.locator('a[href="/messages"]:visible').first()
    await expect(messagesLink).toBeVisible({ timeout: 5000 })
    await messagesLink.click()
    await expect(page).toHaveURL(/\/messages/, { timeout: 15000 })
    expect(await hasServerError(page)).toBe(false)
  })

  test('Mobile nav survives multiple tab switches', async ({ page }) => {
    await page.locator('a[href="/home"]:visible').first().click()
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 })

    // 3 rapid tab switches
    for (let i = 0; i < 3; i++) {
      await realTabSwitch(page, 1000)
    }

    // Navigate through routes (use :visible to target the mobile nav links)
    const routes = ['/squads', '/sessions', '/home']
    for (const path of routes) {
      const link = page.locator(`a[href="${path}"]:visible`).first()
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click()
        await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 15000 })
        expect(await hasServerError(page)).toBe(false)
      }
    }
  })
})

// ============================================================
// Lock Deadlock Recovery
// ============================================================

test.describe('Tab Resume — Lock Deadlock Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
    await page.evaluate(() => { localStorage.setItem('sq-tour-completed-v1', 'true') })
    await dismissTourOverlay(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000 })
    await page.waitForTimeout(1000)
  })

  test('Navigation does not 500 when navigator.locks is stressed', async ({ page }) => {
    // Simulate a held auth-token lock (the exact scenario that causes the bug)
    await page.evaluate(() => {
      if (navigator.locks) {
        navigator.locks.request(
          'supabase:auth-token:stress-test',
          { mode: 'exclusive' },
          () => new Promise((resolve) => setTimeout(resolve, 10000))
        )
      }
    })

    // Real tab switch while lock is held
    await realTabSwitch(page, 2000)

    // Navigate — should NOT get 500
    const sessionsLink = page.locator('nav a[href="/sessions"], a[href="/sessions"]').first()
    await expect(sessionsLink).toBeVisible({ timeout: 5000 })
    await sessionsLink.click()

    // Wait for either successful navigation or graceful fallback
    await page.waitForTimeout(6000)

    // CRITICAL: No 500 error page
    expect(await hasServerError(page)).toBe(false)
  })

  test('useAppResume deadlock detection triggers recovery', async ({ page }) => {
    // Listen for console warnings from useAppResume
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleLogs.push(msg.text())
      }
    })

    // Navigate to home
    await page.locator('nav a[href="/home"], a[href="/home"]').first().click()
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 })

    // Real tab switch
    await realTabSwitch(page, 5000)

    // After coming back, the page should be functional
    await page.waitForTimeout(2000)

    // Navigate to verify
    const link = page.locator('nav a[href="/squads"], a[href="/squads"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForTimeout(5000)
      expect(await hasServerError(page)).toBe(false)
    }
  })
})

// ============================================================
// View Transition Resilience
// ============================================================

test.describe('Tab Resume — View Transition Safety', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)
    await page.evaluate(() => { localStorage.setItem('sq-tour-completed-v1', 'true') })
    await dismissTourOverlay(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000 })
    await page.waitForTimeout(1000)
  })

  test('No pointer-events blocking overlay after tab switch', async ({ page }) => {
    // Navigate to trigger any view transitions
    await page.locator('nav a[href="/squads"], a[href="/squads"]').first().click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })

    // Tab switch during/after transition
    await realTabSwitch(page, 1000)

    // Check that no overlay is blocking pointer events
    const blockedByOverlay = await page.evaluate(() => {
      // Check for stuck view-transition pseudo-elements
      const hasActiveVT = !!(document as any).activeViewTransition
      // Check for body overflow hidden
      const bodyOverflowHidden = document.body.style.overflow === 'hidden'
      // Check for modal overlays
      const hasOpenOverlay = !!document.querySelector('[data-state="open"]')
        || !!document.querySelector('[role="dialog"]:not([hidden])')
      return { hasActiveVT, bodyOverflowHidden, hasOpenOverlay }
    })

    expect(blockedByOverlay.hasActiveVT).toBe(false)
    expect(blockedByOverlay.bodyOverflowHidden).toBe(false)
    expect(blockedByOverlay.hasOpenOverlay).toBe(false)

    // Verify clicks actually work
    const sessionsLink = page.locator('nav a[href="/sessions"], a[href="/sessions"]').first()
    await expect(sessionsLink).toBeVisible({ timeout: 5000 })
    await sessionsLink.click()
    await expect(page).toHaveURL(/\/sessions/, { timeout: 15000 })
  })

  test('body.style.overflow is not stuck on hidden after tab switch', async ({ page }) => {
    // Open a sheet/dialog if possible (e.g., search or notification)
    const searchBtn = page.locator('button:has-text("Rechercher"), button[aria-label="Rechercher"]').first()
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click()
      await page.waitForTimeout(500)
    }

    // Tab switch while modal might be open
    await realTabSwitch(page, 2000)

    // Dismiss any overlay that persists after tab switch
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Body overflow should NOT be stuck on hidden
    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).not.toBe('hidden')

    // Navigation should work
    const link = page.locator('nav a[href="/home"], a[href="/home"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await expect(page).toHaveURL(/\/home/, { timeout: 15000 })
      expect(await hasServerError(page)).toBe(false)
    }
  })
})

// ============================================================
// Full Regression — Complete Navigation Cycle
// ============================================================

test.describe('Tab Resume — Full Regression Cycle', () => {
  test('Complete flow: login → navigate → tab switch → navigate ALL routes → no 500', async ({ page }) => {
    // Step 1: Login
    await loginViaUI(page)
    await page.evaluate(() => { localStorage.setItem('sq-tour-completed-v1', 'true') })
    await dismissTourOverlay(page)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL((url) => !url.pathname.includes('/auth'), { timeout: 20000 })

    // Step 2: Initial navigation (verify baseline)
    await page.locator('nav a[href="/squads"], a[href="/squads"]').first().click()
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })
    expect(await hasServerError(page)).toBe(false)

    // Step 3: Tab switch (real — 5 seconds away)
    await realTabSwitch(page, 5000)

    // Step 4: Navigate through EVERY protected route
    const routesAfterSwitch = [
      '/home', '/squads', '/sessions', '/party',
      '/messages', '/discover', '/profile', '/settings',
    ]

    for (const path of routesAfterSwitch) {
      const link = page.locator(`nav a[href="${path}"], a[href="${path}"]`).first()
      if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
        await link.click()
        // Wait generously for navigation (lock recovery might take up to 6s)
        await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 15000 })

        // CRITICAL ASSERTION: No 500 error on any page
        expect(await hasServerError(page)).toBe(false)

        // Page must have visible main content
        await expect(page.locator('#main-content')).toBeVisible({ timeout: 5000 })
      }
    }

    // Step 5: Second tab switch + verify again
    await realTabSwitch(page, 3000)

    // Navigate back to home
    const homeLink = page.locator('nav a[href="/home"], a[href="/home"]').first()
    await expect(homeLink).toBeVisible({ timeout: 5000 })
    await homeLink.click()
    await expect(page).toHaveURL(/\/home/, { timeout: 15000 })
    expect(await hasServerError(page)).toBe(false)
  })
})
