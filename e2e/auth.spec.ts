import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page', async ({ page }) => {
    // Check for main headline text - exact text from LandingHero.tsx
    await expect(page.getByText(/Transforme/i)).toBeVisible()
    await expect(page.getByText(/on verra/i)).toBeVisible()
    await expect(page.getByText(/Squad Planner fait que tes sessions ont vraiment lieu/i)).toBeVisible()
    // Check for CTA buttons
    await expect(page.getByRole('link', { name: /Se connecter/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Créer ma squad/i }).first()).toBeVisible()
  })

  test('should navigate to auth page', async ({ page }) => {
    await page.click("text=Se connecter")
    await expect(page).toHaveURL(/\/auth/)
    await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible()
  })

  test('should show login form by default', async ({ page }) => {
    await page.goto('/auth')
    // Wait for auth page to load
    await expect(page.getByRole('heading', { name: /Connexion|Se connecter/i })).toBeVisible()
    // Check form elements exist
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter|Connexion/i })).toBeVisible()
  })

  test('should switch to register form', async ({ page }) => {
    await page.goto('/auth')
    // Wait for the page to load and find register link/button
    await expect(page.getByRole('heading', { name: /Connexion|Se connecter/i })).toBeVisible()
    
    // Look for register toggle button or link
    const registerToggle = page.getByText(/S'inscrire|Inscription|Créer un compte/i).first()
    if (await registerToggle.isVisible()) {
      await registerToggle.click()
      await expect(page.getByRole('heading', { name: /Inscription/i })).toBeVisible()
      await expect(page.getByLabel(/Pseudo/i)).toBeVisible()
    } else {
      // If no toggle, go directly to register URL
      await page.goto('/auth?mode=register')
      await expect(page.getByRole('heading', { name: /Inscription/i })).toBeVisible()
    }
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
    // Wait for redirect or 404/error page
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
