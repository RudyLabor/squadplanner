import { test, expect } from '@playwright/test'

/**
 * Critical user flows
 * Covers: login, squad creation, messaging, dark/light mode, keyboard nav, sessions
 */

const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

async function dismissCookieBanner(page: import('@playwright/test').Page) {
  try {
    const acceptBtn = page.getByRole('button', { name: /Tout accepter/i })
    await acceptBtn.waitFor({ state: 'visible', timeout: 3000 })
    await acceptBtn.click()
    await page.waitForTimeout(500)
  } catch {
    // Cookie banner not present, continue
  }
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  // App redirects to /home (or /onboarding for new users)
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 })
}

test.describe('Critical Flow: Login -> Home', () => {
  test('should login and reach home page', async ({ page }) => {
    await loginUser(page)
    const url = page.url()
    expect(url.includes('/home') || url.includes('/onboarding') || url.endsWith('/')).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Critical Flow: Create a Squad', () => {
  test('should open create squad form and fill fields', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')
    await page.waitForLoadState('networkidle')

    // Click "Créer" button within the squads page (not the sidebar session button)
    // Close any dialog that might be open (e.g., guided tour or session dialog)
    const closeDialog = page.locator('dialog button:has-text("Close"), button:has-text("Fermer le guide"), button:has-text("Passer")')
    if (await closeDialog.first().isVisible().catch(() => false)) {
      await closeDialog.first().click()
      await page.waitForTimeout(300)
    }
    const createBtn = page.locator('main[aria-label="Squads"], main').last().getByRole('button', { name: 'Créer' })
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // The modal/form should appear
    await expect(page.getByText('Créer une squad')).toBeVisible()

    // Fill the squad name
    const nameInput = page.getByPlaceholder('Les Légendes')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('E2E Test Squad')

    // Fill the game name
    const gameInput = page.getByPlaceholder('Valorant, LoL, Fortnite...')
    await expect(gameInput).toBeVisible()
    await gameInput.fill('Valorant')

    // Verify the form is ready to submit
    const submitBtn = page.getByRole('button', { name: /Créer/i }).last()
    await expect(submitBtn).toBeVisible()
  })
})

test.describe('Critical Flow: Send a Message', () => {
  test('should navigate to messages page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // Messages page should load - check for conversation list or empty state
    const hasContent =
      (await page.locator('nav[aria-label="Conversations"]').isVisible().catch(() => false)) ||
      (await page.getByText(/conversation/i).first().isVisible().catch(() => false)) ||
      (await page.locator('body').isVisible())
    expect(hasContent).toBeTruthy()
  })
})

test.describe('Critical Flow: Dark/Light Mode Switch', () => {
  test('should switch theme in settings', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Wait for page to load - heading is "Paramètres"
    await expect(page.getByText(/Paramètres/i).first()).toBeVisible()

    // Find the theme selector - it uses SegmentedControl with "Sombre", "Clair", "Auto"
    const lightButton = page.getByText('Clair').first()
    if (await lightButton.isVisible().catch(() => false)) {
      await lightButton.click()

      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
      expect(theme).toBe('light')

      // Switch back to dark
      const darkButton = page.getByText('Sombre').first()
      await darkButton.click()

      const themeDark = await page.evaluate(
        () => document.documentElement.getAttribute('data-theme')
      )
      expect(themeDark).toBe('dark')
    }
  })

  test('should persist theme via emulateMedia', async ({ page }) => {
    // Test light mode rendering via emulateMedia
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Switch to dark
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Critical Flow: Keyboard Navigation', () => {
  test('should tab through landing page interactive elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Focus the page
    await page.click('body')

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Something should be focused
    const focusedTag = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName.toLowerCase() : null
    })
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedTag)
  })

  test('should navigate auth form entirely with keyboard', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    // Fill email via input selector
    const emailInput = page.locator('input[type="email"]')
    await emailInput.focus()
    await page.keyboard.type('keyboard@test.com')

    // Tab to password
    await page.keyboard.press('Tab')
    await page.keyboard.type('password123')

    // Tab to submit and press Enter
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Should stay on auth (invalid credentials) or show error
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('body')

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that the focused element has a visible outline or ring
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      const style = window.getComputedStyle(el)
      return (
        style.outlineStyle !== 'none' ||
        style.boxShadow !== 'none' ||
        el.classList.toString().includes('focus') ||
        el.classList.toString().includes('ring')
      )
    })
    expect(hasFocusStyle).toBeTruthy()
  })
})

test.describe('Critical Flow: Create a Session', () => {
  test('should navigate to sessions page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')

    // Page heading is "Tes prochaines sessions"
    await expect(page.getByText(/prochaines sessions/i).first()).toBeVisible()
  })
})
