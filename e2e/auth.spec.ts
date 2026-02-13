import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page', async ({ page }) => {
    // Check for main headline text - exact text from LandingHero.tsx
    await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible()
    await expect(page.getByText(/Squad Planner fait que tes sessions ont vraiment lieu/i)).toBeVisible()
    // Check for CTA buttons (use first() to handle multiple matches)
    await expect(page.getByRole('link', { name: /Se connecter/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Créer ma squad/i }).first()).toBeVisible()
    // Check page title
    await expect(page).toHaveTitle(/Squad Planner/)
  })

  test('should navigate to auth page', async ({ page }) => {
    await page.click("text=Se connecter")
    await expect(page).toHaveURL(/\/auth/)
    // Auth page h1 in login mode: "T'as manqué à ta squad !"
    await expect(page.getByRole('heading', { name: /manqué à ta squad/i })).toBeVisible()
  })

  test('should show login form by default', async ({ page }) => {
    await page.goto('/auth')
    // Auth page h1 in login mode
    await expect(page.getByRole('heading', { name: /manqué à ta squad/i })).toBeVisible()
    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })

  test('should switch to register form', async ({ page }) => {
    await page.goto('/auth')
    // Wait for login page to load
    await expect(page.getByRole('heading', { name: /manqué à ta squad/i })).toBeVisible()

    // Look for register toggle button or link
    const registerToggle = page.getByText(/Créer un compte/i).first()
    await registerToggle.click()
    // Auth page h1 in register mode: "Rejoins l'aventure"
    await expect(page.getByRole('heading', { name: /Rejoins l'aventure/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth')
    await page.click('button[type="submit"]')
    // Form should not submit with empty fields (HTML5 validation)
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    // Should stay on auth page due to validation
    await expect(page).toHaveURL(/\/auth/)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from squad detail', async ({ page }) => {
    await page.goto('/squad/123')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/\/(auth|$|404)/)
  })

  test('should redirect unauthenticated users from squads', async ({ page }) => {
    await page.goto('/squads')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/\/(auth|$|404)/)
  })

  test('should redirect unauthenticated users from sessions', async ({ page }) => {
    await page.goto('/sessions')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/\/(auth|$|404)/)
  })

  test('should redirect unauthenticated users from messages', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/\/(auth|$|404)/)
  })

  test('should redirect unauthenticated users from profile', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/\/(auth|$|404)/)
  })
})
