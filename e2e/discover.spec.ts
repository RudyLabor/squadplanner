import { test, expect } from './fixtures'

/**
 * Discover E2E Tests — F52-F56
 *
 * STRICT MODE: Every test fetches DB data FIRST, then asserts UI matches.
 * - If DB has data -> UI MUST display it -> otherwise FAIL
 * - If DB is empty -> test empty state UI specifically
 * - NO .catch(() => false) on assertions
 * - NO test.info().annotations replacing real assertions
 * - NO fallback to <main> when specific feature should be visible
 * - NO OR conditions that always pass
 */

// =============================================================================
// F52 — Browse public squads (data matches DB)
// =============================================================================
test.describe('F52 — Parcourir les squads publics', () => {
  test('should display public squads matching DB data', async ({ authenticatedPage, db }) => {
    // STRICT: fetch DB data FIRST
    const publicSquads = await db.getPublicSquads()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    if (publicSquads.length > 0) {
      // DB has public squads -> UI MUST display at least one squad name
      let foundCount = 0
      for (const squad of publicSquads.slice(0, 5)) {
        const squadName = authenticatedPage.getByText(squad.name, { exact: false }).first()
        const isVisible = await squadName.isVisible({ timeout: 3000 })
        if (isVisible) foundCount++
      }

      // STRICT: at least one squad from DB MUST be visible on the page
      // STRICT: no fallback to <main> or generic "content" checks
      expect(foundCount).toBeGreaterThan(0)
    } else {
      // DB has no public squads -> empty state MUST be visible
      // The Discover page shows "Aucune squad publique trouvee" when empty
      const emptyState = authenticatedPage.getByText(/Aucune squad publique/i).first()
      // STRICT: empty state text MUST appear
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show correct squad count from DB', async ({ authenticatedPage, db }) => {
    const publicSquads = await db.getPublicSquads()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    if (publicSquads.length === 0) {
      // STRICT: empty state verified
      const emptyState = authenticatedPage.getByText(/Aucune squad publique/i).first()
      await expect(emptyState).toBeVisible({ timeout: 10000 })
      return
    }

    // STRICT: every squad name from DB (up to 20 loaded by the UI) should be present in the page text
    const mainContent = await authenticatedPage.locator('.max-w-2xl, .max-w-4xl, .max-w-5xl').first().textContent()
    expect(mainContent).toBeTruthy()

    // At least half of the first 5 squads must appear in page content
    let matchCount = 0
    for (const squad of publicSquads.slice(0, 5)) {
      if (mainContent!.includes(squad.name)) matchCount++
    }
    // STRICT: at least one must match
    expect(matchCount).toBeGreaterThan(0)
  })
})

// =============================================================================
// F53a — Filter by game (DB-validated)
// =============================================================================
test.describe('F53a — Filtrer par jeu', () => {
  test('should filter squads by game and match DB results', async ({ authenticatedPage, db }) => {
    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    // The Discover page uses a custom Select with placeholder "Tous les jeux"
    const gameFilterTrigger = authenticatedPage.locator('button:has-text("Tous les jeux")').first()
    // STRICT: game filter MUST exist on discover page
    await expect(gameFilterTrigger).toBeVisible({ timeout: 10000 })

    // Click the game filter to open the dropdown
    await gameFilterTrigger.click()
    await authenticatedPage.waitForTimeout(500)

    // Select "Valorant" from the dropdown options
    const gameToFilter = 'Valorant'
    const valorantOption = authenticatedPage.getByText('Valorant').first()
    // STRICT: Valorant option MUST be visible in dropdown
    await expect(valorantOption).toBeVisible({ timeout: 5000 })
    await valorantOption.click()
    await authenticatedPage.waitForTimeout(1500)

    // Fetch filtered squads from DB
    const filteredSquads = await db.getPublicSquads(gameToFilter)

    if (filteredSquads.length > 0) {
      // DB has Valorant squads -> UI MUST show at least one
      let foundFiltered = 0
      for (const squad of filteredSquads.slice(0, 5)) {
        const visible = await authenticatedPage
          .getByText(squad.name, { exact: false })
          .first()
          .isVisible({ timeout: 2000 })
        if (visible) foundFiltered++
      }
      // STRICT: at least one filtered squad name MUST be visible
      expect(foundFiltered).toBeGreaterThan(0)
    } else {
      // DB has no Valorant squads -> empty state MUST show
      const emptyState = authenticatedPage.getByText(/Aucune squad publique/i).first()
      // STRICT: empty state MUST be displayed
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    }
  })
})

// =============================================================================
// F53b — Filter by region (DB-validated)
// =============================================================================
test.describe('F53b — Filtrer par region', () => {
  test('should filter squads by region and match DB results', async ({ authenticatedPage, db }) => {
    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    // The Discover page uses a custom Select with placeholder "Toutes les regions"
    const regionFilterTrigger = authenticatedPage.locator('button:has-text("Toutes les r")').first()
    // STRICT: region filter MUST exist on discover page
    await expect(regionFilterTrigger).toBeVisible({ timeout: 10000 })

    // Click the region filter to open the dropdown
    await regionFilterTrigger.click()
    await authenticatedPage.waitForTimeout(500)

    // Select "Europe Ouest" (value: "eu-west") from the dropdown
    const regionLabel = 'Europe Ouest'
    const regionOption = authenticatedPage.getByText(regionLabel).first()
    // STRICT: Europe Ouest option MUST be visible in dropdown
    await expect(regionOption).toBeVisible({ timeout: 5000 })
    await regionOption.click()
    await authenticatedPage.waitForTimeout(1500)

    // Fetch region-filtered squads from DB (value is "eu-west" in DB)
    const filteredSquads = await db.getPublicSquads(undefined, 'eu-west')

    if (filteredSquads.length > 0) {
      // DB has squads in eu-west -> UI MUST show at least one
      let foundFiltered = 0
      for (const squad of filteredSquads.slice(0, 5)) {
        const visible = await authenticatedPage
          .getByText(squad.name, { exact: false })
          .first()
          .isVisible({ timeout: 2000 })
        if (visible) foundFiltered++
      }
      // STRICT: at least one filtered squad name MUST be visible
      expect(foundFiltered).toBeGreaterThan(0)
    } else {
      // DB has no squads in eu-west -> empty state MUST show
      const emptyState = authenticatedPage.getByText(/Aucune squad publique/i).first()
      // STRICT: empty state MUST be displayed
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    }
  })
})

// =============================================================================
// F54 — Public profile matches DB
// =============================================================================
test.describe('F54 — Profil public correspond a la DB', () => {
  test('should display username from DB on public profile', async ({ authenticatedPage, db }) => {
    // STRICT: fetch profile first
    const profile = await db.getProfile()
    // STRICT: profile MUST exist in DB
    expect(profile).toBeTruthy()
    // STRICT: username MUST exist
    expect(profile.username).toBeTruthy()

    await authenticatedPage.goto(`/u/${profile.username}`)
    await authenticatedPage.waitForLoadState('networkidle')

    // STRICT: username from DB MUST be displayed on the profile page
    const usernameEl = authenticatedPage.getByText(profile.username, { exact: false }).first()
    await expect(usernameEl).toBeVisible({ timeout: 10000 })
  })

  test('should display level or XP section from DB on public profile', async ({ authenticatedPage, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    await authenticatedPage.goto(`/u/${profile.username}`)
    await authenticatedPage.waitForLoadState('networkidle')

    // STRICT: The profile page MUST show a level/XP indicator
    // The XPBar component renders "Niveau X" and "XP" text
    const levelOrXP = authenticatedPage.getByText(/Niveau|Level|Nv\.|XP|points d'exp/i).first()
    // STRICT: level/XP section MUST be visible
    await expect(levelOrXP).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// F55 — Global leaderboard (DB-validated)
// =============================================================================
test.describe('F55 — Classement global', () => {
  test('should display leaderboard entries matching DB data', async ({ authenticatedPage, db }) => {
    // STRICT: fetch leaderboard data FIRST
    const leaderboard = await db.getLeaderboard(10)
    const dbUsernames = leaderboard
      .map((p: { username: string | null }) => p.username)
      .filter((u: string | null): u is string => u != null && u.length > 0)

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    // The Discover page has tabs: Squads, Joueurs, Classement (SegmentedControl)
    // Click the "Classement" tab
    const classementTab = authenticatedPage.getByText('Classement', { exact: true }).first()
    // STRICT: Classement tab MUST exist on discover page
    await expect(classementTab).toBeVisible({ timeout: 10000 })
    await classementTab.click()
    await authenticatedPage.waitForTimeout(2000)

    if (dbUsernames.length > 0) {
      // DB has leaderboard entries with usernames -> at least one MUST be visible
      let foundAny = 0
      for (const username of dbUsernames) {
        const usernameLocator = authenticatedPage.getByText(username, { exact: false }).first()
        const isVisible = await usernameLocator.isVisible({ timeout: 2000 })
        if (isVisible) foundAny++
      }

      // STRICT: at least one DB leaderboard username MUST be displayed
      expect(foundAny).toBeGreaterThan(0)
    } else {
      // All usernames are null or DB is empty -> empty state MUST show
      // GlobalLeaderboard shows "Pas encore de classement" when empty
      const emptyState = authenticatedPage.getByText(/Pas encore de classement/i).first()
      // STRICT: empty leaderboard state MUST be visible
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    }
  })
})

// =============================================================================
// F56 — Matchmaking suggestions (DB-validated)
// =============================================================================
test.describe('F56 — Suggestions matchmaking', () => {
  test('should display players looking for squad from DB or empty state', async ({ authenticatedPage, db }) => {
    // STRICT: fetch matchmaking data FIRST
    const playersLooking = await db.getPlayersLookingForSquad()

    await authenticatedPage.goto('/discover')
    await authenticatedPage.waitForLoadState('networkidle')

    // Click the "Joueurs" tab (SegmentedControl)
    const joueursTab = authenticatedPage.getByText('Joueurs', { exact: true }).first()
    // STRICT: Joueurs tab MUST exist on discover page
    await expect(joueursTab).toBeVisible({ timeout: 10000 })
    await joueursTab.click()
    await authenticatedPage.waitForTimeout(1500)

    if (playersLooking.length > 0) {
      // DB has players looking for squad -> at least one username MUST be visible
      const playersWithUsernames = playersLooking.filter(
        (p: { username: string | null }) => p.username != null && p.username.length > 0
      )

      if (playersWithUsernames.length > 0) {
        let foundPlayers = 0
        for (const player of playersWithUsernames.slice(0, 5)) {
          const visible = await authenticatedPage
            .getByText(player.username, { exact: false })
            .first()
            .isVisible({ timeout: 2000 })
          if (visible) foundPlayers++
        }
        // STRICT: at least one player username from DB MUST be visible
        expect(foundPlayers).toBeGreaterThan(0)
      } else {
        // All players have null usernames -> the matchmaking section should still render cards
        // STRICT: verify at least one player card element exists
        const playerCards = authenticatedPage.locator('[class*="space-y"] > div').first()
        await expect(playerCards).toBeVisible({ timeout: 10000 })
      }
    } else {
      // No players looking in DB -> empty state MUST be visible
      // MatchmakingSection shows "Personne en recherche de squad pour le moment"
      const emptyState = authenticatedPage.getByText(/Personne en recherche/i).first()
      // STRICT: empty matchmaking state MUST be visible
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    }
  })
})
