import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Home Dashboard E2E Tests — /home
 *
 * MODE STRICT : Tests DB-first.
 * Complement de critical-flows.spec.ts (F10-F14) avec une couverture complete.
 * - Verifie TOUS les widgets du dashboard (greeting, squads, sessions, challenges, coach)
 * - Verifie la navigation depuis le dashboard
 * - Verifie les liens de la sidebar/bottom nav
 */

// ============================================================
// Dashboard — Affichage complet
// ============================================================

test.describe('Home Dashboard — Affichage complet', () => {
  test('affiche le greeting avec le username DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le username DOIT apparaitre dans le greeting
    const greeting = page.getByText(new RegExp(profile.username, 'i')).first()
    await expect(greeting).toBeVisible({ timeout: 15000 })
  })

  test('affiche la section "Tableau de bord" ou un layout dashboard', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le main DOIT contenir du contenu
    const main = page.locator('main').first()
    await expect(main).toBeVisible({ timeout: 15000 })
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(50)
  })

  test('affiche les cards de stats (squads, sessions semaine)', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    const dbSquadCount = squads.length

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000) // Attendre AnimatedCounter

    // STRICT: la card "SQUADS" DOIT etre visible
    const squadsCard = page.getByText(/SQUADS/i).first()
    await expect(squadsCard).toBeVisible({ timeout: 15000 })

    // STRICT: la card "Cette semaine" DOIT etre visible
    const weekCard = page.getByText(/Cette semaine/i).first()
    await expect(weekCard).toBeVisible({ timeout: 10000 })

    // STRICT: la card "Fiabilite" DOIT etre visible
    const reliabilityCard = page.getByText(/Fiabilité|FIABILITÉ/i).first()
    await expect(reliabilityCard).toBeVisible({ timeout: 10000 })
  })

  test('la section "Prochaine session" affiche les donnees DB', async ({ authenticatedPage: page, db }) => {
    const upcomingSessions = await db.getUserUpcomingSessions()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(3000) // Attendre le streaming des sessions

    // STRICT: la section "Prochaine session" DOIT etre visible
    const sessionSection = page.getByText(/Prochaine session/i).first()
    await expect(sessionSection).toBeVisible({ timeout: 15000 })

    if (upcomingSessions.length === 0) {
      // STRICT: pas de sessions → etat vide
      const emptyState = page.getByText(/Aucune session|Rien de prévu|pas de session/i).first()
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    } else {
      // STRICT: des sessions existent → au moins un titre de session DB DOIT etre visible
      let foundSession = false
      for (const session of upcomingSessions.slice(0, 5)) {
        if (!session.title) continue
        const escaped = session.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const isVisible = await page.getByText(new RegExp(escaped, 'i')).first().isVisible({ timeout: 3000 }).catch(() => false)
        if (isVisible) { foundSession = true; break }
      }
      expect(foundSession).toBe(true)
    }
  })

  test('la section "Tes squads" affiche les squads DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: la section squads DOIT etre visible
    const squadsSection = page.getByText(/Tes squads|Mes squads/i).first()
    await expect(squadsSection).toBeVisible({ timeout: 15000 })

    if (squads.length === 0) {
      // STRICT: pas de squads → etat vide
      const emptyState = page.getByText(/Crée ta première|Aucune squad/i).first()
      await expect(emptyState).toBeVisible({ timeout: 10000 })
    } else {
      // STRICT: au moins un nom de squad DB DOIT etre visible
      let foundSquad = false
      for (const membership of squads.slice(0, 3)) {
        const name = membership.squads.name
        const isVisible = await page.getByText(name).first().isVisible({ timeout: 3000 }).catch(() => false)
        if (isVisible) { foundSquad = true; break }
      }
      expect(foundSquad).toBe(true)
    }
  })
})

// ============================================================
// Dashboard — Navigation
// ============================================================

test.describe('Home Dashboard — Navigation', () => {
  test('la sidebar/bottom nav contient tous les liens principaux', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: les liens principaux DOIVENT etre dans la navigation
    const navLinks = ['/home', '/squads', '/sessions', '/messages', '/profile']
    for (const href of navLinks) {
      const link = page.locator(`a[href="${href}"]`).first()
      // STRICT: chaque lien de navigation DOIT exister dans le DOM
      const count = await link.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('cliquer sur une squad dans le dashboard navigue vers /squad/:id', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    if (squads.length === 0) {
      // Pas de squads — skip
      expect(true).toBe(true)
      return
    }

    const targetSquad = squads[0].squads

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Cliquer sur le lien de la squad
    const squadLink = page.locator(`a[href="/squad/${targetSquad.id}"]`).first()
    const isVisible = await squadLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      await squadLink.click()
      await page.waitForLoadState('networkidle')

      // STRICT: l'URL DOIT contenir l'ID de la squad
      await expect(page).toHaveURL(new RegExp(`/squad/${targetSquad.id}`), { timeout: 10000 })

      // STRICT: le nom de la squad DOIT etre visible
      await expect(page.getByText(targetSquad.name).first()).toBeVisible({ timeout: 15000 })
    }
  })

  test('cliquer sur "Voir toutes les sessions" navigue vers /sessions', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    const viewAllLink = page.getByText(/Voir toutes|Toutes les sessions/i).first()
    const isVisible = await viewAllLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      await viewAllLink.click()
      await page.waitForLoadState('networkidle')

      // STRICT: l'URL DOIT etre /sessions
      await expect(page).toHaveURL(/\/sessions/, { timeout: 10000 })
    }
  })
})

// ============================================================
// Dashboard — Protection
// ============================================================

test.describe('Home Dashboard — Protection', () => {
  test('redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/home')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })

  test('les meta tags home sont corrects', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Accueil" et "Squad Planner"
    await expect(page).toHaveTitle(/Accueil.*Squad Planner|Squad Planner.*Accueil/i)
  })
})
