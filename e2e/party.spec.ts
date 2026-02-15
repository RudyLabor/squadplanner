import { test, expect } from './fixtures'

/**
 * Party E2E Tests — F41-F45 — STRICT MODE
 *
 * REGLE STRICTE : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * Si la DB a des squads → la page party DOIT les afficher → sinon FAIL.
 * Si la DB est vide → le empty state DOIT s'afficher → sinon FAIL.
 * Pas de `.catch(() => false)` sur les assertions.
 * Pas de fallback sur `<main>` quand des squad cards doivent etre visibles.
 * Pas de `toBeGreaterThanOrEqual(0)` — toujours passes.
 * Pas de OR conditions qui passent toujours.
 * Pas de try/catch qui avale les erreurs.
 */

// =============================================================================
// F41 — Party page shows user's squads from DB
// =============================================================================
test.describe('F41 — Page Party affiche les squads du user', () => {

  test('F41a: Squad names from DB appear on the party page', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()
    // Filter out E2E test squads to use real ones
    const realSquads = userSquads.filter((s) => !s.squads.name.includes('E2E Test'))
    const targetSquads = realSquads.length > 0 ? realSquads : userSquads

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: "Party" heading MUST be visible (h1 in Party.tsx)
    await expect(authenticatedPage.getByRole('heading', { name: /Party/i })).toBeVisible({ timeout: 15000 })

    if (targetSquads.length > 0) {
      // DB has squads → at least one squad name MUST appear on the party page
      let foundCount = 0
      for (const membership of targetSquads.slice(0, 5)) {
        const squadName = membership.squads.name
        const nameLocator = authenticatedPage.getByText(squadName, { exact: false }).first()
        const isVisible = await nameLocator.isVisible({ timeout: 5000 }).catch(() => false)
        if (isVisible) foundCount++
      }
      // STRICT: at least one squad name from DB MUST be on the page
      expect(foundCount).toBeGreaterThan(0)
    } else {
      // DB has no squads → empty state "Parle avec ta squad" or "Trouver une squad" MUST be visible
      // PartyEmptyState renders "Parle avec ta squad" heading and "Trouver une squad" button
      const emptyHeading = authenticatedPage.getByText(/Parle avec ta squad/i).first()
      // STRICT: empty state MUST be visible when DB has no squads
      await expect(emptyHeading).toBeVisible({ timeout: 10000 })
    }
  })

  test('F41b: Number of visible squad cards matches DB count', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    if (userSquads.length === 0) {
      // STRICT: no squads → empty state MUST be visible (not just <main>)
      await expect(authenticatedPage.getByText(/Parle avec ta squad/i)).toBeVisible({ timeout: 10000 })
      return
    }

    // DB has squads → count visible squad names
    let visibleSquadCount = 0
    for (const s of userSquads) {
      const nameLocator = authenticatedPage.getByText(s.squads.name, { exact: false }).first()
      const isVisible = await nameLocator.isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) visibleSquadCount++
    }

    // STRICT: visible count MUST be > 0 (DB has squads → page MUST show them)
    expect(visibleSquadCount).toBeGreaterThan(0)
    // STRICT: visible count MUST match DB count exactly (all user squads are rendered)
    expect(visibleSquadCount).toBe(userSquads.length)
  })

  test('F41c: Party subtitle shows correct squad count from DB', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    if (userSquads.length === 0) {
      // STRICT: no squads → subtitle MUST say "Rejoins une squad" (Party.tsx line 189)
      await expect(authenticatedPage.getByText(/Rejoins une squad/i)).toBeVisible({ timeout: 10000 })
      return
    }

    // DB has squads → subtitle MUST show "{count} squad(s)" (Party.tsx line 188)
    const expectedSubtitle = `${userSquads.length} squad${userSquads.length > 1 ? 's' : ''}`
    const subtitleLocator = authenticatedPage.getByText(expectedSubtitle).first()
    // STRICT: the exact squad count text MUST be visible
    await expect(subtitleLocator).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// F42 — Join party button (WebRTC resilience test)
// =============================================================================
test.describe('F42 — Rejoindre la party', () => {

  test('F42: Rejoindre button is visible and page stays functional after click', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    if (userSquads.length === 0) {
      // STRICT: no squads → empty state MUST show "Trouver une squad" button instead
      const findSquadBtn = authenticatedPage.getByRole('link', { name: /Trouver une squad/i })
      await expect(findSquadBtn).toBeVisible({ timeout: 10000 })
      return
    }

    // STRICT: "Rejoindre" button MUST be visible (PartySquadCard renders it)
    const joinBtn = authenticatedPage.getByRole('button', { name: /Rejoindre/i }).first()
    await expect(joinBtn).toBeVisible({ timeout: 10000 })

    // Click join — WebRTC will likely fail in test env, but page MUST remain functional
    await joinBtn.click()
    await authenticatedPage.waitForTimeout(3000)

    // STRICT: page body MUST still be visible (no crash, no blank screen)
    await expect(authenticatedPage.locator('body')).toBeVisible()

    // STRICT: "Party" heading MUST still be visible (page didn't navigate away)
    await expect(authenticatedPage.getByRole('heading', { name: /Party/i })).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// F43 — Voice controls not visible when disconnected
// =============================================================================
test.describe('F43 — Controles vocaux (etat deconnecte)', () => {

  test('F43: No mute/leave controls visible when not connected to voice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: "Party" heading MUST be visible (page loaded)
    await expect(authenticatedPage.getByRole('heading', { name: /Party/i })).toBeVisible({ timeout: 15000 })

    // STRICT: mute/unmute button MUST NOT be visible when disconnected
    const muteBtn = authenticatedPage.getByRole('button', { name: /Mute|Couper le micro|Unmute/i }).first()
    // STRICT: this assertion MUST pass — button should be hidden
    await expect(muteBtn).not.toBeVisible({ timeout: 3000 })

    // STRICT: leave/raccrocher button MUST NOT be visible when disconnected
    const leaveBtn = authenticatedPage.getByRole('button', { name: /Quitter|Leave|Raccrocher/i }).first()
    await expect(leaveBtn).not.toBeVisible({ timeout: 3000 })

    // STRICT: "En ligne" indicator MUST NOT be visible when disconnected
    const onlineIndicator = authenticatedPage.getByText('En ligne').first()
    await expect(onlineIndicator).not.toBeVisible({ timeout: 3000 })
  })
})

// =============================================================================
// F44 — Empty state or squad cards render correctly
// =============================================================================
test.describe('F44 — Etat de la page party', () => {

  test('F44: Party page renders squad cards when DB has squads, or empty state when empty', async ({ authenticatedPage, db }) => {
    const userSquads = await db.getUserSquads()

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: Party heading MUST be visible
    await expect(authenticatedPage.getByRole('heading', { name: /Party/i })).toBeVisible({ timeout: 15000 })

    if (userSquads.length > 0) {
      // STRICT: DB has squads → "Rejoindre" buttons MUST be visible (PartySquadCard)
      const joinButtons = authenticatedPage.getByRole('button', { name: /Rejoindre/i })
      const joinCount = await joinButtons.count()
      // STRICT: at least one Rejoindre button MUST exist
      expect(joinCount).toBeGreaterThan(0)

      // STRICT: the first squad name from DB MUST be visible on the page
      const firstSquadName = userSquads[0].squads.name
      const nameLocator = authenticatedPage.getByText(firstSquadName, { exact: false }).first()
      await expect(nameLocator).toBeVisible({ timeout: 5000 })
    } else {
      // STRICT: DB has no squads → PartyEmptyState MUST render
      // "Parle avec ta squad" heading from PartyEmptyState
      await expect(authenticatedPage.getByText(/Parle avec ta squad/i)).toBeVisible({ timeout: 10000 })
      // "Trouver une squad" button from PartyEmptyState
      await expect(authenticatedPage.getByText(/Trouver une squad/i)).toBeVisible({ timeout: 5000 })
    }
  })
})

// =============================================================================
// F45 — Page structure and accessibility
// =============================================================================
test.describe('F45 — Structure page party', () => {

  test('F45: Party page has correct semantic structure', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: <main> with aria-label="Party vocale" MUST be visible (Party.tsx line 149)
    const main = authenticatedPage.locator('main[aria-label="Party vocale"]')
    await expect(main).toBeVisible({ timeout: 15000 })

    // STRICT: h1 "Party" heading MUST be visible
    const heading = authenticatedPage.getByRole('heading', { name: /Party/i })
    await expect(heading).toBeVisible({ timeout: 5000 })

    // STRICT: navigation MUST be present (bottom nav or sidebar)
    const nav = authenticatedPage.locator('nav, [role="navigation"]').first()
    await expect(nav).toBeVisible({ timeout: 5000 })
  })

  test('F45: Party page has no JS crash (body remains visible)', async ({ authenticatedPage }) => {
    // Collect JS errors during page load
    const jsErrors: string[] = []
    authenticatedPage.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })

    await authenticatedPage.goto('/party')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(2000)

    // STRICT: body MUST still be visible (no white screen from JS crash)
    await expect(authenticatedPage.locator('body')).toBeVisible()

    // STRICT: main Party content MUST be visible (not just body)
    await expect(authenticatedPage.locator('main[aria-label="Party vocale"]')).toBeVisible({ timeout: 10000 })

    // STRICT: no critical JS errors (filter out non-critical WebRTC errors)
    const criticalErrors = jsErrors.filter(
      (err) => !err.includes('WebRTC') && !err.includes('LiveKit') && !err.includes('Agora')
        && !err.includes('ResizeObserver') && !err.includes('AbortError')
    )
    // STRICT: no critical JS errors during page load
    expect(criticalErrors).toHaveLength(0)
  })
})
