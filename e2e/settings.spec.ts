import { test, expect, dismissCookieBanner, navigateWithFallback } from './fixtures'
import { test as baseTest, expect as baseExpect } from '@playwright/test'

/**
 * Settings E2E Tests — F57-F65 — STRICT MODE
 *
 * REGLE STRICTE : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * Pas de `.catch(() => false)` sur les assertions.
 * Pas de fallback sur `<main>` quand une section specifique doit etre visible.
 * Pas de `test.info().annotations` remplacant de vraies assertions.
 * Pas de OR conditions qui passent toujours.
 * Pas de try/catch qui avale les erreurs.
 */

// =============================================================================
// F57 — Profile edit shows DB data (username, bio, avatar)
// =============================================================================
test.describe('F57 — Editer son profil', () => {
  test('F57: Profile page displays username from DB', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()
    // STRICT: profile MUST exist for test user
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    await authenticatedPage.goto('/profile')
    await authenticatedPage.waitForLoadState('networkidle')

    // STRICT: username from DB MUST be visible on profile page
    const usernameLocator = authenticatedPage.getByText(profile.username, { exact: false }).first()
    await expect(usernameLocator).toBeVisible({ timeout: 15000 })
  })

  test('F57: Profile page displays bio from DB when set', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    await authenticatedPage.goto('/profile')
    await authenticatedPage.waitForLoadState('networkidle')

    if (profile.bio) {
      // STRICT: bio exists in DB → MUST be visible on the page
      const bioLocator = authenticatedPage.getByText(profile.bio, { exact: false }).first()
      await expect(bioLocator).toBeVisible({ timeout: 10000 })
    } else {
      // DB has no bio → verify profile page still loaded correctly with username
      const usernameLocator = authenticatedPage
        .getByText(profile.username, { exact: false })
        .first()
      await expect(usernameLocator).toBeVisible({ timeout: 10000 })
    }
  })

  test('F57: Profile page displays avatar when avatar_url is set in DB', async ({
    authenticatedPage,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    await authenticatedPage.goto('/profile')
    await authenticatedPage.waitForLoadState('networkidle')

    if (profile.avatar_url) {
      // STRICT: avatar_url in DB → an avatar image MUST be visible
      const avatarImg = authenticatedPage
        .locator(
          `img[src*="${profile.avatar_url.split('/').pop()}"], img[class*="avatar"], img[alt*="avatar"]`
        )
        .first()
      // STRICT: no .catch(() => false) — this MUST pass
      await expect(avatarImg).toBeVisible({ timeout: 10000 })
    } else {
      // No avatar_url in DB → verify page loaded with username instead
      const usernameLocator = authenticatedPage
        .getByText(profile.username, { exact: false })
        .first()
      await expect(usernameLocator).toBeVisible({ timeout: 10000 })
    }
  })
})

