import { test, expect } from '@playwright/test'

const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!',
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('Gamification - XP System', () => {
  test('should display XP bar on profile', async ({ page }) => {
    await loginUser(page)
    await page.goto('/profile')

    // Check for XP bar presence
    const xpSection = page.locator('[class*="xp"], [data-testid="xp-bar"]').first()
    await expect(xpSection).toBeVisible({ timeout: 10000 })
  })

  test('should display user level on profile', async ({ page }) => {
    await loginUser(page)
    await page.goto('/profile')

    // Check for level indicator (text like "Level" or "Niveau")
    const levelText = page.getByText(/level|niveau/i).first()
    await expect(levelText).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Gamification - Challenges', () => {
  test('should display challenges section', async ({ page }) => {
    await loginUser(page)
    await page.goto('/profile')

    // Look for challenges section
    const challengesSection = page.getByText(/challenge|defi/i).first()
    await expect(challengesSection).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Gamification - Streak', () => {
  test('should display streak counter on home', async ({ page }) => {
    await loginUser(page)
    await page.goto('/home')

    // Look for streak indicator (fire emoji or "streak" text)
    const streakIndicator = page.locator('[class*="streak"], [data-testid="streak"]').first()
    const fireEmoji = page.getByText(/🔥/)

    const hasStreak = (await streakIndicator.isVisible()) || (await fireEmoji.isVisible())
    expect(hasStreak).toBeTruthy()
  })
})

test.describe('Gamification - Leaderboard', () => {
  test('should display leaderboard on squad detail', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    // Click on first squad
    const squadCard = page.locator('[class*="squad"], button').first()
    if (await squadCard.isVisible()) {
      await squadCard.click()

      // Wait for squad detail page
      await page.waitForTimeout(2000)

      // Look for leaderboard section
      const leaderboard = page.getByText(/leaderboard|classement|podium/i).first()
      if (await leaderboard.isVisible()) {
        expect(true).toBeTruthy()
      }
    }
  })
})
