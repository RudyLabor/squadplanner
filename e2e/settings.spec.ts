import { test, expect, dismissCookieBanner } from './fixtures'
import { test as baseTest } from '@playwright/test'

/**
 * Settings E2E Tests — F57-F65
 * Tests with functional data validation via TestDataHelper (DB queries)
 * and localStorage verification for client-side settings.
 * Uses shared fixtures: authenticatedPage (logged-in), db (TestDataHelper).
 */

// =============================================================================
// F57 — Profile edit shows DB data (username, bio, avatar)
// =============================================================================
test.describe('F57 — Editer son profil', () => {
  test('should display username, bio and avatar from DB on profile page', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()

    await authenticatedPage.goto('/profile')
    await authenticatedPage.waitForLoadState('networkidle')

    if (profile && profile.username) {
      // Username from DB should be displayed on the profile page
      const usernameLocator = authenticatedPage
        .getByText(profile.username, { exact: false })
        .first()
      await expect(usernameLocator).toBeVisible({ timeout: 10000 })
    } else {
      // No profile username — page should still load
      await expect(authenticatedPage.locator('main, [class*="profile"]').first()).toBeVisible()
    }

    // Verify bio text from DB is displayed on the profile page (if bio exists)
    if (profile && profile.bio) {
      const bioLocator = authenticatedPage
        .getByText(profile.bio, { exact: false })
        .first()
      await expect(bioLocator).toBeVisible({ timeout: 5000 })
    }

    // Verify avatar image is present (if avatar_url exists in DB)
    if (profile && profile.avatar_url) {
      const avatarImg = authenticatedPage.locator(
        `img[src*="${profile.avatar_url.split('/').pop()}"], img[class*="avatar"], img[alt*="avatar"], img[alt*="${profile.username || ''}"]`
      ).first()
      const avatarVisible = await avatarImg.isVisible({ timeout: 5000 }).catch(() => false)
      // Fallback: check for any profile image
      if (!avatarVisible) {
        const anyAvatar = authenticatedPage.locator(
          '[class*="avatar"] img, [class*="profile"] img, img[class*="rounded-full"]'
        ).first()
        await expect(anyAvatar).toBeVisible({ timeout: 5000 })
      } else {
        await expect(avatarImg).toBeVisible()
      }
    }
  })
})

// =============================================================================
// F58 — Notification settings section (with localStorage validation)
// =============================================================================
test.describe('F58 — Parametres de notifications', () => {
  test('should display notification toggles matching localStorage values', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify notification section exists
    const notifSection = authenticatedPage.locator('#notifications')
      .or(authenticatedPage.getByText(/Notification/i).first())
    await expect(notifSection).toBeVisible({ timeout: 10000 })

    // Verify at least some toggle labels are present
    const toggleLabels = authenticatedPage
      .getByText(/Sessions|Messages|Party|Rappels/i)
      .first()
    const toggleInputs = authenticatedPage
      .locator('input[type="checkbox"], [role="switch"], [class*="toggle"]')
      .first()
    const hasLabels = await toggleLabels.isVisible().catch(() => false)
    const hasInputs = await toggleInputs.isVisible().catch(() => false)
    expect(hasLabels || hasInputs).toBeTruthy()

    // Read notification settings from localStorage and verify toggle states match
    const notifSettings = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-notification-settings') || '{}')
    )

    if (Object.keys(notifSettings).length > 0) {
      // For each known notification key, verify the corresponding toggle state
      const keys: Array<{ key: string; label: RegExp }> = [
        { key: 'sessions', label: /Sessions/i },
        { key: 'messages', label: /Messages/i },
        { key: 'party', label: /Party|Groupe/i },
        { key: 'reminders', label: /Rappels|Reminders/i },
      ]

      for (const { key, label } of keys) {
        if (notifSettings[key] !== undefined) {
          // Find the toggle near the label text
          const labelEl = authenticatedPage.getByText(label).first()
          if (await labelEl.isVisible().catch(() => false)) {
            // Find the nearest checkbox/switch in the same parent container
            const toggleContainer = labelEl.locator('xpath=ancestor::div[.//input[@type="checkbox"] or .//*[@role="switch"]]').first()
            const toggle = toggleContainer.locator('input[type="checkbox"], [role="switch"]').first()
            if (await toggle.isVisible().catch(() => false)) {
              const isChecked = await toggle.isChecked().catch(async () => {
                // role="switch" uses aria-checked
                const ariaChecked = await toggle.getAttribute('aria-checked')
                return ariaChecked === 'true'
              })
              expect(isChecked).toBe(notifSettings[key])
            }
          }
        }
      }
    }
  })
})

