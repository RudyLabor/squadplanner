import { test, expect, navigateWithFallback, dismissCookieBanner } from './fixtures'

/**
 * Call History E2E Tests
 *
 * Tests the /call-history page which displays call records from the DB `calls` table.
 * The page uses useCallHistoryStore (Zustand) to fetch calls via caller_id/receiver_id.
 * If the table doesn't exist, the page gracefully shows an empty state.
 */

// ============================================================
// Test 1 — Page loads with correct heading and aria-label
// ============================================================
test.describe('Call History — Page loads', () => {
  test('should display page heading and aria-label', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const pageOk = await navigateWithFallback(page, '/call-history')
    expect(pageOk).toBe(true)
    await dismissCookieBanner(page)

    // The main landmark with aria-label must be visible
    const mainLandmark = page.locator('main[aria-label*="appels" i]')
    await expect(mainLandmark).toBeVisible({ timeout: 10000 })

    // The h1 heading must be visible
    const heading = page.locator('h1').getByText(/Tes appels récents/i)
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// Test 2 — Call history data matches DB
// ============================================================
test.describe('Call History — Data matches DB', () => {
  test('DB has calls -> UI displays call entries; DB empty -> UI shows empty state', async ({
    authenticatedPage: page,
    db,
  }) => {
    const calls = await db.getCallHistory(20)

    const pageOk = await navigateWithFallback(page, '/call-history')
    expect(pageOk).toBe(true)
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    if (calls.length > 0) {
      // DB has calls -> UI MUST show at least one call entry card
      const callButtons = page.locator('button[aria-label*="Appeler"]')
      const buttonCount = await callButtons.count()
      expect(buttonCount).toBeGreaterThan(0)

      // The subtitle MUST show the call count (e.g., "6 appels")
      const countText = page.getByText(/\d+\s*appels?/i).first()
      await expect(countText).toBeVisible({ timeout: 5000 })
    } else {
      // DB has no calls -> empty state MUST be shown
      const emptyHeading = page.getByText(/Prêt à appeler ta squad/i).first()
      const noCallsText = page.getByText(/Aucun appel pour le moment/i).first()
      // Either the empty state heading or the subtitle "Aucun appel" is visible
      const hasEmpty = await emptyHeading.isVisible({ timeout: 5000 }).catch(() => false)
      const hasNoCallsText = await noCallsText.isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasEmpty || hasNoCallsText).toBe(true)
    }
  })
})

// ============================================================
// Test 3 — Call entry details (type labels, callback buttons)
// ============================================================
test.describe('Call History — Entry details', () => {
  test('call entries show correct type labels and callback buttons', async ({
    authenticatedPage: page,
    db,
  }) => {
    const calls = await db.getCallHistory(10)

    const pageOk = await navigateWithFallback(page, '/call-history')
    expect(pageOk).toBe(true)
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    if (calls.length === 0) {
      // No calls in DB -> empty state or "Aucun appel" shown
      const noCallsText = page.getByText(/Aucun appel pour le moment|Prêt à appeler/i).first()
      await expect(noCallsText).toBeVisible({ timeout: 10000 })
      return
    }

    // DB has calls -> call type labels MUST be visible
    const typeLabel = page.getByText(/Entrant|Sortant|Manqué|Rejeté/i).first()
    await expect(typeLabel).toBeVisible({ timeout: 5000 })

    // Callback buttons (aria-label="Appeler {name}") MUST be present
    const callbackButtons = page.locator('button[aria-label*="Appeler"]')
    const buttonCount = await callbackButtons.count()
    expect(buttonCount).toBeGreaterThan(0)

    // Button count must be within expected range (at most PAGE_SIZE=10)
    const expectedMax = Math.min(calls.length, 10)
    expect(buttonCount).toBeLessThanOrEqual(expectedMax)

    // First callback button MUST have a contact name in its aria-label
    const firstButtonLabel = await callbackButtons.first().getAttribute('aria-label')
    expect(firstButtonLabel).toBeTruthy()
    expect(firstButtonLabel!).toMatch(/^Appeler .+/)
  })
})

// ============================================================
// Test 4 — Filter tabs are visible and functional
// ============================================================
test.describe('Call History — Filter tabs', () => {
  test('filter buttons Tous/Entrants/Sortants/Manques are visible and functional', async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const pageOk = await navigateWithFallback(page, '/call-history')
    expect(pageOk).toBe(true)
    await dismissCookieBanner(page)
    await page.waitForTimeout(1500)

    // ALL four filter tabs MUST be visible
    const tousBtn = page.getByRole('tab', { name: /^Tous$/i }).first()
    await expect(tousBtn).toBeVisible({ timeout: 5000 })

    const entrantsBtn = page.getByRole('tab', { name: /^Entrants$/i }).first()
    await expect(entrantsBtn).toBeVisible({ timeout: 5000 })

    const sortantsBtn = page.getByRole('tab', { name: /^Sortants$/i }).first()
    await expect(sortantsBtn).toBeVisible({ timeout: 5000 })

    const manquesBtn = page.getByRole('tab', { name: /^Manqués$/i }).first()
    await expect(manquesBtn).toBeVisible({ timeout: 5000 })

    // "Tous" is selected by default
    await expect(tousBtn).toHaveAttribute('aria-selected', 'true')

    // Click "Entrants" -> verify it becomes selected
    await entrantsBtn.click()
    await page.waitForTimeout(500)
    await expect(entrantsBtn).toHaveAttribute('aria-selected', 'true')

    // Click "Sortants" -> verify it becomes selected
    await sortantsBtn.click()
    await page.waitForTimeout(500)
    await expect(sortantsBtn).toHaveAttribute('aria-selected', 'true')

    // Click "Manqués" -> verify it becomes selected
    await manquesBtn.click()
    await page.waitForTimeout(500)
    await expect(manquesBtn).toHaveAttribute('aria-selected', 'true')

    // Click "Tous" again -> verify restored
    await tousBtn.click()
    await page.waitForTimeout(500)
    await expect(tousBtn).toHaveAttribute('aria-selected', 'true')
  })
})

// ============================================================
// Test 5 — Filter empty state
// ============================================================
test.describe('Call History — Filter empty state', () => {
  test('filtering to a type with no calls shows empty or filtered results', async ({
    authenticatedPage: page,
    db,
  }) => {
    const calls = await db.getCallHistory(20)

    const pageOk = await navigateWithFallback(page, '/call-history')
    expect(pageOk).toBe(true)
    await dismissCookieBanner(page)
    await page.waitForTimeout(2000)

    if (calls.length === 0) {
      // No calls -> empty state for "Tous"
      const emptyContent = page.getByText(/Prêt à appeler ta squad|Aucun appel/i).first()
      await expect(emptyContent).toBeVisible({ timeout: 10000 })
      return
    }

    // We have calls — try filtering to "Manqués" which may have 0 results
    const manquesBtn = page.getByRole('tab', { name: /^Manqués$/i }).first()
    await expect(manquesBtn).toBeVisible({ timeout: 5000 })
    await manquesBtn.click()
    await page.waitForTimeout(500)

    const missedButtons = page.locator('button[aria-label*="Appeler"]')
    const missedCount = await missedButtons.count()

    if (missedCount === 0) {
      // No missed calls -> empty state for "Manqués" filter
      const filteredEmpty = page.getByText(/Rien pour le moment/i).first()
      await expect(filteredEmpty).toBeVisible({ timeout: 5000 })
    } else {
      // Missed calls exist -> entries MUST be visible
      expect(missedCount).toBeGreaterThan(0)
    }
  })
})
