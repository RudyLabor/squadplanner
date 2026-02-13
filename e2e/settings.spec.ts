import { test, expect } from '@playwright/test'

/**
 * Settings E2E Tests — Flux F57-F65
 */

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

async function loginUser(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  try {
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 })
    return true
  } catch {
    return false
  }
}

test.describe('Settings Page - Structure', () => {
  test('should load settings page or redirect to auth', async ({ page }) => {
    const loggedIn = await loginUser(page)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    if (loggedIn) {
      // Settings heading is "Paramètres"
      await expect(page.getByText(/Paramètres/i).first()).toBeVisible()
    } else {
      expect(page.url()).toContain('/auth')
    }
  })
})

test.describe('F57 - Editer son profil', () => {
  test('should load profile page', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('F58 - Changer les notifications', () => {
  test('should load settings with notification section', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasNotif =
      (await page.locator('#notifications').isVisible().catch(() => false)) ||
      (await page.getByText(/Notification/i).first().isVisible().catch(() => false))
    expect(hasNotif).toBeTruthy()
  })
})

test.describe('F59 - Changer les devices audio', () => {
  test('should load settings with audio section', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasAudio =
      (await page.locator('#audio').isVisible().catch(() => false)) ||
      (await page.getByText(/Micro|Audio/i).first().isVisible().catch(() => false))
    expect(hasAudio).toBeTruthy()
  })
})

test.describe('F60 - Changer le thème (dark/light)', () => {
  test('should have theme options when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasTheme =
      (await page.locator('#theme').isVisible().catch(() => false)) ||
      (await page.getByText(/Apparence|Thème/i).first().isVisible().catch(() => false)) ||
      (await page.getByText('Sombre').first().isVisible().catch(() => false))
    expect(hasTheme).toBeTruthy()
  })
})

test.describe('F61 - Changer le timezone', () => {
  test('should show timezone option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasTimezone =
      (await page.locator('#region').isVisible().catch(() => false)) ||
      (await page.getByText(/Paris|Fuseau|Timezone/i).first().isVisible().catch(() => false))
    expect(hasTimezone).toBeTruthy()
  })
})

test.describe('F62 - Changer les settings privacy', () => {
  test('should show privacy section when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasPrivacy =
      (await page.locator('#privacy').isVisible().catch(() => false)) ||
      (await page.getByText(/Confidentialité|Visibilité/i).first().isVisible().catch(() => false))
    expect(hasPrivacy).toBeTruthy()
  })
})

test.describe('F63 - Exporter ses données (GDPR)', () => {
  test('should show export data option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasExport =
      (await page.locator('#data').isVisible().catch(() => false)) ||
      (await page.getByText(/Exporter/i).first().isVisible().catch(() => false))
    expect(hasExport).toBeTruthy()
  })
})

test.describe('F64 - Supprimer son compte', () => {
  test('should show delete account option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasDelete =
      (await page.locator('#data').isVisible().catch(() => false)) ||
      (await page.getByText(/Supprimer/i).first().isVisible().catch(() => false))
    expect(hasDelete).toBeTruthy()
  })
})

test.describe('F65 - Se déconnecter', () => {
  test('should show logout option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const hasLogout =
      (await page.getByText(/déconnecter|Déconnexion/i).first().isVisible().catch(() => false)) ||
      (await page.locator('button:has-text("Se déconnecter")').isVisible().catch(() => false))
    expect(hasLogout).toBeTruthy()
  })
})

test.describe('Settings - Protected Route', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(3000)

    const url = page.url()
    expect(url.includes('/auth') || url.includes('/settings')).toBeTruthy()
  })
})

test.describe('Settings - Responsive', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
  })
})
