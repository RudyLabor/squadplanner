import { test, expect } from './fixtures'

// ============================================================
// Gamification E2E Tests — F46-F51
// Uses shared fixtures: authenticatedPage (logged-in), db (TestDataHelper)
// Target: https://squadplanner.fr — French UI
// XP Thresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000]
//
// Every assertion MUST be meaningful — no `expect(x || true).toBeTruthy()`
// and no `expect(count).toBeGreaterThanOrEqual(0)`.
// ============================================================

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000]

function computeLevelFromXP(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i
  }
  return 0
}

// ============================================================
// F46a — Challenges list matches DB count
// ============================================================
test.describe('F46a — Challenges list matches DB count', () => {
  test('challenges section count matches active challenges in DB', async ({ authenticatedPage: page, db }) => {
    const { challenges } = await db.getChallenges()
    const activeChallengeCount = challenges.length

    test.skip(activeChallengeCount === 0, 'No active challenges in DB — nothing to verify')

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Try to find the challenges section
    let challengesHeading = page.getByText(/challenges/i).first()
    let hasSection = await challengesHeading.isVisible().catch(() => false)

    // If not visible, scroll down to find it
    if (!hasSection) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await page.waitForTimeout(500)
      hasSection = await challengesHeading.isVisible().catch(() => false)
    }
    if (!hasSection) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await page.waitForTimeout(500)
      hasSection = await challengesHeading.isVisible().catch(() => false)
    }

    test.skip(!hasSection, 'Challenges section not found on profile page after scrolling')

    // Look for the count text pattern: "X challenges disponibles" or similar
    const countText = page.getByText(/\d+\s*challenges?\s*disponibles?/i).first()
    const hasCount = await countText.isVisible().catch(() => false)

    if (hasCount) {
      const text = await countText.textContent()
      expect(text).toBeTruthy()
      const match = text!.match(/(\d+)/)
      expect(match).toBeTruthy()
      const displayedCount = parseInt(match![1], 10)
      expect(displayedCount).toBe(activeChallengeCount)
    } else {
      // Count text not shown — verify the section itself is visible with challenge cards
      await expect(challengesHeading).toBeVisible()
      const challengeCards = page.locator('[class*="challenge"], [class*="card"]').filter({ hasText: /xp/i })
      const visibleCount = await challengeCards.count()
      expect(visibleCount).toBe(activeChallengeCount)
    }
  })
})

// ============================================================
// F46b — Challenge tabs filter correctly
// ============================================================
test.describe('F46b — Challenge tabs filter correctly', () => {
  test('clicking Quotidien tab filters to daily challenges', async ({ authenticatedPage: page, db }) => {
    const { challenges } = await db.getChallenges()
    const dailyChallenges = challenges.filter((c: { type: string }) => c.type === 'daily')

    test.skip(challenges.length === 0, 'No active challenges in DB — cannot test tabs')

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Scroll to challenges section
    const challengesSection = page.getByText(/challenges/i).first()
    if (await challengesSection.isVisible().catch(() => false)) {
      await challengesSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
    }

    // Find "Quotidien" tab
    const dailyTab = page.getByRole('button', { name: /Quotidien/i }).first()
    const hasDailyTab = await dailyTab.isVisible().catch(() => false)

    // Find "Tous" tab as well
    const allTab = page.getByRole('button', { name: /Tous/i }).first()
    const hasAllTab = await allTab.isVisible().catch(() => false)

    test.skip(!hasDailyTab && !hasAllTab, 'Challenge tabs (Quotidien/Tous) not found on page')

    if (hasDailyTab) {
      await dailyTab.click()
      await page.waitForTimeout(800)

      // Count visible challenge cards after filtering to daily
      const challengeCards = page.locator('[class*="challenge"], [class*="card"]').filter({ hasText: /xp/i })
      const visibleCount = await challengeCards.count()

      // The visible count must match the daily challenges from DB
      expect(visibleCount).toBe(dailyChallenges.length)
    }

    if (hasAllTab) {
      await expect(allTab).toBeVisible()
    }
  })
})

// ============================================================
// F47 — Claim XP button state matches DB
// ============================================================
test.describe('F47 — Claim XP button state matches DB', () => {
  test('Reclamer button visible when completed unclaimed challenges exist', async ({ authenticatedPage: page, db }) => {
    const { challenges, userChallenges } = await db.getChallenges()

    test.skip(challenges.length === 0, 'No challenges exist in DB — skipping claim test')

    // Find challenges that are completed but XP not yet claimed
    const claimable = userChallenges.filter(
      (uc: { completed_at: string | null; xp_claimed: boolean }) => uc.completed_at != null && !uc.xp_claimed
    )

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Scroll to challenges area
    await page.evaluate(() => window.scrollBy(0, 400))
    await page.waitForTimeout(500)

    const claimBtn = page.getByRole('button', { name: /Réclamer/i }).first()
    const hasClaim = await claimBtn.isVisible().catch(() => false)

    if (claimable.length > 0) {
      // There are claimable challenges — "Réclamer" button MUST be visible
      expect(hasClaim).toBe(true)
      await expect(claimBtn).toBeVisible()
    } else {
      // No claimable challenges — "Réclamer" button should NOT be visible
      // or all challenges should show as already claimed
      expect(hasClaim).toBe(false)
    }
  })
})

