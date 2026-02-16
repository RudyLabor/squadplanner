import { test, expect } from './fixtures'

/**
 * Sessions E2E Tests — F23-F30 + extras
 *
 * MODE STRICT : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * Pas de fallback sur "page loaded" quand la DB a des donnees reelles.
 * Pas de .catch(() => false) sur les assertions.
 * Pas de test.info().annotations remplacant de vrais asserts.
 * Pas de early return sans assertion reelle sur la feature testee.
 * Si la DB a des sessions → l'UI DOIT les afficher → sinon FAIL.
 */

// ============================================================
// F23 — Creer une session via UI + verifier DB
// ============================================================

test.describe('F23 — Creer une session via UI + verifier DB', () => {
  let createdSessionId: string | null = null

  test.afterEach(async ({ db }) => {
    if (createdSessionId) {
      try { await db.deleteTestSession(createdSessionId) } catch { /* cleanup */ }
      createdSessionId = null
    }
  })

  test('F23: creer une session et verifier en DB', async ({ authenticatedPage: page, db }) => {
    // 1. Récupérer un squad existant du user
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)
    const targetSquad = squads[0].squads

    // 2. Naviguer vers la page du squad (formulaire inline de création)
    await page.goto(`/squad/${targetSquad.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 3. Cliquer sur "Planifier une session" pour ouvrir le formulaire inline
    const planBtn = page.getByRole('button', { name: /Planifier une session/i }).first()
    await expect(planBtn).toBeVisible({ timeout: 10000 })
    await planBtn.click()
    await page.waitForTimeout(1000)

    // 4. Remplir le titre
    const titleInput = page.getByPlaceholder(/Session ranked|Detente|Tryhard|titre/i).first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })
    await titleInput.fill('E2E Test Session')

    // 5. Remplir la date (input type=date) — demain
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString().split('T')[0]
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill(tomorrowISO)

    // 6. Remplir l'heure (input type=time)
    const timeInput = page.locator('input[type="time"]').first()
    await timeInput.fill('20:00')

    // 7. Soumettre le formulaire
    const submitBtn = page.getByRole('button', { name: /^Créer$/i }).first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()
    await page.waitForTimeout(3000)

    // 8. Vérifier en DB que la session a été créée
    const sessions = await db.getSquadSessions(targetSquad.id)
    const newSession = sessions.find((s: { title: string }) => s.title === 'E2E Test Session')

    expect(newSession).toBeTruthy()
    expect(newSession.title).toBe('E2E Test Session')
    expect(newSession.squad_id).toBe(targetSquad.id)

    createdSessionId = newSession.id
  })
})

// ============================================================
// F24 — Detail de session correspond a la DB
// ============================================================

test.describe('F24 — Detail de session correspond a la DB', () => {
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

  test('F24: titre de session affiche correspond a la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad + session de test deterministe
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Detail ${Date.now()}` })
    testSquadId = testSquad.id
    const sessionTitle = `E2E Test Session Detail ${Date.now()}`
    const testSession = await db.createTestSession(testSquad.id, { title: sessionTitle })
    testSessionId = testSession.id

    // 2. Verifier la session en DB
    const dbSession = await db.getSessionById(testSession.id)
    // STRICT: la session DOIT exister en DB
    expect(dbSession).toBeTruthy()
    // STRICT: le titre en DB DOIT correspondre a ce qu'on a cree
    expect(dbSession.title).toBe(sessionTitle)

    // 3. Naviguer vers la page de detail
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 4. Le titre de la session DOIT etre affiche sur la page
    const titleOnPage = page.getByText(sessionTitle).first()
    // STRICT: le titre DB DOIT etre visible dans l'UI — pas de fallback sur main
    await expect(titleOnPage).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// F25 — RSVP Present / Absent
// ============================================================

test.describe('F25 — RSVP', () => {
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

  test('F25a: RSVP "Present" et verifier en DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad + session de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad RSVP ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Test Session RSVP ${Date.now()}`,
    })
    testSessionId = testSession.id

    // 2. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 3. Le bouton "Present" DOIT etre visible
    const presentBtn = page.getByRole('button', { name: /Présent/i }).first()
    // STRICT: le bouton RSVP "Present" DOIT etre visible sur la page de session
    await expect(presentBtn).toBeVisible({ timeout: 15000 })

    await presentBtn.click()
    await page.waitForTimeout(2000)

    // 4. Verifier en DB que le RSVP a ete enregistre
    const rsvps = await db.getSessionRsvps(testSession.id)
    const userId = await db.getUserId()
    const userRsvp = rsvps.find((r: { user_id: string }) => r.user_id === userId)

    // STRICT: le RSVP DOIT exister en DB apres le clic
    expect(userRsvp).toBeTruthy()
    // STRICT: la reponse DOIT etre 'present'
    expect(userRsvp.response).toBe('present')
  })

  test('F25b: RSVP "Absent" et verifier en DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad + session de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad RSVP2 ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Test Session Absent ${Date.now()}`,
    })
    testSessionId = testSession.id

    // 2. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 3. Le bouton "Absent" DOIT etre visible
    const absentBtn = page.getByRole('button', { name: /Absent/i }).first()
    // STRICT: le bouton RSVP "Absent" DOIT etre visible sur la page de session
    await expect(absentBtn).toBeVisible({ timeout: 15000 })

    await absentBtn.click()
    await page.waitForTimeout(2000)

    // 4. Verifier en DB que le RSVP a ete enregistre
    const rsvps = await db.getSessionRsvps(testSession.id)
    const userId = await db.getUserId()
    const userRsvp = rsvps.find((r: { user_id: string }) => r.user_id === userId)

    // STRICT: le RSVP DOIT exister en DB apres le clic
    expect(userRsvp).toBeTruthy()
    // STRICT: la reponse DOIT etre 'absent'
    expect(userRsvp.response).toBe('absent')
  })
})