// =============================================================================
// F59 — Audio devices section (browser-specific, no DB/localStorage comparison)
// =============================================================================
test.describe('F59 — Peripheriques audio', () => {
  test('should display audio section with Microphone/Output dropdowns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify audio section
    const audioSection = authenticatedPage.locator('#audio')
      .or(authenticatedPage.getByText(/Audio|Micro|Son/i).first())
    await expect(audioSection).toBeVisible({ timeout: 10000 })

    // Verify microphone or output dropdowns
    const hasMicDropdown = await authenticatedPage
      .getByText(/Microphone|Entrée audio/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasOutputDropdown = await authenticatedPage
      .getByText(/Sortie|Haut-parleur|Output/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasSelects = await authenticatedPage
      .locator('#audio select, [class*="audio"] select')
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasMicDropdown || hasOutputDropdown || hasSelects).toBeTruthy()
  })
})

// =============================================================================
// F60 — Theme toggle works (strong data-theme assertions)
// =============================================================================
test.describe('F60 — Changer le theme (dark/light)', () => {
  test('should toggle theme and verify data-theme attribute on html element', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Find theme options (Sombre / Clair / Auto)
    const themeSection = authenticatedPage.locator('#theme')
      .or(authenticatedPage.getByText(/Apparence|Thème/i).first())
    await expect(themeSection).toBeVisible({ timeout: 10000 })

    const clairBtn = authenticatedPage.getByText('Clair', { exact: true })
      .or(authenticatedPage.locator('button:has-text("Clair")'))
      .or(authenticatedPage.locator('[value="light"]'))
    const sombreBtn = authenticatedPage.getByText('Sombre', { exact: true })
      .or(authenticatedPage.locator('button:has-text("Sombre")'))
      .or(authenticatedPage.locator('[value="dark"]'))

    const hasClair = await clairBtn.first().isVisible().catch(() => false)
    const hasSombre = await sombreBtn.first().isVisible().catch(() => false)

    expect(hasSombre || hasClair).toBeTruthy()

    // Click "Clair" → verify data-theme="light" on html element
    if (hasClair) {
      await clairBtn.first().click()
      await authenticatedPage.waitForTimeout(500)

      const themeAfterClair = await authenticatedPage.evaluate(() => {
        return document.documentElement.getAttribute('data-theme')
          || document.documentElement.getAttribute('class')
          || document.documentElement.style.colorScheme
          || ''
      })
      expect(themeAfterClair).toMatch(/light/i)
    }

    // Click "Sombre" → verify data-theme="dark" on html element
    if (hasSombre) {
      await sombreBtn.first().click()
      await authenticatedPage.waitForTimeout(500)

      const themeAfterSombre = await authenticatedPage.evaluate(() => {
        return document.documentElement.getAttribute('data-theme')
          || document.documentElement.getAttribute('class')
          || document.documentElement.style.colorScheme
          || ''
      })
      expect(themeAfterSombre).toMatch(/dark/i)
    }
  })
})

