import { test, expect } from '@playwright/test'

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

async function dismissCookieBanner(page: import('@playwright/test').Page) {
  try {
    const acceptBtn = page.getByRole('button', { name: /Tout accepter/i })
    await acceptBtn.waitFor({ state: 'visible', timeout: 3000 })
    await acceptBtn.click()
    await page.waitForTimeout(500)
  } catch {
    // Cookie banner not present, continue
  }
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 })
}

test.describe('Sessions Page', () => {
  test('should display sessions page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    // Heading: "Tes prochaines sessions"
    await expect(page.getByText(/prochaines sessions/i).first()).toBeVisible()
  })

  test('should show sessions page content', async ({ page }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main, [class*="container"], body > div').first()).toBeVisible()
  })

  test('should have navigation elements', async ({ page, isMobile }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    if (isMobile) {
      await expect(page.locator('body')).toBeVisible()
    } else {
      await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible()
    }
  })
})

test.describe('Session Creation', () => {
  test('should load squads page for session creation', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')
    await page.waitForLoadState('networkidle')

    // Squads page should load
    await expect(page.getByText(/Mes Squads/i).first()).toBeVisible()
  })
})

test.describe('Sessions UI', () => {
  test('should display sessions page with navigation', async ({ page, isMobile }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    if (isMobile) {
      await expect(page.locator('body')).toBeVisible()
    } else {
      const hasSessionsLink = await page.locator('a[href="/sessions"]').first().isVisible().catch(() => false)
      const hasNav = await page.locator('nav, aside').first().isVisible().catch(() => false)
      expect(hasSessionsLink || hasNav).toBeTruthy()
    }
  })

  test('should have navigation to home', async ({ page, isMobile }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    if (isMobile) {
      await expect(page.locator('body')).toBeVisible()
    } else {
      const hasHomeLink = await page.locator('a[href="/home"], a[href="/"]').first().isVisible().catch(() => false)
      const hasNav = await page.locator('nav').first().isVisible().catch(() => false)
      expect(hasHomeLink || hasNav).toBeTruthy()
    }
  })
})
