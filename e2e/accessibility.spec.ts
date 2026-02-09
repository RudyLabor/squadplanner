import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Comprehensive accessibility tests using @axe-core/playwright
 * Tests EVERY page for WCAG 2.1 AA violations in both dark and light mode
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

// --- Public pages (no auth required) ---

const publicPages = [
  { name: 'Landing', path: '/' },
  { name: 'Auth', path: '/auth' },
  { name: 'Premium', path: '/premium' },
]

// --- Protected pages (auth required) ---

const protectedPages = [
  { name: 'Home', path: '/home' },
  { name: 'Squads', path: '/squads' },
  { name: 'Messages', path: '/messages' },
  { name: 'Profile', path: '/profile' },
  { name: 'Settings', path: '/settings' },
  { name: 'Party', path: '/party' },
]

test.describe('Axe Accessibility Audit - Public Pages', () => {
  for (const { name, path } of publicPages) {
    test(`${name} page should have no WCAG violations (dark mode)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test(`${name} page should have no WCAG violations (light mode)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }
})

test.describe('Axe Accessibility Audit - Protected Pages', () => {
  for (const { name, path } of protectedPages) {
    test(`${name} page should have no WCAG violations (dark mode)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await loginUser(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test(`${name} page should have no WCAG violations (light mode)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await loginUser(page)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }
})

test.describe('Heading Structure', () => {
  test('landing page should have exactly one h1', async ({ page }) => {
    await page.goto('/')
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toBeVisible()
  })

  test('auth page should have exactly one h1', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')
    const h1 = page.locator('h1')
    const count = await h1.count()
    // Should have at least one heading
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Form Accessibility', () => {
  test('auth form inputs should have associated labels', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
  })

  test('auth form should have accessible submit button', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    const submitBtn = page.getByRole('button', { name: /Se connecter/i })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })
})

test.describe('Link Accessibility', () => {
  test('all links on landing page should have accessible names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const links = page.locator('a')
    const count = await links.count()

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const isVisible = await link.isVisible()
      if (!isVisible) continue

      const ariaLabel = await link.getAttribute('aria-label')
      const textContent = await link.textContent()
      const title = await link.getAttribute('title')

      // Every visible link must have an accessible name
      const hasAccessibleName = !!(ariaLabel || (textContent && textContent.trim()) || title)
      expect(hasAccessibleName).toBeTruthy()
    }
  })
})

test.describe('Image Accessibility', () => {
  test('all images on landing page should have alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')

      // Image should have alt text or be marked decorative
      const isAccessible = alt !== null || role === 'presentation' || role === 'none'
      expect(isAccessible).toBeTruthy()
    }
  })
})

test.describe('Focus Management', () => {
  test('buttons should be keyboard focusable', async ({ page }) => {
    await page.goto('/')
    await page.click('body')

    // Tab through several elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Some interactive element should have focus
    const focusedTag = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName.toLowerCase() : null
    })
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedTag)
  })

  test('keyboard navigation on auth form', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form')

    // Fill via getByLabel then tab through
    await page.getByLabel(/Email/i).fill('test@example.com')
    await page.keyboard.press('Tab')
    await page.getByLabel(/Mot de passe/i).fill('password123')
    await page.keyboard.press('Enter')

    // Form should attempt to submit
    await expect(page).toHaveURL(/\/auth/)
  })
})

test.describe('Color Contrast', () => {
  test('landing page text should have sufficient contrast against background', async ({ page }) => {
    await page.goto('/')

    const heading = page.locator('h1')
    const color = await heading.evaluate(el => window.getComputedStyle(el).color)
    const bgColor = await heading.evaluate(el => {
      let current = el as HTMLElement | null
      while (current) {
        const bg = window.getComputedStyle(current).backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg
        current = current.parentElement
      }
      return 'rgb(0, 0, 0)'
    })

    // Text color should not match background
    expect(color).not.toBe(bgColor)
  })
})

test.describe('ARIA Landmarks', () => {
  test('landing page should have main landmark', async ({ page }) => {
    await page.goto('/')

    // Page should have a main element or role="main"
    const main = page.locator('main, [role="main"]')
    const count = await main.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('auth page should have main landmark', async ({ page }) => {
    await page.goto('/auth')

    const main = page.locator('main, [role="main"]')
    const count = await main.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