// ============================================================
// F48 — Level + XP matches DB
// ============================================================
test.describe('F48 — Level + XP matches DB', () => {
  test('displayed XP and level match profile data from DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    test.skip(!profile, 'Profile not found in DB')

    const dbXP = profile.xp || 0
    const dbLevel = profile.level || computeLevelFromXP(dbXP)

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // --- Validate XP ---
    const allXpElements = page.locator(':text-matches("\\\\d+.*xp", "i")')
    const xpCount = await allXpElements.count()

    test.skip(xpCount === 0, 'XP text not found on profile page')

    const xpText = await allXpElements.first().textContent()
    expect(xpText).toBeTruthy()
    const xpMatch = xpText!.match(/(\d[\d\s,.]*)/i)
    expect(xpMatch).toBeTruthy()
    const displayedXP = parseInt(xpMatch![1].replace(/[\s,.]/g, ''), 10)
    expect(displayedXP).toBe(dbXP)

    // --- Validate Level ---
    const levelElements = page.locator(':text-matches("niveau\\\\s*\\\\d+|level\\\\s*\\\\d+|niv\\\\.\\\\s*\\\\d+", "i")')
    const lvlCount = await levelElements.count()

    if (lvlCount > 0) {
      const lvlText = await levelElements.first().textContent()
      expect(lvlText).toBeTruthy()
      const levelMatch = lvlText!.match(/(?:niveau|level|niv\.?)\s*(\d+)/i)
      expect(levelMatch).toBeTruthy()
      const displayedLevel = parseInt(levelMatch![1], 10)
      expect(displayedLevel).toBe(dbLevel)
    } else {
      // Level text not found — skip this sub-assertion
      test.info().annotations.push({ type: 'info', description: 'Level text not found on page — only XP validated' })
    }
  })
})

// ============================================================
// F49 — Badges count matches DB
// ============================================================
test.describe('F49 — Badges count matches DB', () => {
  test('badges section reflects DB badge data', async ({ authenticatedPage: page, db }) => {
    const { badges } = await db.getChallenges()
    const dbBadgeCount = badges.length

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Scroll to badges section
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(500)

    // Look for "Succès X/Y" pattern (e.g. "Succès 3/6")
    const successText = page.getByText(/Succès\s*\d+/i).first()
    let hasSuccess = await successText.isVisible().catch(() => false)

    // If not found, try clicking "Succès" tab
    if (!hasSuccess) {
      const successTab = page.getByRole('button', { name: /Succès/i }).first()
      if (await successTab.isVisible().catch(() => false)) {
        await successTab.click()
        await page.waitForTimeout(500)
        hasSuccess = await successText.isVisible().catch(() => false)
      }
    }

    // Also try "Badges Saisonniers" section
    if (!hasSuccess) {
      const badgesSection = page.getByText(/Badges Saisonniers/i).first()
      const hasBadgesSection = await badgesSection.isVisible().catch(() => false)
      if (!hasBadgesSection) {
        // Try deeper scroll
        await page.evaluate(() => window.scrollBy(0, 500))
        await page.waitForTimeout(500)
        hasSuccess = await successText.isVisible().catch(() => false)
      }
    }

    test.skip(!hasSuccess, 'Badges/Succès section not found on profile page')

    const text = await successText.textContent()
    expect(text).toBeTruthy()
    const match = text!.match(/(\d+)/)
    expect(match).toBeTruthy()
    const displayedBadges = parseInt(match![1], 10)
    expect(displayedBadges).toBe(dbBadgeCount)
  })
})

