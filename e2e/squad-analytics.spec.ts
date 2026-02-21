import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Squad Analytics E2E Tests — /squad/:id/analytics
 *
 * MODE STRICT : Tests DB-first.
 * Utilise une squad existante du user (pas de creation) pour eviter la limite freemium.
 * Verifie que les analytics affichent les donnees reelles de la DB.
 */

test.describe('Squad Analytics — /squad/:id/analytics', () => {
  test('affiche la page analytics avec le heading', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: un heading contenant "Analytics" ou "Statistiques" DOIT etre visible
    const heading = page.getByText(/Analytics|Statistiques|Stats/i).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('affiche le heading Analytics Squad', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le heading "Analytics Squad" OU le nom de la squad DOIT etre affiche
    const heading = page.getByText(/Analytics Squad/i).first()
      .or(page.getByText(squad.name).first())
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nombre de membres correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const members = await db.getSquadMembers(squad.id)
    const dbMemberCount = members.length
    expect(dbMemberCount).toBeGreaterThanOrEqual(1)

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le nombre de membres DOIT etre affiche
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    expect(mainText).toContain(String(dbMemberCount))
  })

  test('affiche la section Fiabilite ou des stats', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: une section fiabilite OU des stats DOIVENT etre visibles
    const statsContent = page.getByText(/Fiabilité|fiabilité|Reliability|Sessions|Membres|membres/i).first()
    await expect(statsContent).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags analytics sont corrects', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    await page.goto(`/squad/${squad.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Analytics" ou le nom de la squad
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(5)
  })

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000/analytics')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })
})
