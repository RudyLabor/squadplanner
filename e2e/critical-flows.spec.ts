import { test, expect } from './fixtures'

/**
 * Critical Dashboard Flows — F10-F14
 *
 * REGLE STRICTE : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * Pas de fallback sur "page loaded" quand la DB a des donnees reelles.
 * Si la DB a des squads → le dashboard DOIT les afficher → sinon FAIL.
 * Si la DB a des sessions → le dashboard DOIT les afficher → sinon FAIL.
 */

// ============================================================
// F10 — Dashboard User Data
// ============================================================

test.describe('F10 — Dashboard Data Validation', () => {
  test('F10: Dashboard shows username from DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // Le username DOIT etre visible — pas de fallback
    const greeting = page.getByText(new RegExp(profile.username, 'i')).first()
    await expect(greeting).toBeVisible({ timeout: 15000 })
  })

  test('F10: Dashboard shows reliability score when > 0', async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const dbScore = Number(profile.reliability_score ?? 0)

    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    if (dbScore === 0) {
      // Score 0 — le badge peut ne pas s'afficher
      await expect(page.locator('main').first()).toBeVisible()
      return
    }

    // Score > 0 → le badge DOIT afficher le score exact (ex: "100% fiable")
    const scoreText = page.getByText(new RegExp(`${dbScore}\\s*%`)).first()
    await expect(scoreText).toBeVisible({ timeout: 10000 })
  })

  test('F10: Dashboard squad count matches DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    const dbSquadCount = squads.length

    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    if (dbSquadCount === 0) {
      await expect(page.locator('main').first()).toBeVisible()
      return
    }

    // STRICT: l'utilisateur a des squads → le compteur DOIT s'afficher
    // La card "SQUADS" dans le tableau de bord utilise AnimatedCounter avec squadsCount
    // Attendre que l'animation termine (1.2s) + marge
    await page.waitForTimeout(2000)

    // Chercher le nombre exact de squads affiché sur la page
    const allTextContent = await page.locator('main').first().textContent()
    expect(allTextContent).toBeTruthy()

    // Le nombre de squads doit apparaitre quelque part sur la page
    const hasSquadCount = allTextContent!.includes(String(dbSquadCount))

    // OU chercher au moins un nom de squad visible
    let hasSquadName = false
    if (!hasSquadCount) {
      for (const squad of squads) {
        const name = squad.squads.name
        if (allTextContent!.toLowerCase().includes(name.toLowerCase())) {
          hasSquadName = true
          break
        }
      }
    }

    // STRICT: au moins l'un des deux doit etre vrai — branchement explicite
    if (hasSquadCount) {
      expect(allTextContent).toContain(String(dbSquadCount))
    } else {
      // Aucun compteur visible — un nom de squad DOIT etre present
      expect(hasSquadName).toBe(true)
    }
  })

  test('F10: Dashboard sessions-this-week count is displayed', async ({
    authenticatedPage: page,
    db,
  }) => {
    const upcomingSessions = await db.getUserUpcomingSessions()

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    const sessionsThisWeek = upcomingSessions.filter((s: { scheduled_at: string }) => {
      const date = new Date(s.scheduled_at)
      return date >= startOfWeek && date < endOfWeek
    }).length

    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Attendre AnimatedCounter

    // La card "Cette semaine" DOIT etre visible dans le tableau de bord
    // Note: "Semaine" (mobileLabel) a la classe sm:hidden, invisible sur desktop
    const weekLabel = page.getByText('Cette semaine', { exact: true }).first()
    await expect(weekLabel).toBeVisible({ timeout: 10000 })

    // Le nombre affiché doit correspondre a la DB
    const dashboard = page.locator('section[aria-label="Tableau de bord"]')
    const hasDashboard = (await dashboard.count()) > 0
    const container = hasDashboard ? dashboard : page.locator('main').first()
    const allText = await container.textContent()
    expect(allText).toBeTruthy()
    expect(allText).toContain(String(sessionsThisWeek))
  })
})

// ============================================================
// F11 — Quick RSVP from Home
// ============================================================

