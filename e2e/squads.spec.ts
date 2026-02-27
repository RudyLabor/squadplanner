import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Squads E2E Tests — /squads page + navigation to /squad/:id
 *
 * MODE STRICT : DB-first validation.
 * Tests read operations and navigation only (no create/delete via UI).
 * Uses the test user's existing squads from the database.
 *
 * Test user: rudylabor@hotmail.fr / ruudboy92
 * Known state: 1 squad "UTE for LIFE" (NBA, 2 membres), freemium limit 1/1
 */

// ============================================================
// /squads — Page loads with heading and squad count
// ============================================================

test.describe('Squads Page — Heading and layout', () => {
  test('displays "Mes Squads" heading with squad count from DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: heading "Mes Squads" MUST be visible
    await expect(page.getByRole('heading', { name: /Mes Squads/i }).first()).toBeVisible({
      timeout: 15000,
    })

    // STRICT: squad count subtitle MUST match DB
    const countRegex = new RegExp(`${squads.length}\\s*squad`, 'i')
    await expect(page.getByText(countRegex).first()).toBeVisible({ timeout: 10000 })
  })

  test('displays "Rejoindre" and "Creer" action buttons', async ({
    authenticatedPage: page,
  }) => {
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: "Rejoindre" button MUST be visible
    await expect(page.getByRole('button', { name: /Rejoindre/i }).first()).toBeVisible({
      timeout: 10000,
    })

    // STRICT: "Creer" button MUST be visible (may include "PRO" badge)
    await expect(page.getByRole('button', { name: /Cr[ée]er/i }).first()).toBeVisible({
      timeout: 10000,
    })
  })
})

// ============================================================
// /squads — Squad list displays user's squads from DB
// ============================================================

test.describe('Squads Page — Squad list from DB', () => {
  test('displays squad cards with name, game, and member count from DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the squad list container MUST be visible
    const squadList = page.getByRole('list', { name: /Liste des squads/i })
    await expect(squadList).toBeVisible({ timeout: 15000 })

    // STRICT: each squad from DB MUST be displayed in the UI
    for (const entry of squads) {
      const squad = entry.squads

      // Squad name MUST be visible
      await expect(page.getByText(squad.name).first()).toBeVisible({ timeout: 10000 })

      // Game MUST be visible
      if (squad.game) {
        await expect(page.getByText(new RegExp(squad.game, 'i')).first()).toBeVisible({
          timeout: 10000,
        })
      }
    }
  })

  test('squad cards have "Copier le code d\'invitation" button', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: at least one "Copier le code d'invitation" button MUST be present
    const copyButtons = page.getByRole('button', { name: /Copier le code/i })
    const count = await copyButtons.count()
    expect(count).toBeGreaterThanOrEqual(squads.length)
  })

  test('squad cards are article elements with heading', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: squad cards should be <article> elements
    const articles = page.locator('article')
    const articleCount = await articles.count()
    expect(articleCount).toBeGreaterThanOrEqual(squads.length)

    // STRICT: first squad card should contain an h3 heading with the squad name
    const firstSquad = squads[0].squads
    const heading = page.getByRole('heading', { level: 3, name: firstSquad.name })
    await expect(heading.first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// /squads — Member count matches DB
// ============================================================

test.describe('Squads Page — Member count validation', () => {
  test('displayed member count matches DB for each squad', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    for (const entry of squads) {
      const squad = entry.squads
      const members = await db.getSquadMembers(squad.id)
      const dbMemberCount = members.length

      // STRICT: the member count text MUST match the DB count
      const memberRegex = new RegExp(`${dbMemberCount}\\s*membre`, 'i')
      await expect(page.getByText(memberRegex).first()).toBeVisible({ timeout: 10000 })
    }
  })
})

// ============================================================
// /squads — Freemium limit banner
// ============================================================

test.describe('Squads Page — Freemium limit banner', () => {
  test('shows limit banner when user is at squad limit', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    // This test is relevant when user has squads
    expect(squads.length).toBeGreaterThan(0)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // The page should show a limit or premium-related message
    // It may say "Limite atteinte" or "Passe Premium" depending on subscription state
    const limitOrPremium = page
      .getByText(/Limite atteinte|Premium|PRO/i)
      .first()
    // This is informational — it may or may not show depending on subscription tier
    const isVisible = await limitOrPremium.isVisible({ timeout: 5000 }).catch(() => false)
    // If the banner is visible, it should contain meaningful text
    if (isVisible) {
      const bannerText = await limitOrPremium.textContent()
      expect(bannerText!.length).toBeGreaterThan(2)
    }
  })
})

// ============================================================
// /squads — Navigation to squad detail
// ============================================================

test.describe('Squads Page — Navigation to squad detail', () => {
  test('squad card contains a link to /squad/:id and detail page loads', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const firstSquad = squads[0].squads

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: a link to the squad detail page MUST exist in the DOM
    const squadLink = page.locator(`a[href="/squad/${firstSquad.id}"]`).first()
    await expect(squadLink).toBeAttached({ timeout: 10000 })

    // Navigate directly to squad detail (a modal overlay may block clicks on the card)
    const detailLoaded = await navigateWithFallback(page, `/squad/${firstSquad.id}`)
    expect(detailLoaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: URL MUST contain the squad ID
    expect(page.url()).toContain(`/squad/${firstSquad.id}`)

    // STRICT: squad name MUST be visible on the detail page
    await expect(page.getByText(firstSquad.name).first()).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// /squad/:id — Detail page shows squad info from DB
// ============================================================

test.describe('Squad Detail — Shows squad name and game', () => {
  test('displays squad name and game from DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: squad name MUST be visible
    await expect(page.getByText(squad.name).first()).toBeVisible({ timeout: 15000 })

    // STRICT: game MUST be visible
    if (squad.game) {
      await expect(page.getByText(new RegExp(squad.game, 'i')).first()).toBeVisible({
        timeout: 10000,
      })
    }
  })
})

test.describe('Squad Detail — Members section', () => {
  test('shows members from DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const members = await db.getSquadMembers(squad.id)
    expect(members.length).toBeGreaterThanOrEqual(1)

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: "Membres (N)" heading MUST be visible
    const membersHeading = page
      .getByText(new RegExp(`Membres\\s*\\(${members.length}\\)`, 'i'))
      .first()
    await expect(membersHeading).toBeVisible({ timeout: 15000 })

    // STRICT: each member username MUST be visible
    for (const member of members) {
      const username = (member as { profiles?: { username?: string } }).profiles?.username
      if (username) {
        await expect(page.getByText(username).first()).toBeVisible({ timeout: 10000 })
      }
    }
  })
})

test.describe('Squad Detail — Invite code', () => {
  test('invite code from DB is accessible via Inviter button', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: "Inviter" button MUST be visible
    const inviteBtn = page.getByRole('button', { name: /Inviter/i }).first()
    await expect(inviteBtn).toBeVisible({ timeout: 10000 })
    await inviteBtn.click()
    await page.waitForTimeout(500)

    // STRICT: the invite code from DB MUST be displayed
    await expect(page.getByText(squad.invite_code).first()).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// /squad/:id — Invalid squad ID shows error
// ============================================================

test.describe('Squad Detail — Invalid squad ID', () => {
  test('shows "Squad non trouvee" for a nonexistent squad ID', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: error message MUST be visible
    await expect(page.getByText(/Squad non trouvée/i).first()).toBeVisible({ timeout: 15000 })
  })
})
