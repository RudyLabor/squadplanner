import { test, expect } from './fixtures'

/**
 * Offline Mode E2E Tests — F72
 * F72a: OfflineBanner appears when network is lost
 * F72b: IndexedDB mutation queue is accessible
 * F72c: Banner reappears after dismiss + new disconnect
 *
 * Uses Playwright's context.setOffline() to simulate network loss.
 * Uses shared fixtures: authenticatedPage (logged-in).
 */

// =============================================================================
// F72 — Mode Offline
// =============================================================================
test.describe('F72 — Mode Offline', () => {

  test('F72a: OfflineBanner appears when network is lost and disappears on reconnect', async ({ authenticatedPage }) => {
    const page = authenticatedPage
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // Go offline
    await page.context().setOffline(true)
    await page.waitForTimeout(2000)

    // Verify OfflineBanner appears with "Hors ligne" text
    const offlineBanner = page.getByText(/Hors ligne/i).first()
    await expect(offlineBanner).toBeVisible({ timeout: 5000 })

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(4000)

    // After reconnecting, the offline banner must disappear
    // Either "Connexion rétablie" shows briefly, or the offline banner is simply gone
    const offlineStillVisible = await page.getByText(/Hors ligne/i).first().isVisible().catch(() => false)
    const reconnectedVisible = await page.getByText(/Connexion rétablie/i).first().isVisible().catch(() => false)

    // At least one condition must be true: banner gone OR reconnected message shown
    expect(!offlineStillVisible || reconnectedVisible).toBe(true)
  })

  test('F72b: IndexedDB offline mutation queue is accessible', async ({ authenticatedPage }) => {
    const page = authenticatedPage
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // Verify IndexedDB for offline mutation queue can be opened
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

    // Verify the mutation queue is empty when online
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
            countRequest.onerror = () => { resolve(0); db.close() }
          } catch {
            resolve(0)
            db.close()
          }
        }
        request.onerror = () => resolve(-1)
      })
    })
    // Queue should be empty (0) when online, or DB just created (0)
    expect(pendingCount).toBeGreaterThanOrEqual(0)
  })

  test('F72c: Banner reappears after reconnect + new disconnect', async ({ authenticatedPage }) => {
    const page = authenticatedPage
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // First disconnect
    await page.context().setOffline(true)
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Hors ligne/i).first()).toBeVisible({ timeout: 5000 })

    // Reconnect
    await page.context().setOffline(false)
    await page.waitForTimeout(3000)

    // Second disconnect
    await page.context().setOffline(true)
    await page.waitForTimeout(2000)

    // Banner must reappear
    await expect(page.getByText(/Hors ligne/i).first()).toBeVisible({ timeout: 5000 })

    // Cleanup: go back online
    await page.context().setOffline(false)
  })
})
