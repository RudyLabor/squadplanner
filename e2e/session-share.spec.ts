import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Session Share E2E Tests — /s/:id
 *
 * MODE STRICT : Tests DB-first.
 * Utilise une squad existante du user (pas de creation) pour eviter la limite freemium.
 * Cree des sessions de test dans une squad existante.
 */

test.describe('Session Share — /s/:id', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try {
        await db.deleteTestSession(testSessionId)
      } catch {
        /* cleanup */
      }
      testSessionId = null
    }
  })

  test('affiche le titre de la session depuis la DB', async ({ authenticatedPage: page, db }) => {
    // Utiliser une squad existante
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const sessionTitle = `E2E Test Share Session ${Date.now()}`
    const testSession = await db.createTestSession(squad.id, {
      title: sessionTitle,
      scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    // STRICT: la session DOIT exister en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.title).toBe(sessionTitle)

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le titre de la session DB DOIT etre visible
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nom de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const testSession = await db.createTestSession(squad.id, {
      title: `E2E Share Name ${Date.now()}`,
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le nom de la squad DB DOIT etre visible sur la page share
    await expect(page.getByText(squad.name).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche la date formatee et la duree', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const testSession = await db.createTestSession(squads[0].squads.id, {
      title: `E2E Share Date ${Date.now()}`,
      scheduled_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 90,
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: une date DOIT etre visible (format francais ou numerique)
    const dateText = page
      .getByText(
        /\d{1,2}.*202[4-6]|\d{1,2}\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
      )
      .first()
    await expect(dateText).toBeVisible({ timeout: 15000 })
  })

  test('affiche le CTA principal pour une session future', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const testSession = await db.createTestSession(squads[0].squads.id, {
      title: `E2E Share CTA ${Date.now()}`,
      scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: un CTA DOIT etre visible (Rejoindre ou Decouvrir)
    const cta = page.getByRole('link', { name: /Rejoindre|Découvrir|session/i }).first()
    await expect(cta).toBeVisible({ timeout: 15000 })
  })

  test('affiche "Session introuvable" pour un ID inexistant', async ({ page }) => {
    await page.goto('/s/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le message d'erreur DOIT etre visible
    const error = page.getByText(/Session introuvable|n'existe pas|supprimée/i).first()
    await expect(error).toBeVisible({ timeout: 15000 })
  })
})
