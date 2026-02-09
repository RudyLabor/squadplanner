import { test, expect } from '@playwright/test'

/**
 * Mobile viewport tests
 * Tests at 375px (iPhone SE) and 428px (iPhone 14 Pro Max) viewports
 * Verifies mobile navigation, bottom nav, and key interactions
 */

const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!'
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

const mobileViewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926 },
]

for (const viewport of mobileViewports) {
  test.describe(`Mobile ${viewport.name} (${viewport.width}px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    })

    test('landing page renders correctly', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Main heading should be visible
      await expect(page.getByText(/Transforme tes/i)).toBeVisible()

      // CTA links should be visible
      await expect(page.getByRole('link', { name: /J'ai déjà un compte/i }).first()).toBeVisible()

      // Content should not overflow horizontally
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1)
    })

    test('auth page renders correctly', async ({ page }) => {
      await page.goto('/auth')
      await page.waitForSelector('form')

      await expect(page.getByLabel(/Email/i)).toBeVisible()
      await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()

      // Form should fit within viewport
      const formWidth = await page.evaluate(() => {
        const form = document.querySelector('form')
        return form ? form.scrollWidth : 0
      })
      expect(formWidth).toBeLessThanOrEqual(viewport.width)
    })

    test('bottom navigation is visible after login', async ({ page }) => {
      await loginUser(page)
      await page.goto('/home')

      // Look for bottom/mobile navigation bar
      const bottomNav = page.locator('nav[class*="bottom"], nav[class*="mobile"], [class*="bottom-nav"], [class*="mobile-nav"], nav').last()
      await expect(bottomNav).toBeVisible()
    })

    test('can navigate between pages via mobile nav', async ({ page }) => {
      await loginUser(page)
      await page.goto('/home')

      // Try navigating to messages via the bottom nav link
      const messagesLink = page.locator('a[href="/messages"]').first()
      if (await messagesLink.isVisible()) {
        await messagesLink.click()
        await expect(page).toHaveURL(/\/messages/)
      }

      // Try navigating to profile
      const profileLink = page.locator('a[href="/profile"]').first()
      if (await profileLink.isVisible()) {
        await profileLink.click()
        await expect(page).toHaveURL(/\/profile/)
      }
    })

    test('squads page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/squads')

      await expect(page.getByRole('heading', { name: /Mes Squads/i })).toBeVisible()

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1)
    })

    test('messages page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/messages')

      await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible()

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1)
    })

    test('profile page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/profile')

      // Profile page should load
      await expect(page.locator('body')).toBeVisible()

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1)
    })

    test('settings page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/settings')

      // Settings should show Apparence section
      await expect(page.getByText(/Apparence/i)).toBeVisible()

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 1)
    })

    test('touch interactions work - squad create form', async ({ page }) => {
      await loginUser(page)
      await page.goto('/squads')

      // Tap the create button
      const createBtn = page.getByRole('button', { name: /Créer/i }).first()
      if (await createBtn.isVisible()) {
        await createBtn.tap()
        await expect(page.getByText('Créer une squad')).toBeVisible()
      }
    })

    test('touch interactions work - theme toggle in settings', async ({ page }) => {
      await loginUser(page)
      await page.goto('/settings')

      // Tap "Clair" to switch to light mode
      const lightBtn = page.getByText('Clair')
      if (await lightBtn.isVisible()) {
        await lightBtn.tap()
        const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(theme).toBe('light')

        // Tap "Sombre" to switch back
        await page.getByText('Sombre').tap()
        const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(themeDark).toBe('dark')
      }
    })
  })
}
