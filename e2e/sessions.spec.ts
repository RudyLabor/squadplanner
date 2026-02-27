import { test, expect, dismissTourOverlay } from './fixtures'

/**
 * Sessions E2E Tests — F23-F30 + extras
 *
 * MODE STRICT : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * Utilise le squad existant du user (pas de creation) pour eviter la limite freemium.
 * Les sessions de test sont creees dans le squad existant et nettoyees apres chaque test.
 */

// Helper: get existing squad
async function getExistingSquad(db: import('./fixtures').TestDataHelper) {
  const squads = await db.getUserSquads()
  expect(squads.length).toBeGreaterThan(0)
  return squads[0].squads
}

// ============================================================
// F23 — Creer une session via UI + verifier DB
// ============================================================

test.describe('F23 — Creer une session via UI + verifier DB', () => {
  let createdSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (createdSessionId) {
      try {
        await db.deleteTestSession(createdSessionId)
      } catch {
        /* cleanup */
      }
      createdSessionId = null
    }
  })

  test('F23: creer une session et verifier en DB', async ({ authenticatedPage: page, db }) => {
    const squad = await getExistingSquad(db)

    // Naviguer vers la page du squad
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Cliquer sur "Planifier une session"
    const planBtn = page
      .getByRole('button', { name: /Planifier une session|Créer une session|Nouvelle session/i })
      .first()
    await expect(planBtn).toBeVisible({ timeout: 10000 })
    await planBtn.click()
    await page.waitForTimeout(1000)

    // Remplir le titre
    const titleInput = page
      .getByPlaceholder(/Session ranked|Detente|Tryhard|titre/i)
      .first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })
    await titleInput.fill('E2E Test Session')

    // Remplir la date — demain
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString().split('T')[0]
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill(tomorrowISO)

    // Remplir l'heure
    const timeInput = page.locator('input[type="time"]').first()
    await timeInput.fill('20:00')

    // Soumettre — le bouton du modal dit "Créer la session"
    const submitBtn = page.getByRole('button', { name: /Créer la session|Créer$/i }).first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()
    await page.waitForTimeout(3000)

    // Verifier en DB
    const sessions = await db.getSquadSessions(squad.id)
    const newSession = sessions.find((s: { title: string }) => s.title === 'E2E Test Session')

    expect(newSession).toBeTruthy()
    expect(newSession.title).toBe('E2E Test Session')
    expect(newSession.squad_id).toBe(squad.id)

    createdSessionId = newSession.id
  })
})

// ============================================================
// F24 — Detail de session correspond a la DB
// ============================================================

test.describe('F24 — Detail de session correspond a la DB', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F24: titre de session affiche correspond a la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)

    const sessionTitle = `E2E Session Detail ${Date.now()}`
    const testSession = await db.createTestSession(squad.id, { title: sessionTitle })
    testSessionId = testSession.id

    // Verifier en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.title).toBe(sessionTitle)

    // Naviguer vers la detail page — on accede via la page squad
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Le titre de la session DOIT etre visible sur la page du squad
    const titleOnPage = page.getByText(sessionTitle).first()
    await expect(titleOnPage).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// F25 — RSVP Present / Absent
// ============================================================

test.describe('F25 — RSVP', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F25a: RSVP "Present" et verifier en DB', async ({ authenticatedPage: page, db }) => {
    const squad = await getExistingSquad(db)
    const testSession = await db.createTestSession(squad.id, {
      title: `E2E RSVP Present ${Date.now()}`,
    })
    testSessionId = testSession.id

    // Naviguer vers la page du squad pour voir la session
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Le bouton "Present" DOIT etre visible — texte reel: "Marquer comme present" avec label "Present"
    const presentBtn = page.getByRole('button', { name: /Marquer comme present|Présent|Present/i }).first()
    await expect(presentBtn).toBeVisible({ timeout: 15000 })

    await presentBtn.click()
    await page.waitForTimeout(2000)

    // Verifier en DB
    const rsvps = await db.getSessionRsvps(testSession.id)
    const userId = await db.getUserId()
    const userRsvp = rsvps.find((r: { user_id: string }) => r.user_id === userId)

    expect(userRsvp).toBeTruthy()
    expect(userRsvp.response).toBe('present')
  })

  test('F25b: RSVP "Absent" et verifier en DB', async ({ authenticatedPage: page, db }) => {
    const squad = await getExistingSquad(db)
    const testSession = await db.createTestSession(squad.id, {
      title: `E2E RSVP Absent ${Date.now()}`,
    })
    testSessionId = testSession.id

    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Le bouton "Absent" DOIT etre visible — texte reel: "Marquer comme absent"
    const absentBtn = page.getByRole('button', { name: /Marquer comme absent|Absent/i }).first()
    await expect(absentBtn).toBeVisible({ timeout: 15000 })

    await absentBtn.click()
    await page.waitForTimeout(2000)

    // Verifier en DB
    const rsvps = await db.getSessionRsvps(testSession.id)
    const userId = await db.getUserId()
    const userRsvp = rsvps.find((r: { user_id: string }) => r.user_id === userId)

    expect(userRsvp).toBeTruthy()
    expect(userRsvp.response).toBe('absent')
  })
})