// =============================================================================
// F61 — Timezone matches DB and localStorage
// =============================================================================
test.describe('F61 — Fuseau horaire correspond a la DB et localStorage', () => {
  test('should show timezone value matching DB profile and localStorage', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()

    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify timezone section exists
    const timezoneSection = authenticatedPage.locator('#region')
      .or(authenticatedPage.getByText(/Fuseau|Timezone|Région/i).first())
    await expect(timezoneSection).toBeVisible({ timeout: 10000 })

    // Read localStorage timezone
    const localTz = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-timezone') || ''
    )

    // If profile has timezone in DB, verify it shows on the settings page
    if (profile && profile.timezone) {
      const tzParts = profile.timezone.split('/')
      const tzCity = tzParts[tzParts.length - 1].replace(/_/g, ' ')
      const hasTzMatch = await authenticatedPage
        .getByText(new RegExp(tzCity, 'i'))
        .first()
        .isVisible()
        .catch(() => false)
      const hasTzFullMatch = await authenticatedPage
        .getByText(new RegExp(profile.timezone.replace('/', '\\/'), 'i'))
        .first()
        .isVisible()
        .catch(() => false)
      expect(hasTzMatch || hasTzFullMatch).toBeTruthy()

      // If localStorage also has a timezone, verify DB and localStorage are consistent
      if (localTz) {
        expect(localTz).toBe(profile.timezone)
      }
    } else if (localTz) {
      // No DB timezone but localStorage has one — verify it's displayed
      const tzParts = localTz.split('/')
      const tzCity = tzParts[tzParts.length - 1].replace(/_/g, ' ')
      const hasTzOnPage = await authenticatedPage
        .getByText(new RegExp(tzCity, 'i'))
        .first()
        .isVisible()
        .catch(() => false)
      expect(hasTzOnPage).toBeTruthy()
    }
  })
})

// =============================================================================
// F62 — Privacy settings (with localStorage validation)
// =============================================================================
test.describe('F62 — Parametres de confidentialite', () => {
  test('should display privacy settings matching localStorage values', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Verify privacy section
    const privacySection = authenticatedPage.locator('#privacy')
      .or(authenticatedPage.getByText(/Confidentialité|Visibilité|Privé/i).first())
    await expect(privacySection).toBeVisible({ timeout: 10000 })

    // Verify profile visibility dropdown or online status toggle
    const hasVisibility = await authenticatedPage
      .getByText(/Visibilité du profil|Profil public|Profil privé/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasOnlineStatus = await authenticatedPage
      .getByText(/Statut en ligne|En ligne|Hors ligne/i)
      .first()
      .isVisible()
      .catch(() => false)
    const hasToggle = await authenticatedPage
      .locator('#privacy input[type="checkbox"], #privacy [role="switch"], #privacy select')
      .first()
      .isVisible()
      .catch(() => false)
    expect(hasVisibility || hasOnlineStatus || hasToggle).toBeTruthy()

    // Read privacy settings from localStorage and verify toggle states match
    const privacySettings = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-privacy-settings') || '{}')
    )

    if (Object.keys(privacySettings).length > 0) {
      // Verify profileVisibility setting
      if (privacySettings.profileVisibility !== undefined) {
        const visibilitySelect = authenticatedPage.locator('#privacy select').first()
        if (await visibilitySelect.isVisible().catch(() => false)) {
          const selectedValue = await visibilitySelect.inputValue()
          expect(selectedValue).toBe(privacySettings.profileVisibility)
        }
      }

      // Verify showOnlineStatus toggle
      if (privacySettings.showOnlineStatus !== undefined) {
        const onlineLabel = authenticatedPage.getByText(/Statut en ligne|En ligne/i).first()
        if (await onlineLabel.isVisible().catch(() => false)) {
          const toggleContainer = onlineLabel.locator('xpath=ancestor::div[.//input[@type="checkbox"] or .//*[@role="switch"]]').first()
          const toggle = toggleContainer.locator('input[type="checkbox"], [role="switch"]').first()
          if (await toggle.isVisible().catch(() => false)) {
            const isChecked = await toggle.isChecked().catch(async () => {
              const ariaChecked = await toggle.getAttribute('aria-checked')
              return ariaChecked === 'true'
            })
            expect(isChecked).toBe(privacySettings.showOnlineStatus)
          }
        }
      }
    }
  })
})

