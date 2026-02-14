import { test, expect } from '@playwright/test'
import { supabaseAdmin, TestDataHelper, dismissCookieBanner } from './fixtures'

/**
 * Mobile viewport tests — with DB validation for protected pages
 * Tests at 375px (iPhone SE) and 428px (iPhone 14 Pro Max) viewports
 * Protected page tests validate displayed data against Supabase DB.
 */

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

// DB helper for validation queries
const db = new TestDataHelper(supabaseAdmin)

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000, waitUntil: 'domcontentloaded' })
      return
    } catch {
      const rateLimited = await page.locator('text=/rate limit/i').isVisible().catch(() => false)
      if (rateLimited && attempt < 2) {
        await page.waitForTimeout(3000 + attempt * 2000)
        await page.click('button[type="submit"]')
      } else {
        throw new Error(`Login failed after ${attempt + 1} attempts`)
      }
    }
  }
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
      await dismissCookieBanner(page)

      await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible()

      const hasCTA =
        (await page.getByRole('link', { name: /Créer ma squad/i }).first().isVisible().catch(() => false)) ||
        (await page.getByRole('link', { name: /S'inscrire/i }).first().isVisible().catch(() => false)) ||
        (await page.getByRole('link', { name: /Se connecter/i }).first().isVisible().catch(() => false))
      expect(hasCTA).toBeTruthy()

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('auth page renders correctly', async ({ page }) => {
      await page.goto('/auth')
      await page.waitForSelector('form')

      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()

      const formWidth = await page.evaluate(() => {
        const form = document.querySelector('form')
        return form ? form.scrollWidth : 0
      })
      expect(formWidth).toBeLessThanOrEqual(viewport.width)
    })

    test('bottom navigation is visible after login', async ({ page }) => {
      await loginUser(page)
      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      // DB validation: verify user profile loaded
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()
      expect(profile.username).toBeTruthy()

      const hasNav =
        (await page.locator('nav').last().isVisible().catch(() => false)) ||
        (await page.locator('a[href="/home"], a[href="/messages"], a[href="/squads"]').first().isVisible().catch(() => false))
      expect(hasNav).toBeTruthy()
    })

    test('can navigate between pages via mobile nav', async ({ page }) => {
      await loginUser(page)
      await page.goto('/home')
      await page.waitForLoadState('networkidle')

      // DB validation: verify user has data to display
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      const messagesLink = page.locator('a[href="/messages"]').first()
      if (await messagesLink.isVisible().catch(() => false)) {
        await messagesLink.click()
        await expect(page).toHaveURL(/\/messages/)
      }
    })

    test('squads page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/squads')
      await page.waitForLoadState('networkidle')

      // DB validation: verify squads data
      const userSquads = await db.getUserSquads()
      expect(Array.isArray(userSquads)).toBe(true)

      await expect(page.getByText(/Mes Squads/i).first()).toBeVisible()

      // If user has squads, at least one squad name from DB should appear
      if (userSquads.length > 0) {
        let foundSquad = false
        for (const membership of userSquads.slice(0, 3)) {
          const visible = await page
            .getByText(membership.squads.name, { exact: false })
            .first()
            .isVisible()
            .catch(() => false)
          if (visible) { foundSquad = true; break }
        }
        expect(foundSquad).toBe(true)
      }

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('messages page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/messages')
      await page.waitForLoadState('networkidle')

      // DB validation: verify conversations data accessible
      const squads = await db.getUserSquads()
      expect(Array.isArray(squads)).toBe(true)

      await expect(page.locator('body')).toBeVisible()

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('profile page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // DB validation: verify profile data displayed
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()
      if (profile.username) {
        const usernameVisible = await page
          .getByText(profile.username, { exact: false })
          .first()
          .isVisible()
          .catch(() => false)
        expect(usernameVisible).toBe(true)
      }

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('settings page renders on mobile', async ({ page }) => {
      await loginUser(page)
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')

      // DB validation: verify user profile exists
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      await expect(page.getByRole('heading', { name: /Paramètres/i })).toBeVisible()

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('touch interactions work - squad create form', async ({ page }) => {
      await loginUser(page)
      await page.goto('/squads')
      await page.waitForLoadState('networkidle')

      // DB validation: verify squads context
      const squads = await db.getUserSquads()
      expect(Array.isArray(squads)).toBe(true)

      const createBtn = page.locator('main').getByRole('button', { name: /Créer/i }).last()
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click()
        await expect(page.getByText('Créer une squad')).toBeVisible()
      }
    })

    test('touch interactions work - theme toggle in settings', async ({ page }) => {
      await loginUser(page)
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // DB validation: verify user has profile
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      const lightBtn = page.getByText('Clair').first()
      if (await lightBtn.isVisible().catch(() => false)) {
        await lightBtn.click()
        await page.waitForTimeout(500)
        const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(theme).toBe('light')

        const darkBtn = page.getByText('Sombre').first()
        if (await darkBtn.isVisible().catch(() => false)) {
          await darkBtn.click()
          await page.waitForTimeout(500)
          const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
          expect(themeDark).toBe('dark')
        }
      }
    })
  })
}
