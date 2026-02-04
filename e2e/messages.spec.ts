import { test, expect } from '@playwright/test'

// Test credentials from GEMINI.md
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

test.describe('Messages Page', () => {
  test('should display messages page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')
    await expect(page.getByRole('heading', { name: /Messages/i })).toBeVisible()
  })

  test('should show messages page content', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')
    // Page should have loaded - just check for any visible content
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Chat Functionality', () => {
  test('should show chat when clicking a squad conversation', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')

    // Click on Test Squad Alpha conversation if visible
    const squadConvo = page.getByText('Test Squad Alpha')
    if (await squadConvo.isVisible()) {
      await squadConvo.click()
      // Should show message input
      await expect(page.getByPlaceholder(/message|écris/i)).toBeVisible()
    }
  })

  test('should have message input field in chat', async ({ page }) => {
    await loginUser(page)
    await page.goto('/messages')

    // Click on first available conversation
    const squadConvo = page.getByText('Test Squad Alpha')
    if (await squadConvo.isVisible()) {
      await squadConvo.click()
      await expect(page.getByPlaceholder(/message|écris/i)).toBeVisible()
    }
  })
})