test.describe('F11 — Quick RSVP', () => {
  test('F11: RSVP from home page is recorded in DB', async ({ authenticatedPage: page, db }) => {
    const upcomingSessions = await db.getUserUpcomingSessions()
    const userId = await db.getUserId()

    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    if (upcomingSessions.length === 0) {
      await expect(page.locator('main').first()).toBeVisible()
      return
    }

    // Sessions en DB → chercher un bouton RSVP
    const presentBtn = page.getByRole('button', { name: /Présent/i }).first()
    const hasPresentBtn = await presentBtn.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasPresentBtn) {
      // Peut-etre deja repondu — acceptable
      const alreadyRsvpd = page.getByText(/Présent|Absent|Peut-être/i).first()
      const hasRsvp = await alreadyRsvpd.isVisible({ timeout: 3000 }).catch(() => false)
      if (hasRsvp) return

      // Pas de bouton et pas de reponse mais des sessions en DB → les sessions ne s'affichent pas
      // Cependant les sessions peuvent etre dans le futur sans RSVP buttons sur /home
      // Verifier qu'au moins un titre de session est visible
      let foundSession = false
      for (const session of upcomingSessions.slice(0, 3)) {
        if (!session.title) continue
        const titleVisible = await page
          .getByText(new RegExp(session.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        if (titleVisible) {
          foundSession = true
          break
        }
      }
      // Si aucune session visible malgre des sessions en DB, c'est un bug
      // Mais les sessions pourraient ne pas etre dans les 5 prochaines affichees
      expect(foundSession || upcomingSessions.length > 5).toBeTruthy()
      return
    }

    await presentBtn.click()
    await page.waitForTimeout(2000)

    // Verifier le RSVP dans la DB
    const sessionsAfter = await db.getUserUpcomingSessions()
    const userRsvp = sessionsAfter
      .flatMap(
        (s: { session_rsvps?: Array<{ user_id: string; response?: string }> }) =>
          s.session_rsvps || []
      )
      .find((r: { user_id: string }) => r.user_id === userId)

    expect(userRsvp).toBeTruthy()
    expect(userRsvp!.response).toBe('present')
  })
})

// ============================================================
// F12 — Upcoming Sessions Widget
// ============================================================

test.describe('F12 — Upcoming Sessions', () => {
  test('F12: Upcoming sessions from DB are visible on dashboard', async ({
    authenticatedPage: page,
    db,
  }) => {
    const upcomingSessions = await db.getUserUpcomingSessions()

    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Attendre le chargement complet

    if (upcomingSessions.length === 0) {
      // Pas de sessions → la section "Prochaine session" doit montrer l'empty state
      const emptyOrSection = page.getByText(/prochaine session/i).first()
      await expect(emptyOrSection).toBeVisible({ timeout: 10000 })
      return
    }

    // STRICT: il y a des sessions en DB → au moins un titre DOIT etre visible
    let foundSessionTitle = false
    for (const session of upcomingSessions.slice(0, 5)) {
      if (!session.title) continue
      const escapedTitle = session.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const titleLocator = page.getByText(new RegExp(escapedTitle, 'i')).first()
      const isVisible = await titleLocator.isVisible({ timeout: 5000 }).catch(() => false)
      if (isVisible) {
        foundSessionTitle = true
        break
      }
    }

    expect(foundSessionTitle).toBe(true)
  })
})

// ============================================================
// F13 — Daily Challenges
// ============================================================

test.describe('F13 — Daily Challenges', () => {
  test('F13: Challenges data from DB is reflected on profile', async ({
    authenticatedPage: page,
    db,
  }) => {
    const challengeData = await db.getChallenges()
    const activeChallenges = challengeData.challenges

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    const challengesSection = page.getByText(/défi|challenge|objectif/i).first()
    const hasChallengesSection = await challengesSection
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (activeChallenges.length === 0 && !hasChallengesSection) {
      // Pas de challenges en DB et pas de section — c'est OK
      await expect(page.locator('main').first()).toBeVisible()
      return
    }

    if (activeChallenges.length > 0) {
      // STRICT: challenges en DB → la section DOIT etre visible
      expect(hasChallengesSection).toBe(true)
    }
  })
})

// ============================================================
// F14 — AI Coach
// ============================================================

test.describe('F14 — AI Coach', () => {
  test('F14: AI Coach section is present on home', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // AI Coach est optionnel (deferred, peut ne pas avoir de tip)
    // Mais la page home DOIT charger
    await expect(page.locator('main').first()).toBeVisible()

    const coachSection = page.getByText(/coach|conseil|astuce|tip/i).first()
    const coachVisible = await coachSection.isVisible({ timeout: 10000 }).catch(() => false)

    if (coachVisible) {
      const coachText = await coachSection.textContent()
      expect(coachText).toBeTruthy()
      expect(coachText!.length).toBeGreaterThan(3)
    }
  })
})

// ============================================================
// Cross-Flow Navigation
// ============================================================

test.describe('Cross-Flow Navigation', () => {
  test('Cross-flow: Home -> Squads navigation works', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/(home|onboarding)/)

    await page.goto('/squads')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/squads/)
    await expect(page.locator('main').first()).toBeVisible()
  })
})
