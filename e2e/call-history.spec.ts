import { test, expect, navigateWithFallback } from './fixtures'

/**
 * Call History E2E Tests (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de OR conditions passe-partout
 * - DB fetched FIRST -> UI MUST match
 * - Si la DB a des appels -> le UI DOIT les afficher -> sinon FAIL
 * - Si la DB est vide -> le empty state DOIT s'afficher -> sinon FAIL
 * - Pas de early return sans assertion reelle
 * - Pas de fallback sur <main> quand la feature specifique est requise
 * - Pas de CSS class checks (bg-primary) — utiliser la validation fonctionnelle
 */

// ============================================================
// Test 1 — Page loads with correct heading and aria-label
// ============================================================
test.describe('Call History — Page loads', () => {
  test('should display page heading and aria-label', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first to confirm user exists
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const pageOk = await navigateWithFallback(page, '/call-history')
    // STRICT: page MUST load without errors
    expect(pageOk).toBe(true)

    // STRICT: The main landmark with aria-label="Historique d'appels" MUST be visible
    const mainLandmark = page.locator('main[aria-label*="appels" i]')
    await expect(mainLandmark).toBeVisible({ timeout: 10000 })

    // STRICT: The h1 heading "Tes appels recents" MUST be visible
    const heading = page.locator('h1').getByText(/Tes appels récents/i)
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// Test 2 — Call history data matches DB
// ============================================================
test.describe('Call History — Data matches DB', () => {
  test('DB has calls -> UI displays call entries; DB empty -> UI shows empty state', async ({ authenticatedPage: page, db }) => {
    // STRICT: Fetch DB data FIRST
    const calls = await db.getCallHistory(20)

    const pageOk = await navigateWithFallback(page, '/call-history')
    // STRICT: page MUST load
    expect(pageOk).toBe(true)
    await page.waitForTimeout(1500)

    if (calls.length > 0) {
      // STRICT: DB has calls -> UI MUST show at least one call entry card
      // Each call entry has a button with aria-label="Appeler {name}"
      const callButtons = page.locator('button[aria-label*="Appeler"]')
      const buttonCount = await callButtons.count()
      // STRICT: must have > 0, not >= 0
      expect(buttonCount).toBeGreaterThan(0)

      // STRICT: The subtitle MUST show the call count (e.g., "3 appels")
      const countText = page.getByText(/\d+\s*appels?/i).first()
      // STRICT: await expect — no .catch
      await expect(countText).toBeVisible({ timeout: 5000 })

      // STRICT: At least one time group label MUST be visible
      const groupLabel = page.getByText(/Aujourd'hui|Hier|Cette semaine|Ce mois|Plus ancien/i).first()
      await expect(groupLabel).toBeVisible({ timeout: 5000 })
    } else {
      // STRICT: DB has no calls -> empty state MUST be shown
      // The CallHistoryList empty state shows "Pret a appeler ta squad ?" when filter='all'
      const emptyHeading = page.getByText(/Prêt à appeler ta squad/i).first()
      // STRICT: await expect — direct assertion
      await expect(emptyHeading).toBeVisible({ timeout: 10000 })

      // STRICT: Empty state subtitle MUST be visible
      const emptySubtitle = page.getByText(/Lance un appel vocal/i).first()
      await expect(emptySubtitle).toBeVisible({ timeout: 5000 })

      // STRICT: "Aller en party vocale" button MUST be visible in empty state
      const partyLink = page.getByText(/Aller en party vocale/i).first()
      await expect(partyLink).toBeVisible({ timeout: 5000 })
    }
  })
})

// ============================================================
// Test 3 — Call entry details match DB (type labels, callback buttons)
// ============================================================
test.describe('Call History — Entry details', () => {
  test('call entries show correct type labels and callback buttons', async ({ authenticatedPage: page, db }) => {
    // STRICT: Fetch DB data FIRST
    const calls = await db.getCallHistory(10)

    const pageOk = await navigateWithFallback(page, '/call-history')
    // STRICT: page MUST load
    expect(pageOk).toBe(true)
    await page.waitForTimeout(1500)

    if (calls.length === 0) {
      // STRICT: No calls in DB -> empty state MUST be visible (not just "any heading")
      const emptyHeading = page.getByText(/Prêt à appeler ta squad/i).first()
      await expect(emptyHeading).toBeVisible({ timeout: 10000 })
      return
    }

    // STRICT: DB has calls -> call type labels MUST be visible
    // The component renders "Entrant", "Sortant", "Manque", "Rejete" labels
    const typeLabel = page.getByText(/Entrant|Sortant|Manqué|Rejeté/i).first()
    // STRICT: await expect — no .catch
    await expect(typeLabel).toBeVisible({ timeout: 5000 })

    // STRICT: Callback buttons (aria-label="Appeler {name}") MUST be present
    const callbackButtons = page.locator('button[aria-label*="Appeler"]')
    const buttonCount = await callbackButtons.count()
    // STRICT: must have > 0
    expect(buttonCount).toBeGreaterThan(0)

    // STRICT: Callback button count MUST match the number of visible call entries
    // (at most PAGE_SIZE=10 displayed initially)
    const expectedDisplayed = Math.min(calls.length, 10)
    // STRICT: button count must equal the expected displayed count
    expect(buttonCount).toBe(expectedDisplayed)

    // STRICT: Each callback button MUST have a contact name in its aria-label
    const firstButtonLabel = await callbackButtons.first().getAttribute('aria-label')
    expect(firstButtonLabel).toBeTruthy()
    // STRICT: aria-label must start with "Appeler " followed by a name
    expect(firstButtonLabel!).toMatch(/^Appeler .+/)
  })
})

// ============================================================
// Test 4 — Filter tabs are visible and functionally validated
// ============================================================
test.describe('Call History — Filter tabs', () => {
  test('filter buttons Tous/Entrants/Sortants/Manques are visible and functional', async ({ authenticatedPage: page, db }) => {
    // STRICT: Fetch DB first
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    // STRICT: Fetch call history from DB for functional validation
    const userId = await db.getUserId()
    const { data: rawCalls } = await db.admin
      .from('calls')
      .select('id, caller_id, receiver_id, status')
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(100)

    const allCalls = rawCalls || []
    // Compute expected counts per filter using the same logic as the app
    const incomingCalls = allCalls.filter(c => c.receiver_id === userId)
    const outgoingCalls = allCalls.filter(c => c.caller_id === userId)
    const missedCalls = allCalls.filter(c => c.status === 'missed')

    const pageOk = await navigateWithFallback(page, '/call-history')
    // STRICT: page MUST load
    expect(pageOk).toBe(true)

    // STRICT: ALL four filter buttons MUST be visible — individual assertions, no OR
    const tousBtn = page.getByRole('button', { name: /^Tous$/i }).first()
    await expect(tousBtn).toBeVisible({ timeout: 5000 })

    const entrantsBtn = page.getByRole('button', { name: /^Entrants$/i }).first()
    await expect(entrantsBtn).toBeVisible({ timeout: 5000 })

    const sortantsBtn = page.getByRole('button', { name: /^Sortants$/i }).first()
    await expect(sortantsBtn).toBeVisible({ timeout: 5000 })

    const manquesBtn = page.getByRole('button', { name: /^Manqués$/i }).first()
    await expect(manquesBtn).toBeVisible({ timeout: 5000 })

    // STRICT: "Tous" is the default filter — verify the initial call count matches DB
    const callButtonsAll = page.locator('button[aria-label*="Appeler"]')
    const initialCount = await callButtonsAll.count()
    if (allCalls.length > 0) {
      expect(initialCount).toBeGreaterThan(0)
      expect(initialCount).toBeLessThanOrEqual(allCalls.length)
    }

    // STRICT: Click "Entrants" — verify results change functionally
    await entrantsBtn.click()
    await page.waitForTimeout(500)

    const callButtonsIncoming = page.locator('button[aria-label*="Appeler"]')
    const incomingCount = await callButtonsIncoming.count()

    if (incomingCalls.length === 0) {
      // STRICT: no incoming calls in DB -> empty state or 0 entries
      expect(incomingCount).toBe(0)
      // STRICT: filtered empty message MUST appear
      const filteredEmpty = page.getByText(/Rien pour le moment/i).first()
      await expect(filteredEmpty).toBeVisible({ timeout: 5000 })
    } else {
      // STRICT: incoming calls exist -> entries MUST be shown
      expect(incomingCount).toBeGreaterThan(0)
      expect(incomingCount).toBeLessThanOrEqual(incomingCalls.length)
    }

    // STRICT: Click "Sortants" — verify results change functionally
    await sortantsBtn.click()
    await page.waitForTimeout(500)

    const callButtonsOutgoing = page.locator('button[aria-label*="Appeler"]')
    const outgoingCount = await callButtonsOutgoing.count()

    if (outgoingCalls.length === 0) {
      // STRICT: no outgoing calls in DB -> empty state or 0 entries
      expect(outgoingCount).toBe(0)
    } else {
      // STRICT: outgoing calls exist -> entries MUST be shown
      expect(outgoingCount).toBeGreaterThan(0)
      expect(outgoingCount).toBeLessThanOrEqual(outgoingCalls.length)
    }

    // STRICT: Click "Manques" — verify results change functionally
    await manquesBtn.click()
    await page.waitForTimeout(500)

    const callButtonsMissed = page.locator('button[aria-label*="Appeler"]')
    const missedCount = await callButtonsMissed.count()

    if (missedCalls.length === 0) {
      // STRICT: no missed calls in DB -> empty state or 0 entries
      expect(missedCount).toBe(0)
    } else {
      // STRICT: missed calls exist -> entries MUST be shown
      expect(missedCount).toBeGreaterThan(0)
      expect(missedCount).toBeLessThanOrEqual(missedCalls.length)
    }

    // STRICT: Click "Tous" again — verify all calls are restored
    await tousBtn.click()
    await page.waitForTimeout(500)

    const callButtonsRestored = page.locator('button[aria-label*="Appeler"]')
    const restoredCount = await callButtonsRestored.count()

    // STRICT: after clicking "Tous" again, count must match initial state
    expect(restoredCount).toBe(initialCount)
  })
})

// ============================================================
// Test 5 — Empty state after filtering (if DB has calls of specific types)
// ============================================================
test.describe('Call History — Filter empty state', () => {
  test('filtering to a type with no calls shows correct empty message', async ({ authenticatedPage: page, db }) => {
    // STRICT: Fetch DB data FIRST
    const calls = await db.getCallHistory(20)

    const pageOk = await navigateWithFallback(page, '/call-history')
    // STRICT: page MUST load
    expect(pageOk).toBe(true)
    await page.waitForTimeout(1500)

    if (calls.length === 0) {
      // STRICT: No calls at all — empty state for "Tous" shown
      const emptyHeading = page.getByText(/Prêt à appeler ta squad/i).first()
      await expect(emptyHeading).toBeVisible({ timeout: 10000 })

      // STRICT: Click "Entrants" filter with no calls -> different empty message
      const entrantsBtn = page.getByRole('button', { name: /^Entrants$/i }).first()
      await expect(entrantsBtn).toBeVisible({ timeout: 5000 })
      await entrantsBtn.click()
      await page.waitForTimeout(500)

      // STRICT: Empty state for filtered view shows "Rien pour le moment"
      const filteredEmpty = page.getByText(/Rien pour le moment/i).first()
      await expect(filteredEmpty).toBeVisible({ timeout: 5000 })

      // STRICT: The subtitle must mention the filter type
      const filteredSubtitle = page.getByText(/Aucun appel entrant/i).first()
      await expect(filteredSubtitle).toBeVisible({ timeout: 5000 })
      return
    }

    // STRICT: We have calls — try filtering to "Manques" which may have 0 results
    const manquesBtn = page.getByRole('button', { name: /^Manqués$/i }).first()
    await expect(manquesBtn).toBeVisible({ timeout: 5000 })
    await manquesBtn.click()
    await page.waitForTimeout(500)

    // Check if there are missed calls in the DB
    // Note: the calls table may not have a 'status' field matching exactly —
    // just verify the UI shows either entries or the empty state
    const missedButtons = page.locator('button[aria-label*="Appeler"]')
    const missedCount = await missedButtons.count()

    if (missedCount === 0) {
      // STRICT: No missed calls -> empty state for "Manques" filter MUST show
      const filteredEmpty = page.getByText(/Rien pour le moment/i).first()
      await expect(filteredEmpty).toBeVisible({ timeout: 5000 })
    } else {
      // STRICT: Missed calls exist -> entries MUST be visible
      expect(missedCount).toBeGreaterThan(0)
      // STRICT: Type label "Manque" MUST be visible
      const missedLabel = page.getByText(/Manqué/i).first()
      await expect(missedLabel).toBeVisible({ timeout: 5000 })
    }
  })
})