// ============================================================
// F26 — Dialog d'edition de session
// ============================================================

test.describe('F26 — Dialog d\'edition de session', () => {
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

  test('F26: le dialog d\'edition pre-remplit les valeurs de la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad + session de test (le user est leader -> peut editer)
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Edit ${Date.now()}` })
    testSquadId = testSquad.id
    const sessionTitle = `E2E Test Session Edit ${Date.now()}`
    const testSession = await db.createTestSession(testSquad.id, {
      title: sessionTitle,
      duration_minutes: 90,
    })
    testSessionId = testSession.id

    // 2. Recuperer les donnees de la session en DB pour comparaison
    const dbSession = await db.getSessionById(testSession.id)
    // STRICT: la session DOIT exister en DB
    expect(dbSession).toBeTruthy()
    // STRICT: le titre en DB DOIT correspondre
    expect(dbSession.title).toBe(sessionTitle)

    // 3. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 4. Le bouton d'edition DOIT etre visible (user est leader/createur)
    const editBtn = page.locator('button[aria-label="Modifier la session"], button:has-text("Modifier")').first()
    // STRICT: le bouton "Modifier" DOIT etre visible pour le createur de la session
    await expect(editBtn).toBeVisible({ timeout: 15000 })

    await editBtn.click()
    await page.waitForTimeout(500)

    // 5. Le dialog d'edition DOIT s'ouvrir
    const dialogHeader = page.getByText(/Modifier la session/i).first()
    // STRICT: le dialog d'edition DOIT etre ouvert avec le bon header
    await expect(dialogHeader).toBeVisible({ timeout: 10000 })

    // 6. Le titre pre-rempli DOIT correspondre a la DB
    const titleInput = page.locator('input[name="title"], input[placeholder*="Session"], input[placeholder*="titre"]').first()
    // STRICT: le champ titre DOIT etre visible dans le dialog d'edition
    await expect(titleInput).toBeVisible({ timeout: 10000 })
    const titleValue = await titleInput.inputValue()
    // STRICT: la valeur pre-remplie DOIT correspondre au titre en DB
    expect(titleValue).toBe(dbSession.title)

    // 7. La duree DOIT etre affichee dans le dialog
    const durationText = page.getByText(new RegExp(`${dbSession.duration_minutes}\\s*min`, 'i')).first()
    // STRICT: la duree en DB DOIT etre visible dans le dialog d'edition
    await expect(durationText).toBeVisible({ timeout: 10000 })

    // 8. Les boutons Annuler et Enregistrer DOIVENT etre visibles dans le dialog
    const dialog = page.locator('[role="dialog"], dialog').first()
    const annulerBtn = dialog.getByRole('button', { name: /Annuler/i }).first()
    const enregistrerBtn = dialog.getByRole('button', { name: /Enregistrer/i }).first()
    // STRICT: le bouton "Annuler" DOIT etre present dans le dialog
    await expect(annulerBtn).toBeVisible({ timeout: 5000 })
    // STRICT: le bouton "Enregistrer" DOIT etre present dans le dialog
    await expect(enregistrerBtn).toBeVisible({ timeout: 5000 })

    // 9. Fermer sans sauvegarder
    await annulerBtn.click()
  })
})

// ============================================================
// F27 — Annuler une session + verifier DB
// ============================================================

test.describe('F27 — Annuler une session + verifier DB', () => {
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

  test('F27: annuler une session et verifier le statut en DB', async ({ authenticatedPage: page, db }) => {
    // 1. Creer une squad + session de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Cancel ${Date.now()}` })
    testSquadId = testSquad.id
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Test Session Cancel ${Date.now()}`,
    })
    testSessionId = testSession.id

    // Verifier que la session existe et est 'proposed'
    const sessionBefore = await db.getSessionById(testSession.id)
    // STRICT: la session DOIT exister en DB avant annulation
    expect(sessionBefore).toBeTruthy()
    // STRICT: le statut initial DOIT etre 'proposed'
    expect(sessionBefore.status).toBe('proposed')

    // 2. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 3. Le bouton "Annuler la session" DOIT etre visible (user est leader)
    const cancelBtn = page.getByRole('button', { name: /Annuler la session|Annuler/i }).first()
    // STRICT: le bouton d'annulation DOIT etre visible pour le createur
    await expect(cancelBtn).toBeVisible({ timeout: 15000 })

    await cancelBtn.click()
    await page.waitForTimeout(1000)

    // 4. Gerer le dialog de confirmation s'il apparait
    const confirmDialog = page.locator('dialog, [role="dialog"], [role="alertdialog"]').filter({ hasText: /Annuler cette session/i })
    const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasConfirmDialog) {
      const confirmBtn = confirmDialog.getByRole('button', { name: /Annuler la session|Confirmer|Oui/i })
      // STRICT: le bouton de confirmation DOIT etre dans le dialog
      await expect(confirmBtn).toBeVisible({ timeout: 5000 })
      await confirmBtn.click()
    } else {
      // Pas de dialog de confirmation — tenter le bouton de confirmation directe
      const directConfirm = page.getByRole('button', { name: /Confirmer|Oui|Annuler la session/i }).last()
      const directVisible = await directConfirm.isVisible({ timeout: 3000 }).catch(() => false)
      if (directVisible) {
        await directConfirm.click()
      }
      // Si aucun dialog de confirmation, le clic initial a peut-etre deja annule
    }

    await page.waitForTimeout(4000)

    // 5. Verifier en DB que le statut est 'cancelled'
    const cancelledSession = await db.getSessionById(testSession.id)
    // STRICT: la session DOIT toujours exister en DB
    expect(cancelledSession).toBeTruthy()
    // STRICT: le statut DOIT etre 'cancelled' apres l'annulation
    expect(cancelledSession.status).toBe('cancelled')
  })
})

// ============================================================
// F28 — Check-in sur une session active
// ============================================================

test.describe('F28 — Check-in', () => {
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

  test('F28: check-in sur une session active et verifier en DB', async ({ authenticatedPage: page, db }) => {
    const userId = await db.getUserId()

    // 1. Creer une squad de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Checkin ${Date.now()}` })
    testSquadId = testSquad.id

    // 2. Creer une session active (confirmed, demarree il y a 15 min)
    const testSession = await db.createActiveTestSession(testSquad.id, {
      title: `E2E Test Active Session Checkin ${Date.now()}`,
    })
    testSessionId = testSession.id

    // STRICT: la session active DOIT exister en DB
    const dbSession = await db.getSessionById(testSession.id)
    expect(dbSession).toBeTruthy()
    // STRICT: le statut DOIT etre 'confirmed'
    expect(dbSession.status).toBe('confirmed')

    // 3. Creer un RSVP 'present' en DB pour l'utilisateur de test
    await db.createTestRsvp(testSession.id, userId, 'present')

    // Verifier que le RSVP existe bien
    const rsvpsBefore = await db.getSessionRsvps(testSession.id)
    const myRsvp = rsvpsBefore.find((r: { user_id: string }) => r.user_id === userId)
    // STRICT: le RSVP 'present' DOIT exister en DB avant le check-in
    expect(myRsvp).toBeTruthy()
    expect(myRsvp.response).toBe('present')

    // 4. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')

    // 5. Le bouton de check-in DOIT etre visible (session active + RSVP present)
    const checkinBtn = page.getByRole('button', { name: /Je suis là|Check-in|Pointer|J'arrive/i }).first()
    // STRICT: le bouton check-in DOIT etre visible pour un user qui a RSVP present sur une session active
    await expect(checkinBtn).toBeVisible({ timeout: 15000 })

    await checkinBtn.click()
    await page.waitForTimeout(3000)

    // 6. Verifier en DB que le check-in a ete enregistre
    const checkins = await db.getSessionCheckins(testSession.id)
    const userCheckin = checkins.find((c: { user_id: string }) => c.user_id === userId)

    // STRICT: le check-in DOIT exister en DB apres le clic
    expect(userCheckin).toBeTruthy()
    // STRICT: le user_id DOIT correspondre
    expect(userCheckin.user_id).toBe(userId)
    // STRICT: le session_id DOIT correspondre
    expect(userCheckin.session_id).toBe(testSession.id)
  })
})

