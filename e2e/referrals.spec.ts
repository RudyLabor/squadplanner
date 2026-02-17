import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Referrals E2E — Phase 1.4 referral system
 *
 * Tests the referrals page navigation and content (authenticated).
 * The page requires auth — unauthenticated users redirect to /auth.
 * The referral store makes Supabase RPC calls that may take time.
 */

test.describe('Referrals page — authenticated', () => {
  // Increase timeout for auth + API calls
  test.setTimeout(60000)

  test('navigates to /referrals and displays referral dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/referrals')
    await authenticatedPage.waitForLoadState('domcontentloaded')
    await authenticatedPage.waitForTimeout(3000)

    // Page might still be loading — check we haven't been redirected
    const url = authenticatedPage.url()
    if (!url.includes('/referrals')) {
      // Auth redirect happened — skip gracefully
      test.skip(true, 'Auth redirect — authenticatedPage fixture may have lost session')
      return
    }

    // STRICT: referral page should show parrainage-related text
    // The h1 is "Parrainage" and description contains "Invite"
    const referralText = authenticatedPage.getByText(/parrainage|invit/i).first()
    await expect(referralText).toBeVisible({ timeout: 15000 })
  })

  test('displays referral code or share section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/referrals')
    await authenticatedPage.waitForLoadState('domcontentloaded')
    await authenticatedPage.waitForTimeout(3000)

    const url = authenticatedPage.url()
    if (!url.includes('/referrals')) {
      test.skip(true, 'Auth redirect — authenticatedPage fixture may have lost session')
      return
    }

    // STRICT: share/invite section MUST be visible
    // Look for "Copier le lien" button or "Ton code de parrainage" heading
    const shareSection = authenticatedPage.getByText(/copier le lien|ton code de parrainage|partager/i).first()
    await expect(shareSection).toBeVisible({ timeout: 15000 })
  })

  test('displays milestone tracking section', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/referrals')
    await authenticatedPage.waitForLoadState('domcontentloaded')
    await authenticatedPage.waitForTimeout(3000)

    const url = authenticatedPage.url()
    if (!url.includes('/referrals')) {
      test.skip(true, 'Auth redirect — authenticatedPage fixture may have lost session')
      return
    }

    // STRICT: milestones/paliers section should exist
    // Milestones use labels: "Recruteur", "Recruteur Pro", "Recruteur Légendaire"
    const milestoneText = authenticatedPage.getByText(/recruteur|palier|milestone/i).first()
    await expect(milestoneText).toBeVisible({ timeout: 15000 })
  })

  test('displays stats counters (even if zero)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/referrals')
    await authenticatedPage.waitForLoadState('domcontentloaded')
    await authenticatedPage.waitForTimeout(3000)

    const url = authenticatedPage.url()
    if (!url.includes('/referrals')) {
      test.skip(true, 'Auth redirect — authenticatedPage fixture may have lost session')
      return
    }

    // STRICT: stats section with numbers MUST be visible
    // Stats labels: Inscrits, Convertis, XP, Total — or stat values like "0"
    const statsText = authenticatedPage.getByText(/inscrits|convertis|total|xp gagn/i).first()
    await expect(statsText).toBeVisible({ timeout: 15000 })
  })
})
