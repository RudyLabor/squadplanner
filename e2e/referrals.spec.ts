import { test, expect, navigateWithFallback, dismissTourOverlay, dismissCookieBanner } from './fixtures'

/**
 * Referrals E2E Tests
 *
 * Tests the /referrals page which displays the referral program.
 * The page shows:
 * - Hero section with title "Invite tes potes, gagne des récompenses"
 * - Referral code card with copy/share buttons
 * - Stats grid (Filleuls inscrits, Convertis Premium, XP gagnés, Total parrainages)
 * - "Comment ça marche" section with steps
 * - "Paliers de récompense" section with milestones (3, 10, 25)
 */

test.describe('Referrals page — authenticated', () => {
  test.setTimeout(60000)

  test('navigates to /referrals and displays referral dashboard', async ({
    authenticatedPage,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissCookieBanner(authenticatedPage)
    await dismissTourOverlay(authenticatedPage)

    // Referral page MUST show the main heading
    const referralHeading = authenticatedPage.getByText(/Invite tes potes/i).first()
    await expect(referralHeading).toBeVisible({ timeout: 15000 })

    // Stats grid MUST be visible
    const statsLabel = authenticatedPage.getByText(/Filleuls inscrits/i).first()
    await expect(statsLabel).toBeVisible({ timeout: 10000 })

    // Total parrainages label must be visible
    await expect(authenticatedPage.getByText(/Total parrainages/i).first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('displays referral code card with share section', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissCookieBanner(authenticatedPage)
    await dismissTourOverlay(authenticatedPage)

    // "Ton code de parrainage" heading MUST be visible
    await expect(authenticatedPage.getByText(/Ton code de parrainage/i).first()).toBeVisible({
      timeout: 15000,
    })

    // Copier button MUST be present
    const copyBtn = authenticatedPage.getByRole('button', { name: /Copier/i }).first()
    await expect(copyBtn).toBeVisible({ timeout: 10000 })

    // Share buttons MUST be visible
    await expect(authenticatedPage.getByText(/WhatsApp/i).first()).toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Twitter/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('displays milestone tracking section', async ({
    authenticatedPage,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissCookieBanner(authenticatedPage)
    await dismissTourOverlay(authenticatedPage)

    // "Paliers de récompense" heading MUST be visible
    await expect(authenticatedPage.getByText(/Paliers de récompense/i).first()).toBeVisible({
      timeout: 15000,
    })

    // The three milestone labels MUST be visible
    await expect(authenticatedPage.getByText('Recruteur').first()).toBeVisible({ timeout: 10000 })
    await expect(authenticatedPage.getByText(/Recruteur Pro/i).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(authenticatedPage.getByText(/Recruteur Légendaire/i).first()).toBeVisible({
      timeout: 10000,
    })

    // Progress counters MUST be visible (e.g. "0/3", "0/10", "0/25")
    await expect(authenticatedPage.getByText(/\/3/).first()).toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/\/10/).first()).toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/\/25/).first()).toBeVisible({ timeout: 5000 })
  })

  test('displays stats counters', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissCookieBanner(authenticatedPage)
    await dismissTourOverlay(authenticatedPage)

    // All four stat labels MUST be visible
    await expect(authenticatedPage.getByText(/Filleuls inscrits/i).first()).toBeVisible({
      timeout: 15000,
    })
    await expect(authenticatedPage.getByText(/Convertis Premium/i).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(authenticatedPage.getByText(/XP gagnés/i).first()).toBeVisible({ timeout: 10000 })
    await expect(authenticatedPage.getByText(/Total parrainages/i).first()).toBeVisible({
      timeout: 10000,
    })

    // "Comment ça marche" section MUST be visible
    await expect(authenticatedPage.getByText(/Comment ça marche/i).first()).toBeVisible({
      timeout: 10000,
    })
  })
})