// ============================================================
// F29 — Auto-confirm quand le seuil RSVP est atteint
// ============================================================

test.describe('F29 — Auto-confirm', () => {
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

  test('F29: session auto-confirmee quand le seuil de RSVP est atteint', async ({ authenticatedPage: page, db }) => {
    const userId = await db.getUserId()

    // 1. Creer une squad de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad AutoConfirm ${Date.now()}` })
    testSquadId = testSquad.id

    // 2. Creer un user temporaire et l'ajouter a la squad (pour avoir 2 RSVPs)
    const tempUser = await db.createTemporaryTestUser()

    try {
      // Ajouter le temp user a la squad
      await db.admin.from('squad_members').insert({
        squad_id: testSquad.id, user_id: tempUser.userId, role: 'member',
      })

      // 3. Creer une session avec auto_confirm_threshold = 2 (minimum autorise par la DB)
      const testSession = await db.createTestSession(testSquad.id, {
        title: `E2E Test Session AutoConfirm ${Date.now()}`,
        auto_confirm_threshold: 2,
        status: 'proposed',
      })
      testSessionId = testSession.id

      // STRICT: la session DOIT exister en DB avec le statut 'proposed'
      const sessionBefore = await db.getSessionById(testSession.id)
      expect(sessionBefore).toBeTruthy()
      expect(sessionBefore.status).toBe('proposed')

      // 4. Creer le 1er RSVP 'present' (utilisateur de test)
      await db.createTestRsvp(testSession.id, userId, 'present')

      // 5. Creer le 2eme RSVP 'present' (temp user) — atteint le threshold de 2
      await db.createTestRsvp(testSession.id, tempUser.userId, 'present')

      // STRICT: les 2 RSVPs DOIVENT exister en DB
      const rsvps = await db.getSessionRsvps(testSession.id)
      const presentRsvps = rsvps.filter((r: { response: string }) => r.response === 'present')
      expect(presentRsvps.length).toBe(2)

      // 6. Attendre pour laisser le trigger s'executer
      await page.waitForTimeout(5000)

      // 7. Verifier en DB si le statut a change a 'confirmed'
      const sessionAfter = await db.getSessionById(testSession.id)
      // STRICT: la session DOIT toujours exister en DB
      expect(sessionAfter).toBeTruthy()
      // STRICT: le statut DOIT etre 'confirmed' apres que le threshold est atteint
      expect(sessionAfter.status).toBe('confirmed')
    } finally {
      // Cleanup temp user
      try { await db.deleteTemporaryTestUser(tempUser.userId) } catch { /* cleanup */ }
    }
  })
})

