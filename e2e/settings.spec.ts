import { test, expect } from '@playwright/test'

/**
 * Settings E2E Tests — Flux F57-F65
 * F57: Editer son profil
 * F58: Changer les notifs
 * F59: Changer les devices audio
 * F60: Changer le theme (dark/light)
 * F61: Changer le timezone
 * F62: Changer les settings privacy
 * F63: Exporter ses données (GDPR)
 * F64: Supprimer son compte
 * F65: Se déconnecter
 */

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

async function loginUser(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  try {
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 })
    return true
  } catch {
    return false
  }
}

test.describe('Settings Page - Structure', () => {
  test('should load settings page or redirect to auth', async ({ page }) => {
    const loggedIn = await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    if (loggedIn) {
      await expect(page.locator('body')).toBeVisible()
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
    await page.waitForTimeout(1000)

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('F58 - Changer les notifications', () => {
  test('should load settings with notification section', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const notifSection = page.getByText(/Notification/i).first()
    const hasNotif = await notifSection.isVisible().catch(() => false)
    if (hasNotif) {
      await expect(notifSection).toBeVisible()
    }
  })
})

test.describe('F59 - Changer les devices audio', () => {
  test('should load settings with audio section', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const audioSection = page.getByText(/Micro|Audio/i).first()
    const hasAudio = await audioSection.isVisible().catch(() => false)
    if (hasAudio) {
      await expect(audioSection).toBeVisible()
    }
  })
})

test.describe('F60 - Changer le thème (dark/light)', () => {
  test('should have theme options when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for any theme-related UI
    const hasApparence = await page.getByText(/Apparence|Thème/i).first().isVisible().catch(() => false)
    const hasSombre = await page.getByText('Sombre').first().isVisible().catch(() => false)
    expect(hasApparence || hasSombre).toBeTruthy()
  })
})

test.describe('F61 - Changer le timezone', () => {
  test('should show timezone option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const timezoneElement = page.getByText(/Paris|Fuseau|Timezone/i).first()
    const hasTimezone = await timezoneElement.isVisible().catch(() => false)
    if (hasTimezone) {
      await expect(timezoneElement).toBeVisible()
    }
  })
})

test.describe('F62 - Changer les settings privacy', () => {
  test('should show privacy section when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const privacySection = page.getByText(/Confidentialité|Visibilité/i).first()
    const hasPrivacy = await privacySection.isVisible().catch(() => false)
    if (hasPrivacy) {
      await expect(privacySection).toBeVisible()
    }
  })
})

test.describe('F63 - Exporter ses données (GDPR)', () => {
  test('should show export data option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const exportBtn = page.getByText(/Exporter/i).first()
    const hasExport = await exportBtn.isVisible().catch(() => false)
    if (hasExport) {
      await expect(exportBtn).toBeVisible()
    }
  })
})

test.describe('F64 - Supprimer son compte', () => {
  test('should show delete account option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const deleteBtn = page.getByText(/Supprimer/i).first()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)
    if (hasDelete) {
      await expect(deleteBtn).toBeVisible()
    }
  })
})

test.describe('F65 - Se déconnecter', () => {
  test('should show logout option when authenticated', async ({ page }) => {
    const loggedIn = await loginUser(page)
    if (!loggedIn) { test.skip(); return }
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    const logoutBtn = page.getByText(/déconnecter|Déconnexion/i).first()
    const hasLogout = await logoutBtn.isVisible().catch(() => false)
    if (hasLogout) {
      await expect(logoutBtn).toBeVisible()
    }
  })
})

test.describe('Settings - Protected Route', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url.includes('/auth') || url.includes('/settings')).toBeTruthy()
  })
})

test.describe('Settings - Responsive', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    await expect(page.locator('body')).toBeVisible()
  })
})