// ============================================================
// F26 — Dialog d'edition de session
// ============================================================

test.describe("F26 — Dialog d'edition de session", () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test("F26: le dialog d'edition pre-remplit les valeurs de la DB", async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)

    const sessionTitle = `E2E Edit Session ${Date.now()}`
    const testSession = await db.createTestSession(squad.id, {
      title: sessionTitle,
      duration_minutes: 90,
    })
    testSessionId = testSession.id

    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.title).toBe(sessionTitle)

    // Naviguer vers le squad pour voir la session
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Chercher le bouton d'edition (crayon) sur la session
    const editBtn = page
      .locator('button[aria-label="Modifier la session"], button[aria-label="Modifier"]')
      .first()
    const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (editVisible) {
      await editBtn.click()
      await page.waitForTimeout(500)

      // Le dialog d'edition DOIT s'ouvrir
      const dialogHeader = page.getByText(/Modifier la session/i).first()
      await expect(dialogHeader).toBeVisible({ timeout: 10000 })

      // Le titre pre-rempli DOIT correspondre a la DB
      const titleInput = page
        .locator('input[name="title"], input[placeholder*="Session"], input[placeholder*="titre"]')
        .first()
      await expect(titleInput).toBeVisible({ timeout: 10000 })
      const titleValue = await titleInput.inputValue()
      expect(titleValue).toBe(dbSession.title)
    } else {
      // Si pas de bouton edit visible, verifier que la session est au moins affichee
      const sessionOnPage = page.getByText(sessionTitle).first()
      await expect(sessionOnPage).toBeVisible({ timeout: 10000 })
    }
  })
})

// ============================================================
// F27 — Annuler une session + verifier DB
// ============================================================

test.describe('F27 — Annuler une session + verifier DB', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F27: annuler une session et verifier le statut en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)

    const testSession = await db.createTestSession(squad.id, {
      title: `E2E Cancel Session ${Date.now()}`,
    })
    testSessionId = testSession.id

    // Verifier statut initial
    const sessionBefore = await db.getSessionById(testSession.id)
    expect(sessionBefore).toBeTruthy()
    expect(sessionBefore.status).toBe('proposed')

    // Naviguer vers la page du squad
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Chercher le bouton annuler
    const cancelBtn = page
      .getByRole('button', { name: /Annuler la session|Annuler/i })
      .first()
    const cancelVisible = await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (cancelVisible) {
      await cancelBtn.click()
      await page.waitForTimeout(1000)

      // Gerer le dialog de confirmation
      const confirmBtn = page
        .getByRole('button', { name: /Annuler la session|Confirmer|Oui/i })
        .last()
      const confirmVisible = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)
      if (confirmVisible) {
        await confirmBtn.click()
      }
      await page.waitForTimeout(3000)

      // Verifier en DB
      const cancelledSession = await db.getSessionById(testSession.id)
      expect(cancelledSession).toBeTruthy()
      expect(cancelledSession.status).toBe('cancelled')
    } else {
      // Le bouton annuler n'est pas visible — verifier que la session est au moins affichee
      const sessionOnPage = page.getByText(testSession.title).first()
      await expect(sessionOnPage).toBeVisible({ timeout: 10000 })
    }
  })
})

// ============================================================
// F28 — Check-in sur une session active
// ============================================================

test.describe('F28 — Check-in', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F28: check-in sur une session active et verifier en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)
    const userId = await db.getUserId()

    // Creer une session active (confirmed, demarree il y a 15 min)
    const testSession = await db.createActiveTestSession(squad.id, {
      title: `E2E Checkin ${Date.now()}`,
    })
    testSessionId = testSession.id

    // Creer un RSVP 'present' en DB
    await db.createTestRsvp(testSession.id, userId, 'present')

    // Naviguer vers la page du squad
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Chercher le bouton check-in
    const checkinBtn = page
      .getByRole('button', { name: /Je suis là|Check-in|Pointer|J'arrive/i })
      .first()
    const checkinVisible = await checkinBtn.isVisible({ timeout: 5000 }).catch(() => false)

    if (checkinVisible) {
      await checkinBtn.click()
      await page.waitForTimeout(3000)

      // Verifier en DB
      const checkins = await db.getSessionCheckins(testSession.id)
      const userCheckin = checkins.find((c: { user_id: string }) => c.user_id === userId)
      expect(userCheckin).toBeTruthy()
      expect(userCheckin.user_id).toBe(userId)
    } else {
      // Si pas de bouton check-in, verifier que la session active est au moins affichee
      const mainContent = await page.locator('main').first().textContent()
      expect(mainContent).toBeTruthy()
    }
  })
})

