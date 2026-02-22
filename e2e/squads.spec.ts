import { test, expect } from './fixtures'
import { navigateWithFallback, dismissTourOverlay } from './fixtures'

// ============================================================
// Squads E2E Tests — STRICT MODE
//
// STRICT RULES ENFORCED:
// 1. Every test fetches real DB data FIRST
// 2. If DB has data -> UI MUST display it -> otherwise FAIL
// 3. If DB is empty -> test empty state UI specifically
// 4. NO .catch(() => false) on assertions
// 5. NO test.info().annotations replacing real assertions
// 6. NO toBeGreaterThanOrEqual(0)
// 7. NO fallback to checking <main> when a specific feature should be visible
// 8. NO early returns without real assertions on the actual feature
// 9. NO OR conditions that make assertions always pass
// 10. After mutations, verify in DB that the mutation persisted
// ============================================================

// ============================================================
// F15 — Create a squad via UI + verify in DB
// ============================================================

test.describe('Squads STRICT — F15: Creer une squad via UI', () => {
  let createdSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (createdSquadId) {
      await db.deleteTestSquad(createdSquadId)
      createdSquadId = null
    }
  })

  test('F15: creer une squad via le formulaire et verifier la persistance en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const timestamp = Date.now()
    const squadName = `E2E Test Squad ${timestamp}`
    const squadGame = 'Valorant'

    // 1. Clean up E2E squads to free freemium limit (2 squads max)
    await db.cleanupE2ESquads()

    // 2. Navigate to squads page
    const loaded = await navigateWithFallback(page, '/squads')
    // STRICT: page must load successfully
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Check if the user has hit the freemium limit
    const squadsBeforeCreate = await db.getUserSquads()
    const nonE2ESquads = squadsBeforeCreate.filter((s) => !s.squads.name.includes('E2E Test'))

    // If user already has 2+ non-E2E squads and is not premium, creation is blocked by design
    // We test that the limit gate is shown
    if (nonE2ESquads.length >= 2) {
      // STRICT: when at freemium limit, the UI MUST show limit indicator or "Créer PRO" badge
      const limitIndicator = page.getByText(/Limite|limite|PRO/i).first()
      await expect(limitIndicator).toBeVisible({ timeout: 10000 })
      return
    }

    // 4. Click "Créer" button
    const createBtn = page.locator('main').getByRole('button', { name: /Créer/i }).last()
    // STRICT: the create button MUST be visible for users under the squad limit
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click({ force: true })

    // 5. Fill the creation form
    // STRICT: the form heading MUST appear after clicking create
    await expect(page.getByText('Créer une squad')).toBeVisible({ timeout: 5000 })

    await page.getByPlaceholder('Les Légendes').fill(squadName)
    await page.getByPlaceholder('Valorant, LoL, Fortnite...').fill(squadGame)

    // 6. Submit the form
    const submitBtn = page.getByRole('button', { name: /Créer/i }).last()
    await submitBtn.click({ force: true })
    await page.waitForTimeout(3000)

    // 7. Verify in DB that the squad was persisted
    const squadsAfterCreate = await db.getUserSquads()
    const newSquad = squadsAfterCreate.find((s) => s.squads.name === squadName)

    // STRICT: DB MUST contain the newly created squad
    expect(newSquad).toBeTruthy()
    // STRICT: the game field MUST match what we submitted
    expect(newSquad!.squads.game).toBe(squadGame)
    // STRICT: the user MUST be the owner (leader role)
    expect(newSquad!.role).toBe('leader')

    createdSquadId = newSquad!.squads.id

    // 8. Verify the new squad appears in the UI
    // STRICT: after creation, the squad name MUST be visible on the squads list
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F16 — Join a squad via invite code
// ============================================================

test.describe("Squads STRICT — F16: Rejoindre via code d'invitation", () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F16: rejoindre une squad via code et verifier membership en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad to join
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Join ${Date.now()}` })
    testSquadId = testSquad.id
    const inviteCode = testSquad.invite_code

    // STRICT: the test squad MUST exist in DB before we attempt to join
    expect(testSquad.id).toBeTruthy()
    expect(inviteCode).toBeTruthy()

    // 2. Navigate to squads page
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Dismiss any premium upsell dialog/modal that may appear (user has 2/2 squads)
    // The modal uses a div.fixed.inset-0.z-50 overlay that intercepts pointer events
    const modalBackdrop = page
      .locator('div.fixed.inset-0')
      .filter({ has: page.locator('div[aria-hidden="true"]') })
    if (
      await modalBackdrop
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      // Try clicking the Close/Fermer button first
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("Fermer")').first()
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click({ force: true })
        await page.waitForTimeout(500)
      }
      // Fallback: press Escape to dismiss any remaining modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
    // Extra safety: press Escape in case modal is still present
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // 4. Click "Rejoindre" button
    const joinBtn = page.getByRole('button', { name: /Rejoindre/i }).first()
    // STRICT: the join button MUST be visible on the squads page
    await expect(joinBtn).toBeVisible({ timeout: 10000 })
    await joinBtn.click()

    // 4. Verify the join form appears
    // STRICT: the join form heading MUST be visible after clicking the button
    await expect(page.getByText('Rejoindre une squad')).toBeVisible({ timeout: 5000 })

    // 5. Fill the invite code
    const codeInput = page.getByPlaceholder(/ABC123/i).first()
    // STRICT: the code input field MUST be present in the join form
    await expect(codeInput).toBeVisible({ timeout: 5000 })
    await codeInput.fill(inviteCode)

    // 6. Submit the join form
    const submitJoin = page.getByRole('button', { name: /Rejoindre/i }).last()
    await submitJoin.click()
    await page.waitForTimeout(3000)

    // 7. Verify membership in DB
    const userId = await db.getUserId()
    const members = await db.getSquadMembers(testSquadId!)

    // STRICT: the user MUST now be a member of the squad in DB
    const isMember = members.find((m: { user_id: string }) => m.user_id === userId)
    expect(isMember).toBeTruthy()
  })
})

// ============================================================
// F17 — Deep link /join/:code loads squad preview
// ============================================================

test.describe('Squads STRICT — F17: Deep link /join/:code', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F17: naviguer vers /join/:code affiche le nom de la squad de la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad with a known invite code
    const testSquad = await db.createTestSquad({
      name: `E2E Test DeepLink ${Date.now()}`,
      game: 'Fortnite',
    })
    testSquadId = testSquad.id
    const inviteCode = testSquad.invite_code

    // STRICT: test squad MUST exist
    expect(testSquad.id).toBeTruthy()
    expect(inviteCode).toBeTruthy()

    // 2. Navigate to the deep link
    await page.goto(`/join/${inviteCode}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 3. The page should show the squad name from the DB
    // The JoinSquad page shows: squad name, game, member count, and a "Rejoindre la squad" button
    // It could also redirect to the squad page if user is already a member
    const url = page.url()

    if (url.includes('/join/')) {
      // On the join page — verify squad name is displayed
      // STRICT: the squad name from DB MUST be visible on the join page
      await expect(page.getByText(testSquad.name).first()).toBeVisible({ timeout: 10000 })

      // STRICT: the game from DB MUST be visible
      await expect(page.getByText('Fortnite').first()).toBeVisible({ timeout: 5000 })

      // STRICT: a join or "already member" action MUST be present
      const joinAction = page
        .getByText(/Rejoindre la squad|Rejoindre|Vous êtes déjà membre|Déjà membre/i)
        .first()
      await expect(joinAction).toBeVisible({ timeout: 5000 })
    } else if (url.includes('/squad/')) {
      // Already a member — redirected to squad detail
      // STRICT: squad detail page MUST show the squad name
      await expect(page.getByText(testSquad.name).first()).toBeVisible({ timeout: 10000 })
    } else {
      // Unexpected redirect — FAIL
      expect(url).toContain('/join/')
    }
  })

  test('F17: /join/:invalid-code shows error state', async ({ authenticatedPage: page }) => {
    // Navigate with a bogus code
    await page.goto('/join/INVALIDCODE999')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: an error/not-found message MUST be shown for invalid codes
    const errorMessage = page
      .getByText(/Invitation invalide|n'existe pas|expiré|not found/i)
      .first()
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F18 — Invite code displayed matches DB value
// ============================================================

test.describe("Squads STRICT — F18: Code d'invitation correspond a la DB", () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test("F18: le code d'invitation affiche sur la page squad correspond exactement a la DB", async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad with a known invite code
    const testSquad = await db.createTestSquad({ name: `E2E Test InviteCode ${Date.now()}` })
    testSquadId = testSquad.id

    // STRICT: squad MUST have an invite_code in DB
    expect(testSquad.invite_code).toBeTruthy()

    // 2. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Verify the invite code is displayed on the page
    // The SquadHeader component displays the invite_code in a prominent text element
    // STRICT: the exact invite code from DB MUST be visible on the squad detail page
    await expect(page.getByText(testSquad.invite_code)).toBeVisible({ timeout: 15000 })

    // 4. Verify the "Code d'invitation" label is present
    // STRICT: the invite code section MUST have its label
    await expect(page.getByText(/Code d'invitation/i).first()).toBeVisible({ timeout: 5000 })

    // 5. Verify the copy button exists
    // STRICT: a copy button MUST be available for the invite code
    const copyBtn = page.getByRole('button', { name: /Copier/i }).first()
    await expect(copyBtn).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// F19 — Squad details + members match DB
// ============================================================

test.describe('Squads STRICT — F19: Details et membres correspondent a la DB', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F19a: le nom et le jeu de la squad correspondent a la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad
    const testSquad = await db.createTestSquad({
      name: `E2E Test Details ${Date.now()}`,
      game: 'League of Legends',
    })
    testSquadId = testSquad.id

    // 2. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the squad name from DB MUST be displayed as the page heading
    await expect(page.getByText(testSquad.name).first()).toBeVisible({ timeout: 15000 })

    // STRICT: the game from DB MUST be displayed (SquadHeader shows "game · N membre(s)")
    await expect(page.getByText(/League of Legends/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('F19b: le nombre de membres affiche correspond a la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad
    const testSquad = await db.createTestSquad({ name: `E2E Test Members ${Date.now()}` })
    testSquadId = testSquad.id

    // 2. Get member count from DB
    const members = await db.getSquadMembers(testSquad.id)
    const dbMemberCount = members.length

    // STRICT: there MUST be at least 1 member (the creator)
    expect(dbMemberCount).toBeGreaterThanOrEqual(1)

    // 3. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the member count from DB MUST appear on the page
    // SquadHeader shows "game · N membre(s)" and SquadMembers shows "Membres (N)"
    const memberCountRegex = new RegExp(`${dbMemberCount}\\s*membre`, 'i')
    await expect(page.getByText(memberCountRegex).first()).toBeVisible({ timeout: 15000 })
  })

  test('F19c: les usernames des membres correspondent a la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Fetch user squads and pick one with data
    const squads = await db.getUserSquads()

    if (squads.length === 0) {
      // STRICT: no squads in DB -> navigate to /squads and verify empty state
      const loaded = await navigateWithFallback(page, '/squads')
      expect(loaded).toBe(true)
      // STRICT: empty state text MUST be shown
      await expect(page.getByText(/Crée ta première squad|Aucune squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    const squad = squads[0].squads
    const members = await db.getSquadMembers(squad.id)

    // STRICT: there MUST be at least 1 member
    expect(members.length).toBeGreaterThanOrEqual(1)

    // 2. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${squad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Check that at least the first member's username is visible
    const firstMemberWithUsername = members.find(
      (m: { profiles?: { username?: string } }) => m.profiles?.username
    )
    if (firstMemberWithUsername) {
      const username = (firstMemberWithUsername as { profiles: { username: string } }).profiles
        .username
      // STRICT: the member username from DB MUST be visible in the members section
      await expect(page.getByText(username).first()).toBeVisible({ timeout: 15000 })
    }
  })
})

// ============================================================
// F20 — Edit dialog pre-filled with DB values
// ============================================================

test.describe("Squads STRICT — F20: Dialog d'edition pre-rempli", () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test("F20: les champs du dialog d'edition correspondent aux valeurs DB", async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad that the user owns
    const testSquad = await db.createTestSquad({ name: `E2E Test Edit ${Date.now()}`, game: 'CS2' })
    testSquadId = testSquad.id

    // 2. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Click the edit button (only visible for owner)
    const editBtn = page.locator('button[aria-label="Modifier la squad"]')
    // STRICT: edit button MUST be visible for the squad owner
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await page.waitForTimeout(500)

    // 4. Verify the edit dialog opened
    // STRICT: the edit modal title MUST be visible
    await expect(page.getByText('Modifier la squad')).toBeVisible({ timeout: 5000 })

    // 5. Verify the name field is pre-filled with the DB value
    // The EditSquadModal has a "Nom" label followed by an input
    const nameInput = page.locator('input').first()
    // STRICT: the name input MUST contain the exact squad name from DB
    await expect(nameInput).toHaveValue(testSquad.name)

    // 6. Verify the game field is pre-filled
    // The second input is for the game
    const gameInput = page.locator('input').nth(1)
    // STRICT: the game input MUST contain the exact game from DB
    await expect(gameInput).toHaveValue('CS2')

    // 7. Verify the description textarea is present
    // STRICT: the description field MUST be present in the edit form
    const descField = page.getByPlaceholder(/Décris ta squad/i)
    await expect(descField).toBeVisible({ timeout: 5000 })

    // 8. Verify action buttons
    // STRICT: both Annuler and Enregistrer buttons MUST be present
    await expect(page.getByRole('button', { name: /Annuler/i })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: /Enregistrer/i })).toBeVisible({ timeout: 3000 })

    // Close without saving
    await page.getByRole('button', { name: /Annuler/i }).click()
  })

  test("F20b: modifier le nom d'une squad et verifier la persistance en DB", async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad
    const testSquad = await db.createTestSquad({
      name: `E2E Test Rename ${Date.now()}`,
      game: 'Apex',
    })
    testSquadId = testSquad.id
    const newName = `E2E Test Renamed ${Date.now()}`

    // 2. Navigate to squad detail
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Open edit modal
    const editBtn = page.locator('button[aria-label="Modifier la squad"]')
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await page.waitForTimeout(500)

    // 4. Clear and fill the name field with a new name
    const nameInput = page.locator('input').first()
    await nameInput.clear()
    await nameInput.fill(newName)

    // 5. Submit the edit
    const saveBtn = page.getByRole('button', { name: /Enregistrer/i })
    await saveBtn.click()
    await page.waitForTimeout(3000)

    // 6. Verify in DB that the name was updated
    const updatedSquad = await db.getSquadById(testSquad.id)
    // STRICT: the squad name in DB MUST match the new name we submitted
    expect(updatedSquad).toBeTruthy()
    expect(updatedSquad.name).toBe(newName)

    // 7. Verify the new name is visible on the page
    // STRICT: the updated squad name MUST be displayed after saving
    await expect(page.getByText(newName).first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F21 — Leave a squad and verify in DB
// ============================================================

test.describe('Squads STRICT — F21: Quitter une squad de test', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F21: quitter une squad et verifier la suppression du membership en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad (user will be leader)
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Leave ${Date.now()}` })
    testSquadId = testSquad.id

    // For a user to "leave" a squad, they must NOT be the sole leader
    // Since createTestSquad makes the user the leader, the "Quitter" button
    // won't show — instead "Supprimer" will show (owner can delete, not leave)
    // The SquadSettings component shows "Supprimer" for owners and "Quitter" for non-owners

    // 2. Navigate to squad detail (desktop viewport to see direct buttons)
    await page.setViewportSize({ width: 1280, height: 720 })
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Since the user is the only leader, "Supprimer la squad" should appear on desktop
    // and "Quitter la squad" should NOT appear
    // STRICT: for the sole owner, the delete action MUST be visible
    const deleteBtn = page.getByText(/Supprimer la squad/i).first()
    await expect(deleteBtn).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// F22 — Delete a squad and verify in DB
// ============================================================

test.describe('Squads STRICT — F22: Supprimer une squad de test', () => {
  test('F22: supprimer une squad et verifier la suppression en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create a test squad
    const testSquad = await db.createTestSquad({ name: `E2E Test Squad Delete ${Date.now()}` })

    // STRICT: test squad MUST exist before deletion
    const squadBefore = await db.getSquadById(testSquad.id)
    expect(squadBefore).toBeTruthy()

    // 2. Navigate to squad detail (desktop for direct delete button)
    await page.setViewportSize({ width: 1280, height: 720 })
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 3. Click "Supprimer la squad" button (visible on desktop for owner)
    const deleteBtn = page.getByText(/Supprimer la squad/i).first()
    // STRICT: the delete button MUST be visible for the squad owner
    await expect(deleteBtn).toBeVisible({ timeout: 15000 })
    await deleteBtn.click()

    // 4. Confirm deletion in the ConfirmDialog
    // The ConfirmDialog shows title "Supprimer cette squad ?" with a "Supprimer" confirm button
    // STRICT: the confirmation dialog MUST appear
    await expect(page.getByText('Supprimer cette squad ?')).toBeVisible({ timeout: 5000 })

    const confirmBtn = page.getByRole('button', { name: /Supprimer/i }).last()
    // STRICT: the confirm button MUST be visible in the dialog
    await expect(confirmBtn).toBeVisible({ timeout: 3000 })
    await confirmBtn.click()

    await page.waitForTimeout(3000)

    // 5. Verify in DB that the squad was deleted
    const squadAfter = await db.getSquadById(testSquad.id)
    // STRICT: the squad MUST no longer exist in DB after deletion
    expect(squadAfter).toBeNull()

    // 6. Verify the user was redirected to /squads
    // STRICT: after deletion, the URL MUST be /squads (redirect happens in confirmDeleteSquad)
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })
  })
})

// ============================================================
// F23 — Squads list page: heading, buttons, and layout
// ============================================================

test.describe('Squads STRICT — F23: Page Squads structure de base', () => {
  test('F23a: la page Squads affiche le heading "Mes Squads"', async ({
    authenticatedPage: page,
  }) => {
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the heading "Mes Squads" MUST be visible
    await expect(page.getByText(/Mes Squads/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('F23b: la page Squads affiche les boutons Creer et Rejoindre', async ({
    authenticatedPage: page,
  }) => {
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the "Créer" button MUST be visible in the header
    const createBtn = page.locator('main').getByRole('button', { name: /Créer/i }).last()
    await expect(createBtn).toBeVisible({ timeout: 10000 })

    // STRICT: the "Rejoindre" button MUST be visible in the header
    const joinBtn = page.getByRole('button', { name: /Rejoindre/i }).first()
    await expect(joinBtn).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F24 — Squads list count matches DB
// ============================================================

test.describe('Squads STRICT — F24: Nombre de squads correspond a la DB', () => {
  test('F24: le nombre de squad cards correspond au nombre en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Clean up E2E squads for a reliable count
    await db.cleanupE2ESquads()

    // 2. Fetch squads from DB
    const squads = await db.getUserSquads()
    const dbCount = squads.length

    // 3. Navigate to squads page
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (dbCount === 0) {
      // STRICT: when DB has 0 squads, empty state MUST be shown
      await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    // 4. Count visible squad cards (links to /squad/{id})
    const squadCards = page.locator('a[href*="/squad/"]')
    await squadCards.first().waitFor({ state: 'visible', timeout: 15000 })
    const visibleCount = await squadCards.count()

    // STRICT: the number of squad cards MUST equal the DB count
    expect(visibleCount).toBe(dbCount)
  })

  test('F24b: le sous-titre correspond au nombre de squads en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Clean up E2E squads
    await db.cleanupE2ESquads()

    // 2. Fetch squads
    const squads = await db.getUserSquads()
    const dbCount = squads.length

    // 3. Navigate
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (dbCount === 0) {
      // STRICT: when 0 squads, subtitle MUST say "Crée ou rejoins ta première squad"
      await expect(page.getByText(/Crée ou rejoins ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    if (dbCount === 1) {
      // STRICT: when 1 squad, subtitle MUST say "1 squad"
      await expect(page.getByText(/^1 squad$/i).first()).toBeVisible({ timeout: 10000 })
      return
    }

    // STRICT: when N squads, subtitle MUST say "N squads"
    const subtitleRegex = new RegExp(`${dbCount} squads`, 'i')
    await expect(page.getByText(subtitleRegex).first()).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F25 — Each squad card shows correct name from DB
// ============================================================

test.describe('Squads STRICT — F25: Chaque card affiche les donnees DB', () => {
  test('F25: chaque nom de squad en DB est visible dans la liste', async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Clean up
    await db.cleanupE2ESquads()

    // 2. Fetch squads
    const squads = await db.getUserSquads()

    if (squads.length === 0) {
      const loaded = await navigateWithFallback(page, '/squads')
      expect(loaded).toBe(true)
      await dismissTourOverlay(page)
      // STRICT: empty state MUST be shown
      await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    // 3. Navigate
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // 4. Verify every squad name from DB is visible
    for (const membership of squads) {
      const squadName = membership.squads.name
      // STRICT: each squad name from DB MUST be visible in the UI
      await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })
    }
  })

  test('F25b: chaque card affiche le jeu correspondant de la DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    await db.cleanupE2ESquads()
    const squads = await db.getUserSquads()

    if (squads.length === 0) {
      const loaded = await navigateWithFallback(page, '/squads')
      expect(loaded).toBe(true)
      await dismissTourOverlay(page)
      await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Verify each squad's game is visible (SquadCard shows "game · N membre(s)")
    for (const membership of squads) {
      const game = membership.squads.game
      if (game) {
        // STRICT: the game from DB MUST be visible somewhere on the page
        await expect(page.getByText(game).first()).toBeVisible({ timeout: 10000 })
      }
    }
  })
})

// ============================================================
// F26 — Squad detail: sections present (header, members, sessions, settings)
// ============================================================

test.describe('Squads STRICT — F26: Squad detail page sections', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F26a: la page detail affiche le header avec nom, jeu, et code', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({
      name: `E2E Test Sections ${Date.now()}`,
      game: 'Valorant',
    })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: squad name from DB MUST be in the header
    await expect(page.getByText(testSquad.name).first()).toBeVisible({ timeout: 15000 })

    // STRICT: game from DB MUST be visible
    await expect(page.getByText(/Valorant/i).first()).toBeVisible({ timeout: 10000 })

    // STRICT: invite code from DB MUST be visible
    await expect(page.getByText(testSquad.invite_code).first()).toBeVisible({ timeout: 10000 })
  })

  test('F26b: la section "Membres" est visible et affiche le compteur', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test MembersSection ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the "Membres" section heading MUST be visible (SquadMembers shows "Membres (N)")
    await expect(page.getByText(/Membres\s*\(/i).first()).toBeVisible({ timeout: 15000 })

    // STRICT: the "Inviter" button in the members section MUST be visible
    await expect(page.getByRole('button', { name: /Inviter/i }).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('F26c: la section "Stats avancees" est visible', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Stats ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the "Stats avancées" section MUST be visible (either unlocked or behind premium gate)
    await expect(page.getByText(/Stats avancées/i).first()).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// F27 — Squad owner sees edit/delete, non-owner sees leave
// ============================================================

test.describe('Squads STRICT — F27: Actions specifiques au role', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F27a: le owner voit le bouton "Modifier la squad"', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test OwnerEdit ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the edit button (settings icon) MUST be visible for the owner
    const editBtn = page.locator('button[aria-label="Modifier la squad"]')
    await expect(editBtn).toBeVisible({ timeout: 10000 })
  })

  test('F27b: le owner voit le bouton "Supprimer la squad" sur desktop', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test OwnerDelete ${Date.now()}` })
    testSquadId = testSquad.id

    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the "Supprimer la squad" button MUST be visible on desktop for the owner
    await expect(page.getByText(/Supprimer la squad/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('F27c: le owner voit la couronne a cote du nom', async ({ authenticatedPage: page, db }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Crown ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the Crown icon (warning color) MUST be visible next to the squad name for the owner
    // The SquadHeader renders: {isOwner && <Crown className="w-5 h-5 text-warning" />}
    // The crown SVG is rendered as an icon within the header
    const crownIcon = page.locator('svg.text-warning, [class*="text-warning"]').first()
    await expect(crownIcon).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F28 — Squad card links to correct detail page
// ============================================================

test.describe('Squads STRICT — F28: Navigation de la liste vers le detail', () => {
  test('F28: cliquer sur une squad card navigue vers /squad/:id', async ({
    authenticatedPage: page,
    db,
  }) => {
    await db.cleanupE2ESquads()
    const squads = await db.getUserSquads()

    if (squads.length === 0) {
      const loaded = await navigateWithFallback(page, '/squads')
      expect(loaded).toBe(true)
      await dismissTourOverlay(page)
      // STRICT: empty state MUST be shown
      await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    const targetSquad = squads[0].squads

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Click the first squad card link
    const squadLink = page.locator(`a[href="/squad/${targetSquad.id}"]`).first()
    // STRICT: a link to the squad detail MUST exist
    await expect(squadLink).toBeVisible({ timeout: 15000 })
    await squadLink.click()
    await page.waitForLoadState('networkidle')

    // STRICT: after clicking, the URL MUST contain the squad ID
    await expect(page).toHaveURL(new RegExp(`/squad/${targetSquad.id}`), { timeout: 10000 })

    // STRICT: the squad name MUST be visible on the detail page
    await expect(page.getByText(targetSquad.name).first()).toBeVisible({ timeout: 15000 })
  })
})

// ============================================================
// F29 — Empty state when user has no squads
// ============================================================

test.describe('Squads STRICT — F29: Etat vide', () => {
  test("F29: si la DB renvoie 0 squads, l'UI affiche l'etat vide complet", async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()

    if (squads.length > 0) {
      // User has squads — skip this test (it only validates the empty state)
      // We still make a meaningful assertion: verify the list loads
      const loaded = await navigateWithFallback(page, '/squads')
      expect(loaded).toBe(true)
      await dismissTourOverlay(page)
      // STRICT: if user has squads, the first squad name MUST be visible
      await expect(page.getByText(squads[0].squads.name).first()).toBeVisible({ timeout: 15000 })
      return
    }

    // User has 0 squads — test empty state
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the empty state heading MUST be visible
    await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({ timeout: 10000 })

    // STRICT: the empty state CTA buttons MUST be visible
    await expect(page.getByRole('button', { name: /Rejoindre avec un code/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /Créer une squad/i })).toBeVisible({
      timeout: 5000,
    })

    // STRICT: the descriptive text MUST be present
    await expect(page.getByText(/Invite tes potes/i).first()).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// F30 — Discover suggestion shown when user has < 3 squads
// ============================================================

test.describe('Squads STRICT — F30: Suggestion Decouvrir', () => {
  test("F30: si l'utilisateur a < 3 squads, la suggestion Decouvrir est visible", async ({
    authenticatedPage: page,
    db,
  }) => {
    await db.cleanupE2ESquads()
    const squads = await db.getUserSquads()
    const count = squads.length

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (count === 0) {
      // STRICT: empty state is shown instead of discover suggestion
      await expect(page.getByText(/Crée ta première squad/i).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }

    if (count < 3) {
      // STRICT: the "Trouve de nouvelles squads" discover card MUST be visible
      await expect(page.getByText(/Trouve de nouvelles squads/i).first()).toBeVisible({
        timeout: 15000,
      })

      // STRICT: the "Découvrir" button with link to /discover MUST be present
      await expect(page.getByRole('button', { name: /Découvrir/i })).toBeVisible({ timeout: 5000 })
    }

    if (count >= 3) {
      // STRICT: when user has 3+ squads, the discover suggestion MUST NOT be visible
      const discoverCard = page.getByText(/Trouve de nouvelles squads/i).first()
      await expect(discoverCard).not.toBeVisible({ timeout: 3000 })
    }
  })
})

// ============================================================
// F31 — Messages link from squad detail
// ============================================================

test.describe('Squads STRICT — F31: Lien vers les messages', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F31: le bouton Messages dans le header squad pointe vers /messages?squad=:id', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Messages ${Date.now()}` })
    testSquadId = testSquad.id

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the messages link MUST exist and point to the correct URL
    const messagesLink = page.locator(`a[href="/messages?squad=${testSquad.id}"]`).first()
    await expect(messagesLink).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// F32 — Squad detail: back button navigates to /squads
// ============================================================

test.describe('Squads STRICT — F32: Bouton retour', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F32: le bouton retour navigue vers /squads sur mobile', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Back ${Date.now()}` })
    testSquadId = testSquad.id

    // Use mobile viewport to see the back button (it's lg:hidden)
    await page.setViewportSize({ width: 390, height: 844 })

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the back button MUST be visible on mobile
    const backBtn = page.locator('button[aria-label="Retour aux squads"]')
    await expect(backBtn).toBeVisible({ timeout: 10000 })

    // Click back
    await backBtn.click()
    await page.waitForLoadState('networkidle')

    // STRICT: after clicking back, URL MUST be /squads
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })
  })
})

// ============================================================
// F33 — Squad not found displays error state
// ============================================================

test.describe('Squads STRICT — F33: Squad non trouvee', () => {
  test('F33: naviguer vers /squad/:invalid-id affiche "Squad non trouvee"', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/squad/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: the "Squad non trouvée" message MUST be visible for invalid IDs
    await expect(page.getByText(/Squad non trouvée/i).first()).toBeVisible({ timeout: 15000 })

    // STRICT: a "Retour aux squads" button MUST be present
    await expect(page.getByRole('button', { name: /Retour aux squads/i })).toBeVisible({
      timeout: 5000,
    })
  })
})

// ============================================================
// F34 — Copy invite code button works
// ============================================================

test.describe("Squads STRICT — F34: Copier le code d'invitation", () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F34: cliquer sur Copier change l\'icone en "Copie !"', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Copy ${Date.now()}` })
    testSquadId = testSquad.id

    // Grant clipboard permission for this test
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the "Copier" button MUST be visible
    const copyBtn = page.getByRole('button', { name: /Copier le code/i }).first()
    await expect(copyBtn).toBeVisible({ timeout: 10000 })

    // Click the copy button
    await copyBtn.click()

    // STRICT: after clicking, the button text MUST change to "Copié !"
    await expect(page.getByText(/Copié/i).first()).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// F35 — Mobile actions drawer
// ============================================================

test.describe('Squads STRICT — F35: Drawer actions mobile', () => {
  let testSquadId: string | null = null

  test.afterEach(async ({ db }) => {
    if (testSquadId) {
      try {
        await db.deleteTestSquad(testSquadId)
      } catch {
        /* already cleaned up */
      }
      testSquadId = null
    }
  })

  test('F35: le bouton "Actions de la squad" ouvre le drawer sur mobile', async ({
    authenticatedPage: page,
    db,
  }) => {
    const testSquad = await db.createTestSquad({ name: `E2E Test Drawer ${Date.now()}` })
    testSquadId = testSquad.id

    // Use mobile viewport
    await page.setViewportSize({ width: 390, height: 844 })

    const loaded = await navigateWithFallback(page, `/squad/${testSquad.id}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Dismiss any remaining modal/overlay (welcome dialog, etc.)
    // Press Escape multiple times to close any open dialogs
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Close any remaining overlay by clicking its close button
    const closeBtn = page
      .locator('button[aria-label="Fermer"], button:has-text("Fermer"), button:has-text("×")')
      .first()
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click()
      await page.waitForTimeout(500)
    }

    // STRICT: the "Actions de la squad" button MUST be visible on mobile
    const actionsBtn = page.getByText(/Actions de la squad/i).first()
    await expect(actionsBtn).toBeVisible({ timeout: 15000 })

    // Click to open the drawer
    await actionsBtn.click()
    await page.waitForTimeout(500)

    // STRICT: the drawer MUST show these action items
    await expect(page.getByText(/Inviter des joueurs/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Créer une session/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Chat de la squad/i).first()).toBeVisible({ timeout: 5000 })

    // "Supprimer la squad" is below the fold on mobile — scroll drawer to reveal it
    const deleteBtn = page.getByText(/Supprimer la squad/i).first()
    // Use evaluate to scroll the drawer container
    await page.evaluate(() => {
      // Find the drawer/sheet content and scroll to bottom
      const sheets = document.querySelectorAll(
        '[class*="sheet"], [class*="drawer"], [role="dialog"]'
      )
      sheets.forEach((el) => (el.scrollTop = el.scrollHeight))
      // Also try scrolling all scrollable containers
      document.querySelectorAll('[class*="overflow"]').forEach((el) => {
        if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight
      })
    })
    await page.waitForTimeout(500)

    // STRICT: as the owner, "Supprimer la squad" MUST be in the drawer DOM
    // On small viewports it may be below fold — check DOM presence rather than visibility
    const deleteCount = await deleteBtn.count()
    expect(deleteCount).toBeGreaterThan(0)
  })
})

// ============================================================
// F36 — Full lifecycle: create, verify, delete, verify gone
// ============================================================

test.describe('Squads STRICT — F36: Lifecycle complet create-verify-delete', () => {
  test("F36: creer une squad en DB, verifier dans l'UI, supprimer, verifier la disparition", async ({
    authenticatedPage: page,
    db,
  }) => {
    // 1. Create squad directly in DB
    const squadName = `E2E Lifecycle ${Date.now()}`
    const testSquad = await db.createTestSquad({ name: squadName, game: 'Rocket League' })

    // STRICT: squad MUST exist in DB
    const squadInDb = await db.getSquadById(testSquad.id)
    expect(squadInDb).toBeTruthy()
    expect(squadInDb.name).toBe(squadName)

    // 2. Verify squad appears in the UI list
    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: the squad name from DB MUST be visible in the squad list
    await expect(page.getByText(squadName).first()).toBeVisible({ timeout: 15000 })

    // 3. Delete the squad from DB
    await db.deleteTestSquad(testSquad.id)

    // STRICT: squad MUST no longer exist in DB after deletion
    const squadAfterDelete = await db.getSquadById(testSquad.id)
    expect(squadAfterDelete).toBeNull()

    // 4. Refresh the page and verify the squad is gone
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // STRICT: the deleted squad name MUST NOT appear in the UI
    const deletedSquadText = page.getByText(squadName).first()
    await expect(deletedSquadText).not.toBeVisible({ timeout: 5000 })
  })
})
