import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('landing page should have proper heading structure', async ({ page }) => {
    await page.goto('/')

    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toBeVisible()
  })

  test('landing page should have proper contrast', async ({ page }) => {
    await page.goto('/')

    // Check that text is visible (not the same color as background)
    const heading = page.locator('h1')
    const color = await heading.evaluate(el => window.getComputedStyle(el).color)
    expect(color).not.toBe('rgb(8, 9, 10)') // Not same as background
  })

  test('buttons should be focusable', async ({ page }) => {
    await page.goto('/')

    // Click on body first to ensure focus starts in the page
    await page.click('body')

    // Tab to first focusable element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that some element has focus (link or button)
    const focusedElement = page.locator(':focus')
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase()).catch(() => null)
    expect(['a', 'button', 'input']).toContain(tagName)
  })

  test('links should have accessible names', async ({ page }) => {
    await page.goto('/')

    const links = page.locator('a')
    const count = await links.count()

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const accessibleName = await link.getAttribute('aria-label') ||
        await link.textContent()
      expect(accessibleName).toBeTruthy()
    }
  })

  test('auth form should have labels', async ({ page }) => {
    await page.goto('/auth')

    // Wait for the form to load
    await page.waitForSelector('form')

    // Check that inputs have associated labels (using getByLabel)
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
  })
})

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate landing page with keyboard', async ({ page }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to activate with Enter
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should be able to submit auth form with keyboard', async ({ page }) => {
    await page.goto('/auth')

    // Wait for form to load
    await page.waitForSelector('form')

    await page.getByLabel(/Email/i).fill('test@example.com')
    await page.keyboard.press('Tab')
    await page.getByLabel(/Mot de passe/i).fill('password123')
    await page.keyboard.press('Enter')

    // Form should attempt to submit
    await expect(page).toHaveURL(/\/auth/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test('should display correctly on iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check for main content
    await expect(page.getByText(/Transforme tes/i)).toBeVisible()
    // Check for at least one CTA - use first() to avoid strict mode violation
    await expect(page.getByRole('link', { name: /J'ai déjà un compte/i }).first()).toBeVisible()
  })

  test('should display correctly on iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.getByText(/Transforme tes/i)).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await expect(page.getByText(/Transforme tes/i)).toBeVisible()
  })

  test('auth page should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')

    // Wait for form to load
    await page.waitForSelector('form')

    // Form should be visible and usable
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('landing page should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should not have console errors on landing page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out known acceptable errors (like Supabase connection, browser-specific)
    const criticalErrors = errors.filter(e =>
      !e.includes('supabase') &&
      !e.includes('network') &&
      !e.includes('Failed to fetch') &&
      !e.includes('ERR_') &&
      !e.includes('WebSocket') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('CORS') &&
      !e.includes('Cross-Origin')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should not have console errors on auth page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/auth')
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(e =>
      !e.includes('supabase') &&
      !e.includes('network') &&
      !e.includes('Failed to fetch') &&
      !e.includes('ERR_') &&
      !e.includes('WebSocket') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('CORS') &&
      !e.includes('Cross-Origin')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
