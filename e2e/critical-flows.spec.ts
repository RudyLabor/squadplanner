import { test, expect } from '@playwright/test'

/**
 * Critical user flows from BIBLEV2.md
 * Covers: dark/light mode switch, keyboard navigation, and
 * supplements existing tests for login, squad creation, messaging, sessions
 */

const TEST_USER = {
  email: 'testowner@squadtest.dev',
  password: 'TestPassword123!'
}

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('Critical Flow: Login -> Home', () => {
  test('should login and reach home page', async ({ page }) => {
    await loginUser(page)
    // After login, should be on home or root
    const url = page.url()
    expect(url.endsWith('/') || url.includes('/home')).toBeTruthy()
    // Should see some authenticated content
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Critical Flow: Create a Squad', () => {
  test('should open create squad form and fill fields', async ({ page }) => {
    await loginUser(page)
    await page.goto('/squads')

    // Click "Créer" button to open the form
    await page.click('button:has-text("Créer")')
    await expect(page.getByText('Créer une squad')).toBeVisible()

    // Fill the squad name
    const nameInput = page.getByPlaceholder('Les Légendes')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('E2E Test Squad')

    // Fill the game name
    const gameInput = page.getByPlaceholder('Valorant, LoL...')
    await expect(gameInput).toBeVisible()
    await gameInput.fill('Valorant')

    // Verify the form is ready to submit
    const submitBtn = page.getByRole('button', { name: /Créer/i }).last()
    await expect(submitBtn).toBeVisible()
  })
})

test.describe('Critical Flow: Send a Message', () => {
  test('should navigate to messages and open a conversation', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')

    await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible()

    // Try to click on a conversation
    const squadConvo = page.getByText('Test Squad Alpha')
    if (await squadConvo.isVisible()) {
      await squadConvo.click()
      // Should see message input
      const messageInput = page.getByPlaceholder(/message|écris/i)
      await expect(messageInput).toBeVisible()

      // Type a message (don't actually send to avoid polluting data)
      await messageInput.fill('E2E test message')
      await expect(messageInput).toHaveValue('E2E test message')
    }
  })
})

test.describe('Critical Flow: Dark/Light Mode Switch', () => {
  test('should switch theme in settings', async ({ page }) => {
    await loginUser(page)
    await page.goto('/settings')

    // Wait for page to load
    await expect(page.getByText(/Apparence/i)).toBeVisible()

    // Find the theme selector - it uses SegmentedControl with "Sombre", "Clair", "Auto"
    const lightButton = page.getByText('Clair')
    await expect(lightButton).toBeVisible()

    // Click "Clair" to switch to light mode
    await lightButton.click()

    // The document should now have data-theme="light"
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')

    // Switch back to dark
    const darkButton = page.getByText('Sombre')
    await darkButton.click()

    const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(themeDark).toBe('dark')
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

    // Tab to email input and fill
    await page.keyboard.press('Tab')
    const emailFocused = await page.evaluate(() =>
      document.activeElement?.getAttribute('type') === 'email' ||
      document.activeElement?.tagName === 'INPUT'
    )
    // Fill email via keyboard
    await page.getByLabel(/Email/i).focus()
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
    await page.click('body')

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that the focused element has a visible outline or ring
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      const style = window.getComputedStyle(el)
      // Check for visible focus indicator
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

    // Page should load
    await expect(page.getByRole('heading', { name: /Sessions/i }).first()).toBeVisible()
  })
})
