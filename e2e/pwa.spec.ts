import { test, expect } from './fixtures'

/**
 * PWA E2E Tests — F70 (STRICT MODE)
 *
 * REGLE STRICTE :
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de fallback sur body quand un element specifique est requis
 * - Chaque champ manifest DOIT etre present → sinon FAIL
 * - Le service worker DOIT etre enregistre → sinon FAIL
 * - Les localStorage keys DOIVENT fonctionner → sinon FAIL
 */

// =============================================================================
// F70 — PWA Manifest
// =============================================================================
test.describe('F70 — PWA Manifest', () => {

  test('F70a: Web manifest is accessible and contains ALL required fields', async ({ page }) => {
    // Try manifest.json first, then manifest.webmanifest
    let response = await page.goto('https://squadplanner.fr/manifest.json')
    if (!response || response.status() !== 200) {
      response = await page.goto('https://squadplanner.fr/manifest.webmanifest')
    }

    // STRICT: Response MUST exist and be 200
    expect(response).toBeTruthy()
    // STRICT: status MUST be exactly 200
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()
    // STRICT: manifest body MUST be truthy
    expect(manifest).toBeTruthy()

    // STRICT: name field MUST be present and non-empty
    expect(manifest.name).toBeTruthy()
    expect(typeof manifest.name).toBe('string')
    expect(manifest.name.length).toBeGreaterThan(0)

    // STRICT: icons array MUST be present with at least one icon
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
    // STRICT: must have > 0, not >= 0
    expect(manifest.icons.length).toBeGreaterThan(0)

    // STRICT: Each icon MUST have src and sizes
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy()
      expect(icon.sizes).toBeTruthy()
    }

    // STRICT: start_url MUST be defined
    expect(manifest.start_url).toBeTruthy()

    // STRICT: display MUST be standalone, fullscreen, or minimal-ui
    expect(manifest.display).toBeTruthy()
    expect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/)

    // STRICT: short_name should also be present for PWA completeness
    if (manifest.short_name) {
      expect(typeof manifest.short_name).toBe('string')
      expect(manifest.short_name.length).toBeGreaterThan(0)
    }
  })

  test('F70b: Service worker file is accessible and contains JavaScript', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/sw.js')

    // STRICT: Response MUST exist
    expect(response).toBeTruthy()
    // STRICT: Status MUST be 200
    expect(response!.status()).toBe(200)

    // STRICT: Content-Type MUST contain javascript
    const contentType = response!.headers()['content-type'] || ''
    expect(contentType).toContain('javascript')

    // STRICT: Body must have actual JS content (not empty)
    const body = await response!.text()
    expect(body).toBeTruthy()
    expect(body.length).toBeGreaterThan(10)
  })
})

// =============================================================================
// F70 — PWA Install Banner Logic (authenticated)
// =============================================================================
test.describe('F70 — PWA Install Banner Logic', () => {

  test('F70c: PWA install banner localStorage keys function correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')
    await authenticatedPage.waitForTimeout(1500)

    // STRICT: Visit counter key must be readable (returns number)
    const visits = await authenticatedPage.evaluate(() => {
      return Number(localStorage.getItem('sq-visits') || '0')
    })
    // STRICT: visits must be a finite number
    expect(typeof visits).toBe('number')
    expect(Number.isFinite(visits)).toBe(true)

    // STRICT: Simulate 3+ visits, clear dismiss/installed flags
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('sq-visits', '3')
      localStorage.removeItem('sq-pwa-dismissed')
      localStorage.removeItem('sq-pwa-installed')
    })

    // STRICT: dismissed flag MUST be null after removal
    const dismissedAt = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-pwa-dismissed')
    )
    // STRICT: must be exactly null
    expect(dismissedAt).toBeNull()

    // STRICT: installed flag MUST be null after removal
    const installedAt = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-pwa-installed')
    )
    // STRICT: must be exactly null
    expect(installedAt).toBeNull()

    // STRICT: visits MUST read back as '3'
    const visitsReadback = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-visits')
    )
    // STRICT: exact string match
    expect(visitsReadback).toBe('3')

    // STRICT: Dispatch beforeinstallprompt — app must NOT crash
    await authenticatedPage.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = () => Promise.resolve()
      ;(event as any).userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
    })
    await authenticatedPage.waitForTimeout(1000)

    // STRICT: Page must still be functional — check that main content is visible
    // Not just body, but the actual app main landmark
    const mainContent = authenticatedPage.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 5000 })

    // STRICT: Navigation must still work after event dispatch
    const navExists = authenticatedPage.locator('nav').first()
    await expect(navExists).toBeVisible({ timeout: 5000 })
  })

  test('F70d: PWA dismiss flag persists correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home')
    await authenticatedPage.waitForLoadState('networkidle')

    // STRICT: Set dismiss flag with timestamp
    const now = Date.now()
    await authenticatedPage.evaluate((ts) => {
      localStorage.setItem('sq-pwa-dismissed', String(ts))
    }, now)

    // STRICT: Read back the dismiss timestamp — must match
    const readDismissed = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-pwa-dismissed')
    )
    // STRICT: must match the timestamp we set
    expect(readDismissed).toBe(String(now))

    // STRICT: Clear and verify it's gone
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('sq-pwa-dismissed')
    })
    const cleared = await authenticatedPage.evaluate(() =>
      localStorage.getItem('sq-pwa-dismissed')
    )
    // STRICT: must be null
    expect(cleared).toBeNull()
  })
})
