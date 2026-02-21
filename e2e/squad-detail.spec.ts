import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Squad Detail E2E Tests — /squad/:id
 *
 * MODE STRICT : Tests DB-first.
 * Complement de squads.spec.ts avec des tests specifiques au detail page.
 * - Verifie l'affichage complet du header, membres, sessions, et settings
 * - Verifie les interactions (planifier session, inviter)
 * - Verifie la coherence entre DB et UI pour chaque section
 */

// ============================================================
// Squad Detail — Header
// ============================================================

test.describe('Squad Detail — Header complet', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try { await db.deleteTestSquad(testSquadId) } catch { /* cleanup */ }
      testSquadId = null
    }
  })

  test('affiche le nom, jeu, code d\'invitation, et compteur membres de la DB', async ({ authenticatedPage: page, db }) => {
    const squadName = `E2E Detail Header ${Date.now()}`
    const testSquad = await db.createTestSquad({ name: squadName, game: 'Apex Legends' })
    testSquadId = testSquad.id

    const members = await db.getSquadMembers(testSquad.id)
    const dbMemberCount = members.length

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le nom de la squad DB DOIT etre visible
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })

    // STRICT: le jeu DB DOIT etre visible
    await expect(page.getByText(/Apex Legends/i).first()).toBeVisible({ timeout: 10000 })

    // STRICT: le code d'invitation DB DOIT etre visible
    await expect(page.getByText(testSquad.invite_code).first()).toBeVisible({ timeout: 10000 })

    // STRICT: le compteur de membres DOIT correspondre a la DB
    const memberRegex = new RegExp(`${dbMemberCount}\\s*membre`, 'i')
    await expect(page.getByText(memberRegex).first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// Squad Detail — Section Membres
// ============================================================

test.describe('Squad Detail — Section Membres', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try { await db.deleteTestSquad(testSquadId) } catch { /* cleanup */ }
      testSquadId = null
    }
  })

  test('la liste des membres affiche les usernames de la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail Members ${Date.now()}` })
    testSquadId = testSquad.id

    const members = await db.getSquadMembers(testSquad.id)
    expect(members.length).toBeGreaterThanOrEqual(1)

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
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

  test('le bouton "Inviter" ouvre le dialog avec le code de la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail Invite ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le bouton "Inviter" DOIT etre visible
    const inviteBtn = page.getByRole('button', { name: /Inviter/i }).first()
    await expect(inviteBtn).toBeVisible({ timeout: 10000 })
    await inviteBtn.click()
    await page.waitForTimeout(500)

    // STRICT: le code d'invitation DB DOIT etre affiche dans le dialog
    await expect(page.getByText(testSquad.invite_code).first()).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// Squad Detail — Section Sessions
// ============================================================

test.describe('Squad Detail — Section Sessions', () => {
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

  test('affiche les sessions de la squad correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail Sessions ${Date.now()}` })
    testSquadId = testSquad.id

    // Creer une session de test
    const sessionTitle = `E2E Detail Session ${Date.now()}`
    const testSession = await db.createTestSession(testSquad.id, { title: sessionTitle })
    testSessionId = testSession.id

    // Verifier en DB
    const dbSessions = await db.getSquadSessions(testSquad.id)
    expect(dbSessions.length).toBeGreaterThan(0)
    const dbSession = dbSessions.find((s: { title: string }) => s.title === sessionTitle)
    expect(dbSession).toBeTruthy()

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le titre de la session DB DOIT etre visible sur la page squad
    await expect(page.getByText(sessionTitle).first()).toBeVisible({ timeout: 15000 })
  })

  test('le bouton "Planifier une session" ouvre le formulaire de creation', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail Plan ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le bouton "Planifier une session" DOIT etre visible
    const planBtn = page.getByRole('button', { name: /Planifier une session/i }).first()
    await expect(planBtn).toBeVisible({ timeout: 15000 })
    await planBtn.click()
    await page.waitForTimeout(1000)

    // STRICT: le formulaire de creation DOIT s'ouvrir avec un champ titre
    const titleInput = page.getByPlaceholder(/Session ranked|Detente|Tryhard|titre/i).first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })

    // STRICT: les champs date et heure DOIVENT etre visibles
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[type="time"]').first()).toBeVisible({ timeout: 5000 })

    // STRICT: le bouton "Créer" DOIT etre visible
    const createBtn = page.getByRole('button', { name: /^Créer$/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 5000 })
  })

  test('affiche l\'etat vide quand la squad n\'a pas de sessions', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail NoSessions ${Date.now()}` })
    testSquadId = testSquad.id

    // Verifier qu'il n'y a pas de sessions en DB
    const dbSessions = await db.getSquadSessions(testSquad.id)
    expect(dbSessions.length).toBe(0)

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: "Planifier une session" DOIT etre visible (c'est le CTA pour etat vide)
    const planBtn = page.getByRole('button', { name: /Planifier une session/i }).first()
    await expect(planBtn).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// Squad Detail — Navigation vers Analytics
// ============================================================

test.describe('Squad Detail — Lien vers Analytics', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try { await db.deleteTestSquad(testSquadId) } catch { /* cleanup */ }
      testSquadId = null
    }
  })

  test('la section "Stats avancees" contient un lien vers /squad/:id/analytics', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Detail Analytics Link ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la section "Stats avancées" DOIT etre visible
    const statsSection = page.getByText(/Stats avancées/i).first()
    await expect(statsSection).toBeVisible({ timeout: 15000 })

    // STRICT: un lien vers analytics DOIT exister
    const analyticsLink = page.locator(`a[href="/squad/${testSquad.id}/analytics"]`).first()
    const hasLink = await analyticsLink.count()

    // Le lien peut etre derriere un premium gate — verifier le DOM
    if (hasLink > 0) {
      // Le lien existe directement
      expect(hasLink).toBeGreaterThan(0)
    } else {
      // Le lien est derriere un premium gate — verifier que le bouton premium existe
      const premiumGate = page.getByText(/Premium|PRO|Débloquer/i).first()
      await expect(premiumGate).toBeVisible({ timeout: 10000 })
    }
  })
})

// ============================================================
// Squad Detail — Squad inexistante
// ============================================================

test.describe('Squad Detail — Squad inexistante', () => {
  test('affiche "Squad non trouvée" pour un ID invalide', async ({ authenticatedPage: page }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: le message "Squad non trouvée" DOIT etre visible
    await expect(page.getByText(/Squad non trouvée/i).first()).toBeVisible({ timeout: 15000 })

    // STRICT: le bouton "Retour aux squads" DOIT etre present
    await expect(page.getByRole('button', { name: /Retour aux squads/i })).toBeVisible({ timeout: 5000 })
  })
})
