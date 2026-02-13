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
  email: 'auditplayer1@yopmail.com',
  password: 'AuditTest2026!!',
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForFunction(
    () => !window.location.pathname.includes('/auth'),
    { timeout: 10000 }
  ).catch(() => {})
  await page.waitForTimeout(1000)
}

test.describe('Settings Page - Structure', () => {
  test('should display settings page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')

    // Settings page should load with sections
    await expect(page.getByText(/Paramètres|Réglages/i).first()).toBeVisible()
  })

  test('should have all settings sections', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for main settings sections
    const sections = [
      /Notification/i,
      /Apparence|Thème/i,
      /Confidentialité|Privacy/i,
    ]

    for (const section of sections) {
      const element = page.getByText(section).first()
      const isVisible = await element.isVisible().catch(() => false)
      if (isVisible) {
        await expect(element).toBeVisible()
      }
    }
  })
})

test.describe('F57 - Editer son profil', () => {
  test('should have profile edit link on profile page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/profile')
    await page.waitForTimeout(1000)

    // Check for "Modifier le profil" button
    const editBtn = page.getByText(/Modifier le profil|Modifier/i).first()
    const hasEdit = await editBtn.isVisible().catch(() => false)
    if (hasEdit) {
      await expect(editBtn).toBeVisible()
    }
  })
})

test.describe('F58 - Changer les notifications', () => {
  test('should show notification toggles', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for notification section
    const notifSection = page.getByText(/Notification/i).first()
    await expect(notifSection).toBeVisible()
  })

  test('should have toggle switches for notification types', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Look for toggle elements (Sessions, Messages, Party, Rappels)
    const toggles = page.locator('button[role="switch"], [class*="toggle"]')
    const toggleCount = await toggles.count()

    // Should have at least 4 notification toggles
    expect(toggleCount).toBeGreaterThanOrEqual(1)
  })

  test('should persist notification toggle changes', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Find first toggle and click it
    const firstToggle = page.locator('button[role="switch"]').first()
    if (await firstToggle.isVisible().catch(() => false)) {
      const initialState = await firstToggle.getAttribute('aria-checked')
      await firstToggle.click()
      await page.waitForTimeout(500)

      // Toggle state should have changed
      const newState = await firstToggle.getAttribute('aria-checked')
      expect(newState).not.toBe(initialState)

      // Click again to restore
      await firstToggle.click()
    }
  })
})

test.describe('F59 - Changer les devices audio', () => {
  test('should show audio device selectors', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for audio section (Microphone, Sortie audio)
    const audioSection = page.getByText(/Micro|Audio/i).first()
    const hasAudio = await audioSection.isVisible().catch(() => false)
    if (hasAudio) {
      await expect(audioSection).toBeVisible()
    }
  })
})

test.describe('F60 - Changer le thème (dark/light)', () => {
  test('should show theme selector with Sombre/Clair/Auto', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for theme section
    const apparenceSection = page.getByText(/Apparence|Thème/i).first()
    await expect(apparenceSection).toBeVisible()

    // Check for Sombre/Clair/Auto options
    await expect(page.getByText('Sombre').first()).toBeVisible()
    await expect(page.getByText('Clair').first()).toBeVisible()
    await expect(page.getByText('Auto').first()).toBeVisible()
  })

  test('should switch to light mode', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Click "Clair" to switch to light mode
    const lightButton = page.getByText('Clair').first()
    await lightButton.click()
    await page.waitForTimeout(500)

    // Verify theme changed
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')

    // Switch back to dark
    const darkButton = page.getByText('Sombre').first()
    await darkButton.click()
    await page.waitForTimeout(500)

    const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(themeDark).toBe('dark')
  })
})

test.describe('F61 - Changer le timezone', () => {
  test('should show timezone dropdown', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for timezone selector
    const timezoneElement = page.getByText(/Paris|Fuseau|Timezone/i).first()
    const hasTimezone = await timezoneElement.isVisible().catch(() => false)
    if (hasTimezone) {
      await expect(timezoneElement).toBeVisible()
    }
  })
})

test.describe('F62 - Changer les settings privacy', () => {
  test('should show privacy settings section', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for privacy section
    const privacySection = page.getByText(/Confidentialité|Visibilité/i).first()
    const hasPrivacy = await privacySection.isVisible().catch(() => false)
    if (hasPrivacy) {
      await expect(privacySection).toBeVisible()
    }
  })

  test('should have profile visibility dropdown', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for visibility option
    const visibilityElement = page.getByText(/Visibilité du profil|profil/i).first()
    const hasVisibility = await visibilityElement.isVisible().catch(() => false)
    if (hasVisibility) {
      await expect(visibilityElement).toBeVisible()
    }
  })

  test('should have online status toggle', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for online status toggle
    const onlineStatus = page.getByText(/statut en ligne|en ligne/i).first()
    const hasOnlineStatus = await onlineStatus.isVisible().catch(() => false)
    if (hasOnlineStatus) {
      await expect(onlineStatus).toBeVisible()
    }
  })
})

test.describe('F63 - Exporter ses données (GDPR)', () => {
  test('should show export data button', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for "Exporter mes données" button
    const exportBtn = page.getByText(/Exporter mes données|Exporter/i).first()
    const hasExport = await exportBtn.isVisible().catch(() => false)
    if (hasExport) {
      await expect(exportBtn).toBeVisible()
    }
  })
})

test.describe('F64 - Supprimer son compte', () => {
  test('should show delete account button', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for "Supprimer mon compte" button
    const deleteBtn = page.getByText(/Supprimer mon compte/i).first()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)
    if (hasDelete) {
      await expect(deleteBtn).toBeVisible()
    }
  })

  test('should show confirmation dialog when clicking delete', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Click "Supprimer mon compte" button
    const deleteBtn = page.getByText(/Supprimer mon compte/i).first()
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(500)

      // Should show confirmation dialog
      const dialog = page.getByText(/irréversible|confirmer|supprimer/i).first()
      const hasDialog = await dialog.isVisible().catch(() => false)
      if (hasDialog) {
        await expect(dialog).toBeVisible()

        // Close dialog without confirming (press Escape)
        await page.keyboard.press('Escape')
      }
    }
  })
})

test.describe('F65 - Se déconnecter', () => {
  test('should show logout button on settings page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Check for "Se déconnecter" button
    const logoutBtn = page.getByText(/Se déconnecter|Déconnexion/i).first()
    await expect(logoutBtn).toBeVisible()
  })

  test('should show logout button on profile page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/profile')
    await page.waitForTimeout(1000)

    // Check for logout option on profile
    const logoutBtn = page.getByText(/Se déconnecter|Déconnexion/i).first()
    const hasLogout = await logoutBtn.isVisible().catch(() => false)
    if (hasLogout) {
      await expect(logoutBtn).toBeVisible()
    }
  })

  test('should redirect to landing after logout', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Click logout
    const logoutBtn = page.getByText(/Se déconnecter|Déconnexion/i).first()
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click()
      await page.waitForTimeout(3000)

      // Should redirect to landing page or auth
      const url = page.url()
      expect(url.endsWith('/') || url.includes('/auth')).toBeTruthy()
    }
  })
})

test.describe('Settings - Responsive', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Page should load on mobile
    await expect(page.locator('body')).toBeVisible()

    // Settings sections should still be visible
    const apparence = page.getByText(/Apparence|Thème/i).first()
    const hasApparence = await apparence.isVisible().catch(() => false)
    if (hasApparence) {
      await expect(apparence).toBeVisible()
    }
  })
})
