import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Session Share E2E Tests — /s/:id
 *
 * MODE STRICT : Tests DB-first. Cree une vraie session en DB,
 * puis verifie que la page de partage affiche exactement les donnees DB.
 */

test.describe('Session Share — /s/:id', () => {
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

  test('affiche le titre de la session depuis la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad et une session en DB
    const testSquad = await db.createTestSquad({ name: `E2E Test Share Squad ${Date.now()}`, game: 'Valorant' })
    testSquadId = testSquad.id
    const sessionTitle = `E2E Test Share Session ${Date.now()}`
    const testSession = await db.createTestSession(testSquad.id, {
      title: sessionTitle,
      scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    // STRICT: la session DOIT exister en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.title).toBe(sessionTitle)

    // 2. Naviguer vers la page de partage
    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le titre de la session DB DOIT etre visible
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nom de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squadName = `E2E Test Share SquadName ${Date.now()}`
    const testSquad = await db.createTestSquad({ name: squadName, game: 'LoL' })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Share Name ${Date.now()}`,
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le nom de la squad DB DOIT etre visible sur la page share
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche la date et l\'heure formatees en francais', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Share Date ${Date.now()}` })
    testSquadId = testSquad.id
    const futureDate = new Date(Date.now() + 72 * 60 * 60 * 1000)
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Share Date ${Date.now()}`,
      scheduled_at: futureDate.toISOString(),
      duration_minutes: 90,
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: une date formatee DOIT etre visible (jour, mois en francais)
    const dateText = page.getByText(/\d{1,2}\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i).first()
    await expect(dateText).toBeVisible({ timeout: 15000 })

    // STRICT: la duree "90 min" DOIT etre visible
    const duration = page.getByText(/90\s*min/i).first()
    await expect(duration).toBeVisible({ timeout: 10000 })
  })

  test('affiche le nombre de RSVP correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const userId = await db.getUserId()
    const testSquad = await db.createTestSquad({ name: `E2E Test Share RSVP ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Share RSVP ${Date.now()}`,
    })
    testSessionId = testSession.id

    // Creer un RSVP "present" en DB
    await db.createTestRsvp(testSession.id, userId, 'present')

    // Verifier le RSVP en DB
    const rsvps = await db.getSessionRsvps(testSession.id)
    const presentCount = rsvps.filter((r: { response: string }) => r.response === 'present').length
    expect(presentCount).toBe(1)

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le compteur de RSVPs "1 confirmé" DOIT etre visible
    const rsvpCount = page.getByText(/1\s*confirmé/i).first()
    await expect(rsvpCount).toBeVisible({ timeout: 15000 })
  })

  test('affiche le CTA "Rejoindre la session" pour une session future', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Share CTA ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Share CTA ${Date.now()}`,
      scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: le CTA "Rejoindre la session" DOIT etre visible pour une session future
    const cta = page.getByText(/Rejoindre la session/i).first()
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

  test('affiche la section "Partager cette session"', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Share Buttons ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Share Buttons ${Date.now()}`,
    })
    testSessionId = testSession.id

    await page.goto(`/s/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    // STRICT: la section de partage DOIT etre visible
    const shareSection = page.getByText(/Partager cette session/i).first()
    await expect(shareSection).toBeVisible({ timeout: 15000 })
  })
})
