import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Squad Analytics E2E Tests — /squad/:id/analytics
 *
 * MODE STRICT : Tests DB-first.
 * - Cree une squad de test avec des sessions et des RSVPs
 * - Verifie que les analytics affichent les donnees reelles de la DB
 * - Verifie les graphiques, compteurs, et sections
 */

test.describe('Squad Analytics — /squad/:id/analytics', () => {
  let testSquadId: string | null = null
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
    if (testSquadId) {
      try { await db.deleteTestSquad(testSquadId) } catch { /* cleanup */ }
      testSquadId = null
    }
  })

  test('affiche la page analytics avec le heading', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Analytics ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: un heading contenant "Analytics" ou "Statistiques" DOIT etre visible
    const heading = page.getByText(/Analytics|Statistiques|Stats/i).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nom de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squadName = `E2E Test Analytics Name ${Date.now()}`
    const testSquad = await db.createTestSquad({ name: squadName })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le nom de la squad DB DOIT etre affiche
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nombre de sessions correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Analytics Sessions ${Date.now()}` })
    testSquadId = testSquad.id

    // Creer 2 sessions de test
    const session1 = await db.createTestSession(testSquad.id, {
      title: `E2E Analytics Session 1 ${Date.now()}`,
      status: 'confirmed',
      scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = session1.id

    const session2 = await db.createTestSession(testSquad.id, {
      title: `E2E Analytics Session 2 ${Date.now()}`,
      status: 'proposed',
    })

    // Verifier en DB
    const dbSessions = await db.getSquadSessions(testSquad.id)
    const dbSessionCount = dbSessions.length
    expect(dbSessionCount).toBeGreaterThanOrEqual(2)

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le compteur de sessions DOIT reflechir la DB
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    // Le nombre de sessions doit apparaitre quelque part
    expect(mainText).toContain(String(dbSessionCount))

    // Cleanup session2
    await db.deleteTestSession(session2.id)
  })

  test('affiche le nombre de membres correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Analytics Members ${Date.now()}` })
    testSquadId = testSquad.id

    const members = await db.getSquadMembers(testSquad.id)
    const dbMemberCount = members.length
    expect(dbMemberCount).toBeGreaterThanOrEqual(1)

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le nombre de membres DOIT etre affiche
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    expect(mainText).toContain(String(dbMemberCount))
  })

  test('affiche la section "Fiabilité des membres"', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Analytics Reliability ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}/analytics`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la section fiabilite DOIT etre visible
    const reliabilitySection = page.getByText(/Fiabilité|fiabilité|Reliability/i).first()
    await expect(reliabilitySection).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags analytics sont corrects', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Analytics Meta ${Date.now()}` })
    testSquadId = testSquad.id

    await page.goto(`/squad/${testSquad.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Analytics"
    await expect(page).toHaveTitle(/Analytics/i)
  })

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000/analytics')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })
})