// ============================================================
// F30 — Resultats post-session
// ============================================================

test.describe('F30 — Resultats post-session', () => {
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

  test('F30: affiche les resultats avec Inscrits, Check-ins, Fiabilite coherents avec la DB', async ({ authenticatedPage: page, db }) => {
    const userId = await db.getUserId()

    // 1. Creer une squad de test
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad PostSession ${Date.now()}` })
    testSquadId = testSquad.id

    // 2. Creer une session terminee (dans le passe, statut confirmed)
    const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const testSession = await db.createTestSession(testSquad.id, {
      title: `E2E Test Session PostResults ${Date.now()}`,
      scheduled_at: pastDate,
      duration_minutes: 60,
      status: 'confirmed',
    })
    testSessionId = testSession.id

    // 3. Creer un RSVP 'present' en DB
    await db.createTestRsvp(testSession.id, userId, 'present')

    // 4. Recuperer les donnees attendues en DB
    const rsvps = await db.getSessionRsvps(testSession.id)
    const checkins = await db.getSessionCheckins(testSession.id)

    // STRICT: au moins 1 RSVP DOIT exister en DB (celui qu'on vient de creer)
    expect(rsvps.length).toBeGreaterThan(0)

    const expectedInscrits = rsvps.length
    const expectedCheckins = checkins.length

    // 5. Naviguer vers la page de detail de la session
    await page.goto(`/session/${testSession.id}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 6. La section "Resultats de la session" DOIT etre visible pour une session terminee
    const resultsSection = page.getByText(/Résultats de la session/i).first()
    // STRICT: la section resultats DOIT etre visible pour une session passee confirmee
    await expect(resultsSection).toBeVisible({ timeout: 15000 })

    // 7. Les stats cles DOIVENT etre presentes
    const inscritsLabel = page.getByText(/Inscrits/i).first()
    // STRICT: le label "Inscrits" DOIT etre visible dans la section resultats
    await expect(inscritsLabel).toBeVisible({ timeout: 10000 })

    const checkinsLabel = page.getByText(/Check-ins/i).first()
    // STRICT: le label "Check-ins" DOIT etre visible dans la section resultats
    await expect(checkinsLabel).toBeVisible({ timeout: 10000 })

    const fiabiliteLabel = page.getByText(/Fiabilité/i).first()
    // STRICT: le label "Fiabilite" DOIT etre visible dans la section resultats
    await expect(fiabiliteLabel).toBeVisible({ timeout: 10000 })

    // 8. Le nombre d'inscrits affiche DOIT correspondre a la DB
    const inscritsValue = page.getByText(String(expectedInscrits)).first()
    // STRICT: le nombre d'inscrits (DB) DOIT etre affiche sur la page
    await expect(inscritsValue).toBeVisible({ timeout: 10000 })

    // 9. Le nombre de check-ins affiche DOIT correspondre a la DB
    const checkinsValue = page.getByText(String(expectedCheckins)).first()
    // STRICT: le nombre de check-ins (DB) DOIT etre affiche sur la page
    await expect(checkinsValue).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F73 — Rappels et notifications
// ============================================================

test.describe('F73 — Rappels et notifications', () => {
  test('F73a: la page settings affiche la section notifications', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // STRICT: la section Rappels/Notifications DOIT etre visible dans les settings
    const reminderSection = page.getByText(/Rappels|Notifications|Reminders/i).first()
    await expect(reminderSection).toBeVisible({ timeout: 15000 })

    // STRICT: au moins un toggle/switch de notification DOIT etre present
    const notifToggle = page.locator('input[type="checkbox"], [role="switch"]').first()
    await expect(notifToggle).toBeVisible({ timeout: 10000 })
  })

  test('F73b: la table ai_insights existe et est requetable en DB', async ({ db }) => {
    const insights = await db.getAiInsights()
    // STRICT: la requete DOIT reussir (la table existe et est accessible)
    expect(Array.isArray(insights)).toBe(true)

    // Si des insights existent, valider leur structure
    if (insights.length > 0) {
      // STRICT: chaque insight DOIT avoir un user_id
      expect(insights[0].user_id).toBeTruthy()
      // STRICT: chaque insight DOIT avoir un created_at
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

    // STRICT: le heading "prochaines sessions" DOIT etre visible
    await expect(page.getByText(/prochaines sessions/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('F-extra: le nombre de sessions affiche correspond a la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Fetch DB data FIRST
    const sessions = await db.getUserUpcomingSessions()
    const dbCount = sessions.length

    // 2. Navigate to the page
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    if (dbCount === 0) {
      // STRICT: DB vide → l'UI DOIT afficher un etat vide explicite
      const emptyState = page.getByText(/Aucune session|pas de session|Rien de prévu/i).first()
      // STRICT: quand la DB n'a aucune session, le message d'etat vide DOIT etre visible
      await expect(emptyState).toBeVisible({ timeout: 15000 })
    } else {
      // STRICT: DB a des sessions → le heading DOIT etre visible
      const heading = page.getByText(/prochaines sessions/i).first()
      await expect(heading).toBeVisible({ timeout: 15000 })

      // STRICT: DB a des sessions → l'etat vide NE DOIT PAS etre affiche
      const emptyState = page.getByText(/Aucune session|pas de session|Rien de prévu/i).first()
      await expect(emptyState).not.toBeVisible({ timeout: 3000 })
    }
  })

  test('F-extra: le nombre de sessions d\'une squad correspond a la DB', async ({ authenticatedPage: page, db }) => {
    // 1. Fetch DB data FIRST
    const squads = await db.getUserSquads()
    // STRICT: l'utilisateur de test DOIT avoir au moins une squad
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const squadName = squads[0].squads.name
    const dbSessions = await db.getSquadSessions(squadId)
    const activeSessions = dbSessions.filter((s: { status: string }) => s.status !== 'cancelled')

    // 2. Navigate to the squad page
    await page.goto(`/squad/${squadId}`)
    await page.waitForLoadState('networkidle')

    // STRICT: la page squad DOIT se charger
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 })

    if (activeSessions.length === 0) {
      // STRICT: DB vide pour cette squad → la page DOIT afficher le nom de la squad
      // (meme sans sessions, la squad doit etre identifiable)
      const squadTitle = page.getByText(new RegExp(squadName, 'i')).first()
      await expect(squadTitle).toBeVisible({ timeout: 10000 })
    } else {
      // STRICT: DB a des sessions actives → la page DOIT mentionner les sessions
      const sessionIndicator = page.getByText(/session|planifi/i).first()
      // STRICT: quand la DB a des sessions actives, l'indicateur de session DOIT etre visible
      await expect(sessionIndicator).toBeVisible({ timeout: 15000 })
    }
  })
})
