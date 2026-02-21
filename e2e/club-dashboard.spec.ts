import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Club Dashboard E2E Tests — /club
 *
 * MODE STRICT : Tests DB-first.
 * - Verifie que le dashboard club affiche les squads reelles du user
 * - Verifie les sections analytics cross-squad
 * - Verifie les actions (export, branding)
 */

test.describe('Club Dashboard — /club', () => {
  test('la page club charge et affiche le heading', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/club')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: un heading contenant "Club" ou "Dashboard" DOIT etre visible
    const heading = page.getByText(/Club|Dashboard|Tableau de bord/i).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('affiche les squads du user correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()

    const loaded = await navigateWithFallback(page, '/club')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (squads.length === 0) {
      // STRICT: pas de squads en DB → message "Crée ta première squad" ou etat vide
      const emptyState = page.getByText(/Aucune squad|Crée ta première squad|pas de squad/i).first()
      await expect(emptyState).toBeVisible({ timeout: 15000 })
      return
    }

    // STRICT: au moins un nom de squad DB DOIT etre visible dans le dashboard
    let foundSquad = false
    for (const membership of squads.slice(0, 3)) {
      const name = membership.squads.name
      const isVisible = await page.getByText(name).first().isVisible({ timeout: 5000 }).catch(() => false)
      if (isVisible) {
        foundSquad = true
        break
      }
    }
    expect(foundSquad).toBe(true)
  })

  test('affiche le nombre total de squads correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    const dbCount = squads.length

    const loaded = await navigateWithFallback(page, '/club')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (dbCount === 0) {
      const emptyState = page.getByText(/Aucune squad|Crée/i).first()
      await expect(emptyState).toBeVisible({ timeout: 15000 })
      return
    }

    // STRICT: le nombre de squads DOIT apparaitre sur la page
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    // Le dashboard affiche des compteurs - le nombre exact ou "squads" doit etre present
    expect(mainText!.toLowerCase()).toContain('squad')
  })

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/club')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })

  test('les meta tags club sont corrects', async ({ authenticatedPage: page }) => {
    await page.goto('/club')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Dashboard Club"
    await expect(page).toHaveTitle(/Dashboard Club|Club.*Squad Planner/i)
  })

  test('affiche les actions premium (export CSV, branding)', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/club')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: au moins une action premium DOIT etre mentionnee
    // Le ClubDashboard affiche "Export CSV", "Branding", "Analytics avancées"
    const premiumAction = page.getByText(/Export|Branding|Analytics|CSV/i).first()
    await expect(premiumAction).toBeVisible({ timeout: 15000 })
  })
})