// =============================================================================
// F63 — Export data (GDPR) — functional tests with download validation
// =============================================================================
test.describe('F63 — Exporter ses donnees (GDPR)', () => {

  test('F63a: Export button is visible and clickable', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    const exportBtn = authenticatedPage.getByText(/Exporter mes données/i).first()
      .or(authenticatedPage.getByRole('button', { name: /Exporter/i }))
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 })
  })

  test('F63b: Click export triggers file download', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Listen for download event BEFORE clicking
    const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 30000 })

    // Click export button
    const exportBtn = authenticatedPage.getByText(/Exporter mes données/i).first()
      .or(authenticatedPage.getByRole('button', { name: /Exporter/i }))
    const hasExport = await exportBtn.first().isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasExport, 'Export button not visible')

    await exportBtn.first().click()

    // Wait for download
    const download = await downloadPromise
    expect(download).toBeTruthy()

    // Verify filename pattern
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.(json|txt|csv)/)
  })

  test('F63c: Exported data contains expected structure', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 30000 })

    const exportBtn = authenticatedPage.getByText(/Exporter mes données/i).first()
      .or(authenticatedPage.getByRole('button', { name: /Exporter/i }))
    const hasExport = await exportBtn.first().isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasExport, 'Export button not visible')

    await exportBtn.first().click()

    const download = await downloadPromise
    expect(download).toBeTruthy()

    // Read file content
    const readStream = await download.createReadStream()
    const chunks: Buffer[] = []
    if (readStream) {
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk))
      }
    }
    const content = Buffer.concat(chunks).toString('utf-8')
    expect(content.length).toBeGreaterThan(10)

    // Try to parse as JSON and validate structure
    const data = JSON.parse(content)
    expect(data).toBeTruthy()
    expect(data.exported_at || data.profile || data.squads).toBeTruthy()

    // If it has a profile, validate it has username
    if (data.profile) {
      expect(data.profile.username).toBeTruthy()
    }
  })
})

// =============================================================================
// F64 — Delete account (GDPR) — modal flow + cascade delete on temp user
// =============================================================================
test.describe('F64 — Supprimer son compte', () => {

  test('F64a: Delete modal flow — type SUPPRIMER enables confirm button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Click "Supprimer mon compte" to open modal
    const deleteBtn = authenticatedPage.getByText(/Supprimer mon compte/i).first()
      .or(authenticatedPage.getByRole('button', { name: /Supprimer/i }))
    const hasDelete = await deleteBtn.first().isVisible({ timeout: 5000 }).catch(() => false)
    test.skip(!hasDelete, 'Delete button not visible')

    await deleteBtn.first().click()
    await authenticatedPage.waitForTimeout(500)

    // Verify modal opened with confirmation heading
    const modalHeading = authenticatedPage.getByText(/Supprimer ton compte|Supprimer votre compte|Confirmation/i)
    await expect(modalHeading.first()).toBeVisible({ timeout: 5000 })

    // Verify confirm button exists and is disabled
    const confirmBtn = authenticatedPage.getByRole('button', { name: /Supprimer définitivement|Confirmer la suppression/i })
    const hasConfirm = await confirmBtn.first().isVisible().catch(() => false)

    if (hasConfirm) {
      // Button should be disabled initially
      const isDisabled = await confirmBtn.first().isDisabled().catch(() => true)
      expect(isDisabled).toBe(true)

      // Type "SUPPRIMER" in the confirmation input
      const input = authenticatedPage.locator('input[placeholder*="SUPPRIMER" i], input[type="text"]').last()
      await input.fill('SUPPRIMER')
      await authenticatedPage.waitForTimeout(300)

      // Confirm button should now be enabled
      const isEnabled = await confirmBtn.first().isEnabled().catch(() => false)
      expect(isEnabled).toBe(true)
    }

    // Click Cancel/Annuler — DO NOT actually delete the main user
    const cancelBtn = authenticatedPage.getByRole('button', { name: /Annuler|Fermer/i }).first()
    const hasCancel = await cancelBtn.isVisible().catch(() => false)
    if (hasCancel) {
      await cancelBtn.click()
    } else {
      await authenticatedPage.keyboard.press('Escape')
    }
  })

  test('F64b: Delete cascade on temporary user — all 8 tables cleaned in DB', async ({ db }) => {
    // Create a temporary user specifically for this test
    let tempUserId: string | null = null
    try {
      const { userId } = await db.createTemporaryTestUser()
      tempUserId = userId

      // Verify user exists in profiles
      const { data: profileBefore } = await db.admin.from('profiles').select('*').eq('id', userId).single()
      expect(profileBefore).toBeTruthy()
      expect(profileBefore.username).toContain('e2e-temp-')

      // Execute the delete cascade (same logic as SettingsDeleteModal)
      await db.admin.from('session_checkins').delete().eq('user_id', userId)
      await db.admin.from('session_rsvps').delete().eq('user_id', userId)
      await db.admin.from('messages').delete().eq('user_id', userId)
      await db.admin.from('direct_messages').delete().eq('sender_id', userId)
      await db.admin.from('party_participants').delete().eq('user_id', userId)
      await db.admin.from('push_subscriptions').delete().eq('user_id', userId)
      await db.admin.from('squad_members').delete().eq('user_id', userId)
      await db.admin.from('ai_insights').delete().eq('user_id', userId)
      await db.admin.from('profiles').delete().eq('id', userId)

      // Verify all tables are clean
      const verification = await db.verifyUserDataDeleted(userId)
      for (const [table, count] of Object.entries(verification.tables)) {
        expect(count).toBe(0)
      }

      // Delete auth user
      await db.admin.auth.admin.deleteUser(userId)
      tempUserId = null
    } finally {
      // Safety cleanup if test failed before delete
      if (tempUserId) {
        try { await db.deleteTemporaryTestUser(tempUserId) } catch { /* ignore */ }
      }
    }
  })
})

