import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Squad Detail E2E Tests — /squad/:id
 *
 * MODE STRICT : Tests DB-first.
 * Utilise une squad existante du user pour eviter la limite freemium.
 * Verifie l'affichage complet du header, membres, sessions, et settings.
 */

// ============================================================
// Squad Detail — Header
// ============================================================

test.describe('Squad Detail — Header complet', () => {
  test('affiche le nom, jeu et compteur membres de la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const members = await db.getSquadMembers(squad.id)
    const dbMemberCount = members.length

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le nom de la squad DB DOIT etre visible
    await expect(page.getByText(squad.name).first()).toBeVisible({ timeout: 15000 })

    // STRICT: le jeu DB DOIT etre visible (si defini)
    if (squad.game) {
      await expect(page.getByText(new RegExp(squad.game, 'i')).first()).toBeVisible({ timeout: 10000 })
    }

    // STRICT: le compteur de membres DOIT correspondre a la DB
    const memberRegex = new RegExp(`${dbMemberCount}\\s*membre`, 'i')
    await expect(page.getByText(memberRegex).first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// Squad Detail — Section Membres
// ============================================================

test.describe('Squad Detail — Section Membres', () => {
  test('la liste des membres affiche les usernames de la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const members = await db.getSquadMembers(squad.id)
    expect(members.length).toBeGreaterThanOrEqual(1)

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le heading "Membres (N)" DOIT etre visible
    const membersHeading = page.getByText(new RegExp(`Membres\\s*\\(${members.length}\\)`, 'i')).first()
    await expect(membersHeading).toBeVisible({ timeout: 15000 })

    // STRICT: chaque username DB DOIT etre visible dans la section
    for (const member of members) {
      const username = (member as { profiles?: { username?: string } }).profiles?.username
      if (username) {
        await expect(page.getByText(username).first()).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('le bouton Inviter ouvre le dialog avec le code de la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le bouton "Inviter" DOIT etre visible
    const inviteBtn = page.getByRole('button', { name: /Inviter/i }).first()
    await expect(inviteBtn).toBeVisible({ timeout: 10000 })
    await inviteBtn.click()
    await page.waitForTimeout(500)

    // STRICT: le code d'invitation DB DOIT etre affiche dans le dialog
    await expect(page.getByText(squad.invite_code).first()).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// Squad Detail — Section Sessions
// ============================================================

test.describe('Squad Detail — Section Sessions', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('affiche les sessions de la squad depuis la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    // Creer une session de test dans la squad existante
    const sessionTitle = `E2E Detail Session ${Date.now()}`
    const testSession = await db.createTestSession(squad.id, { title: sessionTitle })
    testSessionId = testSession.id

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le titre de la session DB DOIT etre visible sur la page squad
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('le bouton Planifier une session est visible', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le bouton "Planifier une session" DOIT etre visible
    const planBtn = page.getByRole('button', { name: /Planifier une session/i }).first()
    await expect(planBtn).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// Squad Detail — Navigation vers Analytics
// ============================================================

test.describe('Squad Detail — Lien vers Analytics', () => {
  test('la section Stats avancees est visible', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const squad = squads[0].squads

    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la section "Stats avancées" ou un lien analytics DOIT etre visible
    const statsSection = page.getByText(/Stats avancées|Analytics/i).first()
    await expect(statsSection).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// Squad Detail — Squad inexistante
// ============================================================

test.describe('Squad Detail — Squad inexistante', () => {
  test('affiche Squad non trouvee pour un ID invalide', async ({ authenticatedPage: page }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: le message "Squad non trouvée" DOIT etre visible
    await expect(page.getByText(/Squad non trouvée/i).first()).toBeVisible({ timeout: 15000 })

    // STRICT: le bouton "Retour aux squads" DOIT etre present
    await expect(page.getByRole('button', { name: /Retour aux squads/i })).toBeVisible({ timeout: 5000 })
  })
})