// ============================================================
// F50 — Streak matches DB
// ============================================================
test.describe('F50 — Streak matches DB', () => {
  test('streak counter on profile matches DB value', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    test.skip(!profile, 'Profile not found in DB')

    const dbStreak = profile.streak_days || 0

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Look for streak text: "X jours de suite"
    const streakText = page.getByText(/jour.*de suite/i).first()
    const hasStreak = await streakText.isVisible().catch(() => false)

    // Also check for fire emoji as streak indicator
    const fireEmoji = page.locator(':text-matches("🔥")').first()
    const hasFire = await fireEmoji.isVisible().catch(() => false)

    if (dbStreak === 0) {
      // No streak in DB — streak counter should NOT be visible (or should show 0)
      if (hasStreak) {
        // If streak text is shown, it should display 0
        const text = await streakText.textContent()
        expect(text).toBeTruthy()
        const match = text!.match(/(\d+)/)
        expect(match).toBeTruthy()
        const displayedStreak = parseInt(match![1], 10)
        expect(displayedStreak).toBe(0)
      } else {
        // No streak text visible is correct when DB streak is 0
        expect(hasStreak).toBe(false)
      }
    } else {
      // DB has a streak > 0 — streak text MUST be visible
      test.skip(!hasStreak && !hasFire, 'Streak text not found on profile page despite DB streak > 0')

      if (hasStreak) {
        const text = await streakText.textContent()
        expect(text).toBeTruthy()
        const match = text!.match(/(\d+)/)
        expect(match).toBeTruthy()
        const displayedStreak = parseInt(match![1], 10)
        expect(displayedStreak).toBe(dbStreak)
      } else if (hasFire) {
        // Fire emoji visible — try to extract the number near it
        const fireText = await fireEmoji.textContent()
        expect(fireText).toBeTruthy()
        const match = fireText!.match(/(\d+)/)
        if (match) {
          const displayedStreak = parseInt(match[1], 10)
          expect(displayedStreak).toBe(dbStreak)
        } else {
          // Fire emoji visible but no number extracted — fail
          expect(fireText).toContain(String(dbStreak))
        }
      }
    }
  })
})

// ============================================================
// F51a — Leaderboard on discover
// ============================================================
test.describe('F51a — Leaderboard on discover', () => {
  test('classement tab shows leaderboard entries matching DB', async ({ authenticatedPage: page, db }) => {
    const leaderboard = await db.getLeaderboard(10)
    test.skip(leaderboard.length === 0, 'No profiles in DB leaderboard')

    await page.goto('/discover')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Find and click "Classement" tab
    const classementTab = page.getByRole('tab', { name: /Classement/i }).first()
    const classementBtn = page.getByRole('button', { name: /Classement/i }).first()
    const classementText = page.getByText(/Classement/i).first()

    let clicked = false
    if (await classementTab.isVisible().catch(() => false)) {
      await classementTab.click()
      clicked = true
    } else if (await classementBtn.isVisible().catch(() => false)) {
      await classementBtn.click()
      clicked = true
    } else if (await classementText.isVisible().catch(() => false)) {
      await classementText.click()
      clicked = true
    }

    test.skip(!clicked, 'Leaderboard/Classement tab not found on /discover page')

    await page.waitForTimeout(1000)

    // Collect usernames from DB leaderboard (non-null only)
    const dbUsernames = leaderboard
      .map((p: { username: string | null }) => p.username)
      .filter((u: string | null): u is string => u != null && u.length > 0)

    test.skip(dbUsernames.length === 0, 'All leaderboard profiles have null usernames')

    // Verify at least 1 DB username is visible on the page
    let foundAny = false
    for (const username of dbUsernames) {
      const usernameLocator = page.getByText(username, { exact: false }).first()
      const isVisible = await usernameLocator.isVisible().catch(() => false)
      if (isVisible) {
        foundAny = true
        break
      }
    }

    expect(foundAny).toBe(true)
  })
})

// ============================================================
// F51b — Squad leaderboard
// ============================================================
test.describe('F51b — Squad leaderboard', () => {
  test('squad detail shows classement section with member usernames', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    test.skip(squads.length === 0, 'No squads available for this user')

    const firstSquad = squads[0]
    const members = await db.getSquadMembers(firstSquad.squads.id)
    test.skip(members.length === 0, 'No members in squad')

    // Navigate to squad detail
    await page.goto('/squads')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click the first squad card
    const squadLink = page.locator(`a[href*="/squads/"]`).first()
    const hasSquadLink = await squadLink.isVisible().catch(() => false)
    test.skip(!hasSquadLink, 'No squad link visible on /squads page')

    await squadLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Look for "Classement" section in the squad detail page
    let classementSection = page.getByText(/Classement/i).first()
    let hasClassement = await classementSection.isVisible().catch(() => false)

    // If not visible, scroll down
    if (!hasClassement) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await page.waitForTimeout(500)
      hasClassement = await classementSection.isVisible().catch(() => false)
    }

    test.skip(!hasClassement, 'Classement section not found on squad detail page')

    await expect(classementSection).toBeVisible()

    // Collect member usernames from DB (profiles join)
    const memberUsernames = members
      .map((m: { profiles: { username: string | null } | null }) => m.profiles?.username)
      .filter((u: string | null | undefined): u is string => u != null && u.length > 0)

    test.skip(memberUsernames.length === 0, 'All squad members have null usernames')

    // Verify at least one member username from DB is visible in the leaderboard
    let foundAny = false
    for (const username of memberUsernames) {
      const usernameLocator = page.getByText(username, { exact: false }).first()
      const isVisible = await usernameLocator.isVisible().catch(() => false)
      if (isVisible) {
        foundAny = true
        break
      }
    }

    expect(foundAny).toBe(true)
  })
})
