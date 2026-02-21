import { test, expect } from './fixtures'

/**
 * Widget Embed E2E Tests — /widget/:squadId
 *
 * MODE STRICT : Tests DB-first.
 * Utilise une squad existante du user pour eviter la limite freemium.
 * Verifie que le widget affiche exactement les donnees DB.
 *
 * Le widget est une page publique (pas d'auth requise), embed-friendly.
 */

test.describe('Widget Embed — /widget/:squadId', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('affiche le nom de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    await page.goto(`/widget/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le nom de la squad DB DOIT etre affiche dans le widget
    await expect(page.getByText(squad.name).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nombre de membres correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const members = await db.getSquadMembers(squad.id)
    const dbMemberCount = members.length
    expect(dbMemberCount).toBeGreaterThanOrEqual(1)

    await page.goto(`/widget/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le compteur de membres DOIT correspondre a la DB
    const memberText = page.getByText(new RegExp(`${dbMemberCount}\\s*membre`, 'i')).first()
    await expect(memberText).toBeVisible({ timeout: 15000 })
  })

  test('affiche les sessions a venir depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    // Creer une session future dans la squad existante
    const sessionTitle = `E2E Widget Session ${Date.now()}`
    const testSession = await db.createTestSession(squad.id, {
      title: sessionTitle,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    await page.goto(`/widget/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le titre de la session DB DOIT etre visible dans le widget
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le CTA Rejoindre ou le footer', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    await page.goto(`/widget/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: un CTA ou le footer Squad Planner DOIT etre visible
    const cta = page.getByText(/Rejoindre|Squad Planner|Powered by/i).first()
    await expect(cta).toBeVisible({ timeout: 15000 })
  })

  test('affiche Squad introuvable pour un ID invalide', async ({ page }) => {
    await page.goto('/widget/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le message d'erreur DOIT etre affiche pour un squad inexistant
    const error = page.getByText(/Squad introuvable|introuvable|non trouvé/i).first()
    await expect(error).toBeVisible({ timeout: 15000 })
  })
})
