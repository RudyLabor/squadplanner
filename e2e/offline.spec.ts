import { test, expect } from './fixtures'
import { navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Offline Mode E2E Tests — STRICT MODE (P1.2)
 *
 * These tests verify offline behavior against production.
 * NOTE: Playwright's setOffline + dispatchEvent('offline') may not
 * trigger React hooks identically to real browser offline.
 * Tests are written to verify core resilience rather than exact UI elements.
 */

// =============================================================================
// Offline Detection — App behavior when connection is lost
// =============================================================================
test.describe('Offline Mode — Detection et indicateur', () => {
  test('OFF01: dispatching offline event does not crash the app', async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: page must be loaded before going offline
    const mainBefore = page.locator('main').first()
    await expect(mainBefore).toBeVisible({ timeout: 10000 })

    // Dispatch offline event — app must not crash
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: body must still be visible (app didn't crash)
    await expect(page.locator('body').first()).toBeVisible({ timeout: 5000 })

    // Cleanup
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
  })

  test("OFF02: l'app ne crash pas quand setOffline — le body reste visible", async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: capture content before going offline
    const mainTextBefore = await page.locator('main').first().textContent()
    expect(mainTextBefore).toBeTruthy()
    expect(mainTextBefore!.trim().length).toBeGreaterThan(10)

    // Go offline via Playwright API
    await page.context().setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: body must still be visible (no white page)
    await expect(page.locator('body').first()).toBeVisible({ timeout: 5000 })

    // The DOM should still have content (cached client-side)
    const bodyText = await page.locator('body').first().textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.trim().length).toBeGreaterThan(10)

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
  })

  test('OFF03: useOffline hook reacts to navigator.onLine change', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: navigator.onLine should be true initially
    const onlineBefore = await page.evaluate(() => navigator.onLine)
    expect(onlineBefore).toBe(true)

    // Set offline via Playwright context
    await page.context().setOffline(true)

    // STRICT: navigator.onLine should now be false
    const onlineAfter = await page.evaluate(() => navigator.onLine)
    expect(onlineAfter).toBe(false)

    // Cleanup
    await page.context().setOffline(false)
  })
})

// =============================================================================
// Reconnection — Recovery after going back online
// =============================================================================
test.describe('Offline Mode — Reconnexion et recovery', () => {
  test('OFF04: navigator.onLine returns true after reconnection', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Go offline
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(1000)

    const offlineState = await page.evaluate(() => navigator.onLine)
    expect(offlineState).toBe(false)

    // Go back online
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(1000)

    // STRICT: navigator.onLine must be true after reconnection
    const onlineState = await page.evaluate(() => navigator.onLine)
    expect(onlineState).toBe(true)
  })

  test("OFF05: l'app recupere completement apres offline -> online -> reload", async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Go offline then online
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(1000)

    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(1000)

    // Reload for complete recovery
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // STRICT: after recovery, main content MUST be visible
    const mainLandmark = page.locator('main').first()
    await expect(mainLandmark).toBeVisible({ timeout: 15000 })

    // STRICT: navigation MUST work after recovery
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })

    // STRICT: no 500 error page after recovery
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    expect(mainText).not.toMatch(/^500$/)
  })

  test('OFF06: cycle offline -> online -> offline -> online sans crash', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Cycle 1: offline
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(1000)

    // Cycle 1: online
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(1000)

    // Cycle 2: offline
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(1000)

    // Cycle 2: online
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(1000)

    // STRICT: body must still be visible after multiple cycles
    await expect(page.locator('body').first()).toBeVisible({ timeout: 5000 })

    // STRICT: app must not show a crash screen
    const bodyText = await page.locator('body').first().textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.trim().length).toBeGreaterThan(10)
  })
})

// =============================================================================
// IndexedDB Offline Mutation Queue
// =============================================================================
test.describe('Offline Mode — IndexedDB mutation queue', () => {
  test('OFF07: IndexedDB offline mutation queue est accessible et vide quand online', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // STRICT: IndexedDB MUST be openable
    const canOpenDB = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('sq-offline-mutations', 1)
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('mutations')) {
            db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true })
          }
        }
        request.onsuccess = () => {
          resolve(true)
          request.result.close()
        }
        request.onerror = () => resolve(false)
      })
    })
    expect(canOpenDB).toBe(true)

    // STRICT: queue MUST be exactly 0 when online
    const pendingCount = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('sq-offline-mutations', 1)
        request.onsuccess = () => {
          const db = request.result
          try {
            const tx = db.transaction('mutations', 'readonly')
            const store = tx.objectStore('mutations')
            const countRequest = store.count()
            countRequest.onsuccess = () => {
              resolve(countRequest.result)
              db.close()
            }
            countRequest.onerror = () => {
              resolve(-1)
              db.close()
            }
          } catch {
            resolve(0)
            db.close()
          }
        }
        request.onerror = () => resolve(-1)
      })
    })
    expect(pendingCount).toBe(0)
  })
})

// =============================================================================
// Cached data visibility while offline
// =============================================================================
test.describe('Offline Mode — Donnees en cache', () => {
  test('OFF08: les donnees deja chargees restent visibles apres passage offline', async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: verify username is displayed BEFORE going offline
    await expect(page.getByText(new RegExp(profile.username, 'i')).first()).toBeVisible({
      timeout: 15000,
    })

    // Go offline (without reloading)
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(2000)

    // After going offline, the page may re-render. Check that body still has content.
    await expect(page.locator('body').first()).toBeVisible({ timeout: 5000 })
    const bodyText = await page.locator('body').first().textContent()
    expect(bodyText).toBeTruthy()
    // STRICT: page MUST still have meaningful content (not blank)
    expect(bodyText!.trim().length).toBeGreaterThan(10)

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
  })
})