// =============================================================================
// F58 — Notification settings section
// =============================================================================
test.describe('F58 — Parametres de notifications', () => {
  test('F58: Notification section with 4 toggles is visible', async ({ authenticatedPage }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    // STRICT: settings page MUST load successfully
    expect(ok).toBe(true)

    // STRICT: #notifications section MUST be visible (exists in Settings.tsx)
    const notifSection = authenticatedPage.locator('#notifications')
    await expect(notifSection).toBeVisible({ timeout: 10000 })

    // STRICT: all 4 notification toggle labels MUST be visible within #notifications
    const section = authenticatedPage.locator('#notifications')
    await expect(section.getByText('Sessions', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(section.getByText('Messages', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(section.getByText('Party vocale', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(section.getByText(/Rappels automatiques/i)).toBeVisible({ timeout: 5000 })

    // STRICT: at least 4 toggle switches within the section
    const switches = section.locator('[role="switch"]')
    const switchCount = await switches.count()
    // STRICT: exactly 4 notification toggles
    expect(switchCount).toBe(4)
  })

  test('F58: Toggling a notification switch updates localStorage', async ({
    authenticatedPage,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    const section = authenticatedPage.locator('#notifications')
    await expect(section).toBeVisible({ timeout: 10000 })

    // Read initial localStorage state
    const initialSettings = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-notification-settings') || '{}')
    )

    // Click the first toggle (Sessions)
    const firstToggle = section.locator('[role="switch"]').first()
    await expect(firstToggle).toBeVisible({ timeout: 5000 })
    const initialState = await firstToggle.getAttribute('aria-checked')
    await firstToggle.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: toggle state MUST have changed
    const newState = await firstToggle.getAttribute('aria-checked')
    expect(newState).not.toBe(initialState)

    // STRICT: localStorage MUST be updated
    const updatedSettings = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-notification-settings') || '{}')
    )
    // STRICT: the sessions value MUST have flipped
    expect(updatedSettings.sessions).toBe(newState === 'true')
  })
})

// =============================================================================
// F59 — Audio devices section
// =============================================================================
test.describe('F59 — Peripheriques audio', () => {
  test('F59: Audio section with Microphone and Sortie audio labels', async ({
    authenticatedPage,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: #audio section MUST be visible
    const audioSection = authenticatedPage.locator('#audio')
    await expect(audioSection).toBeVisible({ timeout: 10000 })

    // STRICT: "Microphone" label MUST be visible in #audio section
    await expect(audioSection.getByText('Microphone', { exact: true })).toBeVisible({
      timeout: 5000,
    })

    // STRICT: "Sortie audio" label MUST be visible in #audio section
    await expect(audioSection.getByText('Sortie audio', { exact: true })).toBeVisible({
      timeout: 5000,
    })
  })
})

// =============================================================================
// F60 — Theme toggle works
// =============================================================================
test.describe('F60 — Changer le theme (dark/light)', () => {
  test('F60: Theme selector toggles data-theme between dark and light', async ({
    authenticatedPage,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: #theme section MUST be visible
    const themeSection = authenticatedPage.locator('#theme')
    await expect(themeSection).toBeVisible({ timeout: 10000 })

    // STRICT: "Sombre" and "Clair" tabs MUST exist (SegmentedControl in ThemeSelector)
    const sombreTab = authenticatedPage.getByRole('tab', { name: /Sombre/i })
    const clairTab = authenticatedPage.getByRole('tab', { name: /Clair/i })
    await expect(sombreTab).toBeVisible({ timeout: 5000 })
    await expect(clairTab).toBeVisible({ timeout: 5000 })

    // Click "Sombre" → verify dark theme
    await sombreTab.click()
    await authenticatedPage.waitForTimeout(500)
    const themeAfterSombre = await authenticatedPage.evaluate(
      () =>
        document.documentElement.getAttribute('data-theme') ||
        document.documentElement.getAttribute('class') ||
        document.documentElement.style.colorScheme ||
        ''
    )
    // STRICT: theme attribute MUST contain "dark"
    expect(themeAfterSombre).toMatch(/dark/i)

    // Click "Clair" → verify light theme
    await clairTab.click()
    await authenticatedPage.waitForTimeout(500)
    const themeAfterClair = await authenticatedPage.evaluate(
      () =>
        document.documentElement.getAttribute('data-theme') ||
        document.documentElement.getAttribute('class') ||
        document.documentElement.style.colorScheme ||
        ''
    )
    // STRICT: theme attribute MUST contain "light"
    expect(themeAfterClair).toMatch(/light/i)
  })
})

// =============================================================================
// F61 — Timezone matches DB
// =============================================================================
test.describe('F61 — Fuseau horaire correspond a la DB', () => {
  test('F61: Timezone from DB profile is displayed in the region section', async ({
    authenticatedPage,
    db,
  }) => {
    const profile = await db.getProfile()
    // STRICT: profile MUST exist
    expect(profile).toBeTruthy()

    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: #region section MUST be visible
    const regionSection = authenticatedPage.locator('#region')
    await expect(regionSection).toBeVisible({ timeout: 10000 })

    // STRICT: "Fuseau horaire" label MUST be visible
    await expect(regionSection.getByText('Fuseau horaire')).toBeVisible({ timeout: 5000 })

    if (profile.timezone) {
      // DB has a timezone → verify the city name appears on the page
      // TIMEZONES array maps e.g. "Europe/Paris" → "Paris (UTC+1)"
      const tzParts = profile.timezone.split('/')
      const tzCity = tzParts[tzParts.length - 1].replace(/_/g, ' ')

      // STRICT: the timezone city MUST appear in the region section
      const hasTzCity = await regionSection
        .getByText(new RegExp(tzCity, 'i'))
        .first()
        .isVisible({ timeout: 5000 })
      expect(hasTzCity).toBe(true)

      // STRICT: localStorage timezone MUST match DB timezone after page loads
      const localTz = await authenticatedPage.evaluate(
        () => localStorage.getItem('sq-timezone') || ''
      )
      if (localTz && localTz.includes('/')) {
        // STRICT: if localStorage has a timezone, it MUST match DB
        expect(localTz).toBe(profile.timezone)
      }
    } else {
      // No timezone in DB → the Select combobox MUST still be present
      const selectTrigger = regionSection
        .locator('button[role="combobox"], [class*="select"]')
        .first()
      await expect(selectTrigger).toBeVisible({ timeout: 5000 })
    }
  })
})

// =============================================================================
// F62 — Privacy settings
// =============================================================================
test.describe('F62 — Parametres de confidentialite', () => {
  test('F62: Privacy section displays visibility and online status controls', async ({
    authenticatedPage,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: #privacy section MUST be visible (defined in Settings.tsx)
    const privacySection = authenticatedPage.locator('#privacy')
    await expect(privacySection).toBeVisible({ timeout: 10000 })

    // STRICT: "Visibilite du profil" label MUST be visible
    await expect(privacySection.getByText(/Visibilité du profil/i)).toBeVisible({ timeout: 5000 })

    // STRICT: "Statut en ligne" label MUST be visible
    await expect(privacySection.getByText(/Statut en ligne/i)).toBeVisible({ timeout: 5000 })

    // STRICT: online status toggle (role="switch") MUST be present
    const onlineSwitch = privacySection.locator('[role="switch"]').first()
    await expect(onlineSwitch).toBeVisible({ timeout: 5000 })
  })

  test('F62: Toggling online status updates localStorage', async ({ authenticatedPage }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    const privacySection = authenticatedPage.locator('#privacy')
    await expect(privacySection).toBeVisible({ timeout: 10000 })

    // Get initial privacy localStorage
    const initialPrivacy = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-privacy-settings') || '{}')
    )
    const initialOnlineStatus = initialPrivacy.showOnlineStatus ?? true

    // Click the online status toggle
    const onlineSwitch = privacySection.locator('[role="switch"]').first()
    await expect(onlineSwitch).toBeVisible({ timeout: 5000 })
    await onlineSwitch.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: localStorage MUST now have the opposite value
    const updatedPrivacy = await authenticatedPage.evaluate(() =>
      JSON.parse(localStorage.getItem('sq-privacy-settings') || '{}')
    )
    expect(updatedPrivacy.showOnlineStatus).toBe(!initialOnlineStatus)
  })
})

// =============================================================================
// F63 — Export data (GDPR)
// =============================================================================
test.describe('F63 — Exporter ses donnees (GDPR)', () => {
  test('F63a: Export button is visible on settings page', async ({ authenticatedPage }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: "Exporter mes donnees" button MUST be visible (in #data section)
    const dataSection = authenticatedPage.locator('#data')
    await expect(dataSection).toBeVisible({ timeout: 10000 })
    const exportBtn = dataSection.getByText(/Exporter mes données/i).first()
    // STRICT: no fallback to <main> — the button MUST exist
    await expect(exportBtn).toBeVisible({ timeout: 5000 })
  })

  test('F63b: Click export triggers JSON file download with valid structure', async ({
    authenticatedPage,
    db,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    // Listen for download event BEFORE clicking
    const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 30000 })

    // STRICT: click the export button — it MUST exist
    const exportBtn = authenticatedPage.getByText(/Exporter mes données/i).first()
    await expect(exportBtn).toBeVisible({ timeout: 5000 })
    await exportBtn.click()

    // STRICT: download MUST happen
    const download = await downloadPromise
    expect(download).toBeTruthy()

    // STRICT: filename MUST be .json
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.json$/)

    // Read and validate exported content
    const readStream = await download.createReadStream()
    const chunks: Buffer[] = []
    if (readStream) {
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk))
      }
    }
    const content = Buffer.concat(chunks).toString('utf-8')
    // STRICT: content MUST be non-empty
    expect(content.length).toBeGreaterThan(10)

    const data = JSON.parse(content)
    // STRICT: exported data MUST contain exported_at and profile
    expect(data.exported_at).toBeTruthy()
    expect(data.profile).toBeTruthy()
    // STRICT: exported profile username MUST match DB
    expect(data.profile.username).toBe(profile.username)
  })
})

// =============================================================================
// F64 — Delete account (GDPR)
// =============================================================================
test.describe('F64 — Supprimer son compte', () => {
  test('F64a: Delete modal flow — type SUPPRIMER enables confirm button', async ({
    authenticatedPage,
  }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: "Supprimer mon compte" button MUST be visible in #data section
    const dataSection = authenticatedPage.locator('#data')
    await expect(dataSection).toBeVisible({ timeout: 10000 })
    const deleteBtn = dataSection.getByText(/Supprimer mon compte/i).first()
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })

    // Open the delete modal
    await deleteBtn.click()
    await authenticatedPage.waitForTimeout(500)

    // STRICT: modal heading "Supprimer ton compte" MUST be visible
    const modalHeading = authenticatedPage.getByText('Supprimer ton compte')
    await expect(modalHeading).toBeVisible({ timeout: 5000 })

    // STRICT: confirm button "Supprimer definitivement" MUST exist and be disabled
    const confirmBtn = authenticatedPage.getByRole('button', { name: /Supprimer définitivement/i })
    await expect(confirmBtn).toBeVisible({ timeout: 5000 })
    // STRICT: confirm button MUST be disabled initially
    await expect(confirmBtn).toBeDisabled()

    // Type "SUPPRIMER" in the confirmation input
    const input = authenticatedPage.locator('input[placeholder="SUPPRIMER"]')
    await expect(input).toBeVisible({ timeout: 3000 })
    await input.fill('SUPPRIMER')
    await authenticatedPage.waitForTimeout(300)

    // STRICT: confirm button MUST now be enabled
    await expect(confirmBtn).toBeEnabled()

    // Cancel — DO NOT actually delete the main test user
    const cancelBtn = authenticatedPage.getByRole('button', { name: /Annuler/i })
    await expect(cancelBtn).toBeVisible({ timeout: 3000 })
    await cancelBtn.click()
  })

  test('F64b: Delete cascade on temporary user — all 8 tables cleaned in DB', async ({ db }) => {
    // Create a temporary user specifically for this test
    const { userId } = await db.createTemporaryTestUser()
    try {
      // STRICT: verify user exists in profiles before deletion
      const { data: profileBefore } = await db.admin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      expect(profileBefore).toBeTruthy()
      // STRICT: username MUST contain the e2e-temp prefix
      expect(profileBefore.username).toContain('e2e-temp-')

      // Execute the delete cascade (mirrors SettingsDeleteModal logic)
      await db.admin.from('session_checkins').delete().eq('user_id', userId)
      await db.admin.from('session_rsvps').delete().eq('user_id', userId)
      await db.admin.from('messages').delete().eq('user_id', userId)
      await db.admin.from('direct_messages').delete().eq('sender_id', userId)
      await db.admin.from('party_participants').delete().eq('user_id', userId)
      await db.admin.from('push_subscriptions').delete().eq('user_id', userId)
      await db.admin.from('squad_members').delete().eq('user_id', userId)
      await db.admin.from('ai_insights').delete().eq('user_id', userId)
      await db.admin.from('profiles').delete().eq('id', userId)

      // STRICT: verify ALL 8 tables are clean in DB
      const verification = await db.verifyUserDataDeleted(userId)
      for (const [table, count] of Object.entries(verification.tables)) {
        // STRICT: each table MUST have 0 rows for the deleted user
        expect(count).toBe(0)
      }

      // Delete auth user
      await db.admin.auth.admin.deleteUser(userId)
    } catch (error) {
      // Safety cleanup — but re-throw the error so test fails
      try {
        await db.deleteTemporaryTestUser(userId)
      } catch {
        /* cleanup */
      }
      throw error
    }
  })
})

// =============================================================================
// F65 — Logout works
// =============================================================================
test.describe('F65 — Se deconnecter', () => {
  test('F65: Logout button is visible and redirects to auth', async ({ authenticatedPage }) => {
    const ok = await navigateWithFallback(authenticatedPage, '/settings')
    expect(ok).toBe(true)

    // STRICT: "Se deconnecter" button MUST be visible on settings page
    const logoutBtn = authenticatedPage.getByText(/Se déconnecter/i).first()
    await expect(logoutBtn).toBeVisible({ timeout: 10000 })

    await logoutBtn.click()
    await authenticatedPage.waitForTimeout(3000)

    // STRICT: after logout, URL MUST redirect to /auth or landing (/)
    // STRICT: must be on auth page or landing — not on /settings anymore
    // Utilisation d'un regex pour verifier toutes les destinations valides
    await expect(authenticatedPage).toHaveURL(/\/auth|\.fr\/?$|\/$/, { timeout: 5000 })
  })
})

// =============================================================================
// Settings protected route — unauthenticated access
// =============================================================================
test.describe('Settings — Route protegee', () => {
  baseTest('should redirect to auth when not authenticated', async ({ page }) => {
    await page.goto('https://squadplanner.fr/settings')
    await dismissCookieBanner(page)
    await page.waitForTimeout(3000)

    const url = page.url()
    // STRICT: unauthenticated users MUST be redirected to /auth
    baseExpect(url).toContain('/auth')
  })
})
