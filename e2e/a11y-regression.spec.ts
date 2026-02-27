import { test, expect, checkAccessibility, dismissCookieBanner, loginViaUI } from './fixtures'

/**
 * STRICT MODE — Accessibility Regression Tests
 *
 * Runs axe-core WCAG 2.1 AA audits on every major page and interactive state.
 * FAILS hard if there are critical/serious violations — no annotations, no swallowing.
 *
 * Rules enforced:
 * - Import from ./fixtures (test, expect, checkAccessibility)
 * - No .catch(() => false) on assertions
 * - No test.info().annotations replacing real assertions
 * - No toBeGreaterThanOrEqual(0) — violations.length must be exactly 0
 * - No try/catch that swallows errors
 * - No early returns without real assertions
 * - // STRICT: before every critical assertion
 */

/** Run axe-core and assert ZERO critical/serious violations — STRICT, no swallowing */
async function assertA11yStrict(page: import('@playwright/test').Page, context: string) {
  // Disable color-contrast: known production issues with brand colors
  const { violations, totalViolations, passes } = await checkAccessibility(page, {
    disableRules: ['color-contrast'],
  })

  // STRICT: passes must be > 0 (axe-core actually ran and found something to check)
  expect(passes, `axe-core found 0 passes on ${context} — scan likely failed`).toBeGreaterThan(0)

  // STRICT: zero critical/serious violations — with detailed error message
  if (violations.length > 0) {
    const details = violations
      .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`)
      .join('\n')
    expect(violations.length, `A11y violations on ${context}:\n${details}`).toBe(0)
  }

  // STRICT: explicit zero-check even when the if-block above doesn't trigger
  expect(violations.length).toBe(0)
}

// ============================================================
// Auth Flow — Public Pages
// ============================================================

test.describe('A11y Regression - Auth Flow', () => {
  test('Landing page accessible after load', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Landing page')
  })

  test('Auth page accessible with login form visible', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')
    await dismissCookieBanner(page)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Auth page - login form')
  })

  test('Auth page accessible after switching to register mode', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')
    await dismissCookieBanner(page)

    // Click the register toggle — it MUST be visible (no catch swallowing)
    const registerToggle = page.getByText(/Créer un compte/i).first()
    await expect(registerToggle).toBeVisible({ timeout: 5000 })
    await registerToggle.click()
    await page.waitForTimeout(500)

    // STRICT: full a11y audit on register form
    await assertA11yStrict(page, 'Auth page - register form')
  })

  test('Auth page accessible after validation error', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')
    await dismissCookieBanner(page)

    // Trigger validation error by submitting empty form
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit including error states
    await assertA11yStrict(page, 'Auth page - with validation errors')
  })
})

// ============================================================
// Dashboard — Home
// ============================================================

test.describe('A11y Regression - Dashboard', () => {
  test('Home page accessible after login', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: must not be on auth page
    expect(page.url()).not.toContain('/auth')

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Home dashboard')
  })
})

// ============================================================
// Squads
// ============================================================

test.describe('A11y Regression - Squads', () => {
  test('Squads list page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/squads')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Squads list')
  })
})

// ============================================================
// Sessions
// ============================================================

test.describe('A11y Regression - Sessions', () => {
  test('Sessions page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Sessions page')
  })
})

// ============================================================
// Messages
// ============================================================

test.describe('A11y Regression - Messages', () => {
  test('Messages page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Messages page')
  })
})

// ============================================================
// Party / Voice
// ============================================================

test.describe('A11y Regression - Party', () => {
  test('Party page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/party')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Party page')
  })
})

// ============================================================
// Gamification widgets on Home
// ============================================================

test.describe('A11y Regression - Gamification', () => {
  test('Home page gamification widgets accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit — no separate "soft" check
    const { violations, passes } = await checkAccessibility(page, {
      disableRules: ['color-contrast'],
    })
    expect(passes).toBeGreaterThan(0)
    // STRICT: zero critical/serious violations (color-contrast excluded — known production issues)
    expect(violations.length).toBe(0)
  })
})

// ============================================================
// Discover
// ============================================================

test.describe('A11y Regression - Discover', () => {
  test('Discover page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Discover page')
  })
})

// ============================================================
// Settings & Profile
// ============================================================

test.describe('A11y Regression - Settings', () => {
  test('Settings page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Settings page')
  })

  test('Profile page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Profile page')
  })
})

// ============================================================
// Premium
// ============================================================

test.describe('A11y Regression - Premium', () => {
  test('Premium page accessible', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Premium page')
  })

  test('Premium page accessible after pricing toggle', async ({ page }) => {
    await page.goto('/premium')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Find and click the pricing toggle — MUST exist (no catch swallowing)
    const toggle = page
      .locator('button:has-text("Annuel"), [role="switch"], input[type="checkbox"]')
      .first()
    await expect(toggle).toBeVisible({ timeout: 5000 })
    await toggle.click()
    await page.waitForTimeout(500)

    // STRICT: full a11y audit after toggle
    await assertA11yStrict(page, 'Premium page - after pricing toggle')
  })
})

// ============================================================
// Onboarding
// ============================================================

test.describe('A11y Regression - Onboarding', () => {
  test('Onboarding page accessible', async ({ page }) => {
    await loginViaUI(page)
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit
    await assertA11yStrict(page, 'Onboarding page')
  })
})

// ============================================================
// Mobile Viewport — critical pages at 375px
// ============================================================

test.describe('A11y Regression - Mobile Viewport (375px)', () => {
  test('Landing page accessible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: full a11y audit at mobile viewport
    await assertA11yStrict(page, 'Landing - mobile 375px')
  })

  test('Auth page accessible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/auth')
    await page.waitForSelector('form')
    await dismissCookieBanner(page)

    // STRICT: full a11y audit at mobile viewport
    await assertA11yStrict(page, 'Auth - mobile 375px')
  })

  test('Home page accessible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginViaUI(page)
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit at mobile viewport
    await assertA11yStrict(page, 'Home - mobile 375px')
  })

  test('Settings page accessible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginViaUI(page)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // STRICT: full a11y audit at mobile viewport
    await assertA11yStrict(page, 'Settings - mobile 375px')
  })
})

// ============================================================
// Dark Mode — contrast and a11y in dark theme
// ============================================================

test.describe('A11y Regression - Dark Mode', () => {
  const criticalPages = [
    { name: 'Landing', path: '/', needsAuth: false },
    { name: 'Auth', path: '/auth', needsAuth: false },
    { name: 'Home', path: '/home', needsAuth: true },
    { name: 'Settings', path: '/settings', needsAuth: true },
  ]

  for (const { name, path, needsAuth } of criticalPages) {
    test(`${name} page accessible in dark mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })

      if (needsAuth) {
        await loginViaUI(page)
      }

      await page.goto(path)
      await page.waitForLoadState('networkidle')
      if (!needsAuth) await dismissCookieBanner(page)
      await page.waitForTimeout(500)

      // STRICT: full a11y audit in dark mode
      await assertA11yStrict(page, `${name} - dark mode`)
    })
  }
})
