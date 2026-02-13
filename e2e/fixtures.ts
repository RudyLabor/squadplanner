import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test user credentials
export const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
  username: 'testuser',
}

// Create Supabase client for test setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nxbqiwmfyafgshxzczxo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Extended test with authentication
export const test = base.extend<{
  authenticatedPage: import('@playwright/test').Page
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login the test user
    await page.goto('/auth')

    // Wait for form to be ready
    await page.waitForSelector('form')

    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Wait for successful login (redirect to home or stay with user loaded)
    await page
      .waitForFunction(
        () => {
          return (
            window.location.pathname !== '/auth' ||
            document.querySelector('[data-testid="user-menu"]') !== null
          )
        },
        { timeout: 10000 }
      )
      .catch(() => {
        // If redirect didn't happen, check if we're still on auth with an error
        console.log('Login may have failed - continuing anyway')
      })

    // Give the app time to initialize auth state
    await page.waitForTimeout(1000)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page)
  },
})

// Helper function to login via UI
export async function loginViaUI(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form')

  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')

  // Wait for navigation away from auth page
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 })
}

// Helper to check if user is authenticated
export async function isAuthenticated(page: import('@playwright/test').Page): Promise<boolean> {
  const url = page.url()
  return !url.includes('/auth') && !url.endsWith('/')
}

// Re-export expect for convenience
export { expect }