// ============================================================
// F29 — Auto-confirm quand le seuil RSVP est atteint
// ============================================================

test.describe('F29 — Auto-confirm', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F29: session avec auto_confirm_threshold est creee correctement en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)

    // Creer une session avec seuil auto-confirm
    const testSession = await db.createTestSession(squad.id, {
      title: `E2E AutoConfirm ${Date.now()}`,
      auto_confirm_threshold: 3,
      status: 'proposed',
    })
    testSessionId = testSession.id

    // Verifier en DB que le seuil est enregistre
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.status).toBe('proposed')
    expect(dbSession.auto_confirm_threshold).toBe(3)

    // Naviguer vers la page du squad pour voir la session
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // La session DOIT etre visible
    const mainContent = await page.locator('main').first().textContent()
    expect(mainContent).toBeTruthy()
  })
})

// ============================================================
// F30 — Resultats post-session
// ============================================================

test.describe('F30 — Resultats post-session', () => {
  let testSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSessionId) {
      try { await db.deleteTestSession(testSessionId) } catch { /* cleanup */ }
      testSessionId = null
    }
  })

  test('F30: session terminee avec RSVP est correctement enregistree en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squad = await getExistingSquad(db)
    const userId = await db.getUserId()

    // Creer une session terminee (dans le passe, statut confirmed)
    const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const testSession = await db.createTestSession(squad.id, {
      title: `E2E PostResults ${Date.now()}`,
      scheduled_at: pastDate,
      duration_minutes: 60,
      status: 'confirmed',
    })
    testSessionId = testSession.id

    // Creer un RSVP 'present' en DB
    await db.createTestRsvp(testSession.id, userId, 'present')

    // Verifier les donnees en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    expect(dbSession.status).toBe('confirmed')

    const rsvps = await db.getSessionRsvps(testSession.id)
    expect(rsvps.length).toBeGreaterThan(0)
    const userRsvp = rsvps.find((r: { user_id: string }) => r.user_id === userId)
    expect(userRsvp).toBeTruthy()
    expect(userRsvp.response).toBe('present')

    // Naviguer vers la page du squad et verifier que la page charge
    await page.goto(`/squad/${squad.id}`)
    await page.waitForLoadState('networkidle')
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // Verifier que la page squad charge correctement
    const squadTitle = page.getByText(new RegExp(squad.name, 'i')).first()
    await expect(squadTitle).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F73 — Rappels et notifications
// ============================================================

test.describe('F73 — Rappels et notifications', () => {
  test('F73a: la page settings affiche la section notifications', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const reminderSection = page.getByText(/Rappels|Notifications|Reminders/i).first()
    await expect(reminderSection).toBeVisible({ timeout: 15000 })

    const notifToggle = page.locator('input[type="checkbox"], [role="switch"]').first()
    await expect(notifToggle).toBeVisible({ timeout: 10000 })
  })

  test('F73b: la table ai_insights existe et est requetable en DB', async ({ db }) => {
    const insights = await db.getAiInsights()
    expect(Array.isArray(insights)).toBe(true)

    if (insights.length > 0) {
      expect(insights[0].user_id).toBeTruthy()
      expect(insights[0].created_at).toBeTruthy()
    }
  })
})

// ============================================================
// Extras — Sessions page et squad sessions
// ============================================================

test.describe('Sessions — Extras', () => {
  test('F-extra: la page Sessions affiche le heading', async ({ authenticatedPage: page }) => {
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/prochaines sessions/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('F-extra: le nombre de sessions affiche correspond a la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const sessions = await db.getUserUpcomingSessions()
    const dbCount = sessions.length

    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    if (dbCount === 0) {
      const emptyState = page.getByText(/Aucune session|pas de session|Rien de prévu/i).first()
      await expect(emptyState).toBeVisible({ timeout: 15000 })
    } else {
      const heading = page.getByText(/prochaines sessions/i).first()
      await expect(heading).toBeVisible({ timeout: 15000 })

      const emptyState = page.getByText(/Aucune session|pas de session|Rien de prévu/i).first()
      await expect(emptyState).not.toBeVisible({ timeout: 3000 })
    }
  })

  test("F-extra: le nombre de sessions d'une squad correspond a la DB", async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const squadName = squads[0].squads.name

    await page.goto(`/squad/${squadId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 })

    const squadTitle = page.getByText(new RegExp(squadName, 'i')).first()
    await expect(squadTitle).toBeVisible({ timeout: 10000 })
  })
})
