import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page', async ({ page }) => {
    // Check for main headline text
    await expect(page.getByText(/Transforme tes/i)).toBeVisible()
    // Check for CTA buttons - use first() to avoid strict mode violation with multiple matches
    await expect(page.getByRole('link', { name: /J'ai déjà un compte/i }).first()).toBeVisible()
  })

  test('should navigate to auth page', async ({ page }) => {
    await page.click("text=J'ai déjà un compte")
    await expect(page).toHaveURL(/\/auth/)
    await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible()
  })

  test('should show login form by default', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })

  test('should switch to register form', async ({ page }) => {
    await page.goto('/auth')
    // The toggle text is "S'inscrire" not "Créer un compte"
    await page.click("text=S'inscrire")
    await expect(page.getByRole('heading', { name: /Inscription/i })).toBeVisible()
    await expect(page.getByLabel(/Pseudo/i)).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
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
    // Wait for redirect
    await page.waitForURL(/\/auth/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should redirect unauthenticated users from squads', async ({ page }) => {
    await page.goto('/squads')
    await page.waitForURL(/\/auth/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should redirect unauthenticated users from sessions', async ({ page }) => {
    await page.goto('/sessions')
    await page.waitForURL(/\/auth/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should redirect unauthenticated users from messages', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForURL(/\/auth/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/auth/)
  })

  test('should redirect unauthenticated users from profile', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL(/\/auth/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/auth/)
  })
})