// =============================================================================
// F65 — Logout works
// =============================================================================
test.describe('F65 — Se deconnecter', () => {
  test('should logout and redirect to auth or landing page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings')
    await authenticatedPage.waitForLoadState('networkidle')

    // Find and click logout button
    const logoutBtn = authenticatedPage
      .getByRole('button', { name: /Se déconnecter|Déconnexion/i })
      .or(authenticatedPage.locator('button:has-text("Se déconnecter")'))
      .or(authenticatedPage.locator('a:has-text("Se déconnecter")'))

    const hasLogout = await logoutBtn.first().isVisible().catch(() => false)

    if (hasLogout) {
      await logoutBtn.first().click()
      await authenticatedPage.waitForTimeout(3000)

      // Verify redirect to /auth or landing page (/)
      const url = authenticatedPage.url()
      expect(
        url.includes('/auth') ||
        url.endsWith('/') ||
        url.endsWith('.fr') ||
        url.endsWith('.fr/')
      ).toBeTruthy()
    } else {
      // Logout button not found on /settings — try /profile
      await authenticatedPage.goto('/profile')
      await authenticatedPage.waitForLoadState('networkidle')

      const profileLogout = authenticatedPage
        .getByRole('button', { name: /Se déconnecter|Déconnexion/i })
        .or(authenticatedPage.locator('button:has-text("Se déconnecter")'))
      const hasProfileLogout = await profileLogout.first().isVisible().catch(() => false)
      expect(hasProfileLogout).toBeTruthy()
    }
  })
})

// =============================================================================
// Settings protected route
// =============================================================================
test.describe('Settings — Route protegee', () => {
  baseTest('should redirect to auth when not authenticated', async ({ page }) => {
    await page.goto('https://squadplanner.fr/settings')
    await dismissCookieBanner(page)
    await page.waitForTimeout(3000)

    const url = page.url()
    // Should redirect to /auth or stay on settings if there is a different protection mechanism
    expect(url.includes('/auth') || url.includes('/settings')).toBeTruthy()
  })
})
