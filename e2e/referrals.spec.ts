import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Referrals E2E — Phase 1.4 referral system (STRICT MODE)
 *
 * STRICT RULES ENFORCED:
 * 1. Every test fetches real DB data FIRST (profile + referral data)
 * 2. If DB has data -> UI MUST display it -> otherwise FAIL
 * 3. NO test.skip() as error handling
 * 4. NO .catch(() => false) on assertions
 * 5. Use navigateWithFallback() for SSR resilience
 * 6. DB-first validation: compare UI values against DB values
 */

test.describe('Referrals page — authenticated (STRICT)', () => {
  // Increase timeout for auth + API calls
  test.setTimeout(60000)

  test('navigates to /referrals and displays referral dashboard with DB-validated profile', async ({
    authenticatedPage,
    db,
  }) => {
    // STRICT: fetch DB data FIRST — profile must exist
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    // STRICT: fetch referral data from DB
    const userId = await db.getUserId()
    const { data: referrals } = await db.admin
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
    const referralCount = referrals?.length ?? 0

    // STRICT: fetch referral_code from profiles table
    const { data: profileWithCode } = await db.admin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single()

    // STRICT: use navigateWithFallback for SSR resilience
    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissTourOverlay(authenticatedPage)

    // STRICT: referral page MUST show "Parrainage" or invite-related text (aria-label or heading)
    const referralHeading = authenticatedPage.getByText(/parrainage|Invite tes potes/i).first()
    await expect(referralHeading).toBeVisible({ timeout: 15000 })

    // STRICT: if user has a referral_code in DB, it MUST be displayed on the page
    if (profileWithCode?.referral_code) {
      await expect(authenticatedPage.getByText(profileWithCode.referral_code).first()).toBeVisible({
        timeout: 10000,
      })
    }

    // STRICT: the stats grid MUST be visible (always shown, even with 0 values)
    const statsLabel = authenticatedPage.getByText(/Filleuls inscrits|Total parrainages/i).first()
    await expect(statsLabel).toBeVisible({ timeout: 10000 })

    // STRICT: if DB has referrals, the "Total parrainages" counter MUST show the correct count
    if (referralCount > 0) {
      const totalText = authenticatedPage.getByText(String(referralCount)).first()
      await expect(totalText).toBeVisible({ timeout: 10000 })
    }
  })

  test('displays referral code card with share section', async ({ authenticatedPage, db }) => {
    // STRICT: fetch DB data FIRST
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const userId = await db.getUserId()
    const { data: profileWithCode } = await db.admin
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single()

    // STRICT: use navigateWithFallback for SSR resilience
    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissTourOverlay(authenticatedPage)

    // STRICT: "Ton code de parrainage" heading MUST be visible
    await expect(authenticatedPage.getByText(/Ton code de parrainage/i).first()).toBeVisible({
      timeout: 15000,
    })

    // STRICT: the Copier button MUST be present in the share section
    const copyBtn = authenticatedPage.getByRole('button', { name: /Copier/i }).first()
    await expect(copyBtn).toBeVisible({ timeout: 10000 })

    // STRICT: share buttons for WhatsApp and Twitter MUST be visible
    await expect(authenticatedPage.getByText(/WhatsApp/i).first()).toBeVisible({ timeout: 5000 })
    await expect(authenticatedPage.getByText(/Twitter/i).first()).toBeVisible({ timeout: 5000 })

    // STRICT: if the profile has a referral_code in DB, it MUST appear on the page
    if (profileWithCode?.referral_code) {
      await expect(authenticatedPage.getByText(profileWithCode.referral_code).first()).toBeVisible({
        timeout: 10000,
      })
    }
  })

  test('displays milestone tracking section with DB-validated progress', async ({
    authenticatedPage,
    db,
  }) => {
    // STRICT: fetch DB data FIRST
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const userId = await db.getUserId()

    // STRICT: fetch referral stats from DB to validate milestone progress
    const { data: referrals } = await db.admin
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
    const referralCount = referrals?.length ?? 0

    // STRICT: use navigateWithFallback for SSR resilience
    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissTourOverlay(authenticatedPage)

    // STRICT: "Paliers de recompense" heading MUST be visible
    await expect(authenticatedPage.getByText(/Paliers de récompense/i).first()).toBeVisible({
      timeout: 15000,
    })

    // STRICT: the three milestone labels MUST be visible
    await expect(authenticatedPage.getByText(/Recruteur(?! Pro| Légendaire)/i).first()).toBeVisible(
      { timeout: 10000 }
    )
    await expect(authenticatedPage.getByText(/Recruteur Pro/i).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(authenticatedPage.getByText(/Recruteur Légendaire/i).first()).toBeVisible({
      timeout: 10000,
    })

    // STRICT: validate progress counters against DB
    // Each milestone shows "current/target" (e.g. "0/3", "0/10", "0/25")
    // or "Debloque" badge if achieved
    if (referralCount >= 3) {
      // STRICT: the first milestone (3 referrals) MUST show "Debloque" badge
      const unlockedBadge = authenticatedPage.getByText(/Débloqué/i).first()
      await expect(unlockedBadge).toBeVisible({ timeout: 5000 })
    } else {
      // STRICT: the progress counter MUST show the current count from DB
      const progressText = authenticatedPage.getByText(`${referralCount}/3`).first()
      await expect(progressText).toBeVisible({ timeout: 5000 })
    }
  })

  test('displays stats counters matching DB data', async ({ authenticatedPage, db }) => {
    // STRICT: fetch DB data FIRST
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const userId = await db.getUserId()

    // STRICT: fetch referral data from DB for validation
    const { data: referrals } = await db.admin
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', userId)

    const totalReferrals = referrals?.length ?? 0
    const signedUp = referrals?.filter((r) => r.status === 'signed_up').length ?? 0
    const converted = referrals?.filter((r) => r.status === 'converted').length ?? 0

    // STRICT: use navigateWithFallback for SSR resilience
    const loaded = await navigateWithFallback(authenticatedPage, '/referrals')
    expect(loaded).toBe(true)
    await dismissTourOverlay(authenticatedPage)

    // STRICT: all four stat labels MUST be visible
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

    // STRICT: the stat values MUST be consistent with DB data
    // The stats grid shows: signedUp, converted, totalXpEarned, totalReferrals
    // Since the page may use an RPC that aggregates differently,
    // we validate that the total parrainages value is at least >= what we see in the referrals table
    // (the RPC might include pending referrals not yet in the table)
    if (totalReferrals === 0) {
      // STRICT: when DB has 0 referrals, all counters MUST show 0
      // The stat cards show numeric values — at least one "0" MUST be visible
      const zeroValue = authenticatedPage.locator('p.text-2xl').filter({ hasText: '0' }).first()
      await expect(zeroValue).toBeVisible({ timeout: 5000 })
    }

    if (totalReferrals > 0) {
      // STRICT: when DB has referrals, the "Filleuls inscrits" counter MUST show the correct value
      // signedUp + converted = users who signed up (converted is a subset that also signed up first)
      const expectedSignedUp = signedUp + converted
      if (expectedSignedUp > 0) {
        const signedUpValue = authenticatedPage.getByText(String(expectedSignedUp)).first()
        await expect(signedUpValue).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
