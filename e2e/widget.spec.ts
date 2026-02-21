import { test, expect } from './fixtures'

/**
 * Widget Embed E2E Tests — /widget/:squadId
 *
 * MODE STRICT : Chaque test valide les donnees DB avant de verifier l'UI.
 * - Cree une vraie squad en DB avec des sessions
 * - Verifie que le widget affiche exactement les donnees DB
 * - Nettoie apres chaque test
 *
 * Le widget est une page publique (pas d'auth requise), embed-friendly.
 */

test.describe('Widget Embed — /widget/:squadId', () => {
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

  test('affiche le nom de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad en DB
    const squadName = `E2E Test Widget ${Date.now()}`
    const testSquad = await db.createTestSquad({ name: squadName, game: 'Valorant' })
    testSquadId = testSquad.id

    // STRICT: la squad DOIT exister en DB
    const dbSquad = await db.getSquadById(testSquad.id)
    expect(dbSquad).toBeTruthy()
    expect(dbSquad.name).toBe(squadName)

    // 2. Naviguer vers le widget
    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le nom de la squad DB DOIT etre affiche dans le widget
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nombre de membres correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Widget Members ${Date.now()}` })
    testSquadId = testSquad.id

    const members = await db.getSquadMembers(testSquad.id)
    const dbMemberCount = members.length

    // STRICT: au moins 1 membre (le createur) DOIT exister
    expect(dbMemberCount).toBeGreaterThanOrEqual(1)

    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le compteur de membres DOIT correspondre a la DB
    const memberText = page.getByText(new RegExp(`${dbMemberCount}\\s*membre`, 'i')).first()
    await expect(memberText).toBeVisible({ timeout: 15000 })
  })

  test('affiche les sessions a venir correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Widget Sessions ${Date.now()}` })
    testSquadId = testSquad.id

    // Creer une session future
    const sessionTitle = `E2E Test Widget Session ${Date.now()}`
    const testSession = await db.createTestSession(testSquad.id, {
      title: sessionTitle,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    testSessionId = testSession.id

    // STRICT: la session DOIT exister en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.title).toBe(sessionTitle)

    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le titre de la session DB DOIT etre visible dans le widget
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche "Aucune session" quand la squad n\'a pas de sessions', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Widget Empty ${Date.now()}` })
    testSquadId = testSquad.id

    // Verifier qu'il n'y a pas de sessions en DB
    const sessions = await db.getSquadSessions(testSquad.id)
    expect(sessions.length).toBe(0)

    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le message "Aucune session" DOIT etre visible
    const emptyState = page.getByText(/Aucune session/i).first()
    await expect(emptyState).toBeVisible({ timeout: 15000 })
  })

  test('affiche le lien "Rejoindre la squad"', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Widget CTA ${Date.now()}` })
    testSquadId = testSquad.id

    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le CTA "Rejoindre la squad" DOIT etre visible
    const cta = page.getByText(/Rejoindre la squad/i).first()
    await expect(cta).toBeVisible({ timeout: 15000 })
  })

  test('affiche le footer "Powered by Squad Planner"', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Widget Footer ${Date.now()}` })
    testSquadId = testSquad.id

    await page.goto(`/widget/${testSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le footer "Powered by Squad Planner" DOIT etre present
    const footer = page.getByText(/Powered by Squad Planner/i).first()
    await expect(footer).toBeVisible({ timeout: 15000 })
  })

  test('affiche "Squad introuvable" pour un ID invalide', async ({ page }) => {
    await page.goto('/widget/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: le message d'erreur DOIT etre affiche pour un squad inexistant
    const error = page.getByText(/Squad introuvable|introuvable|non trouvé/i).first()
    await expect(error).toBeVisible({ timeout: 15000 })
  })
})
