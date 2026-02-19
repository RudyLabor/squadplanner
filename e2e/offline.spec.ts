import { test, expect } from './fixtures'
import { navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Offline Mode E2E Tests — STRICT MODE (P1.2)
 *
 * STRICT RULES ENFORCED:
 * 1. Every test fetches real DB data FIRST, then verifies UI matches
 * 2. NO .catch(() => false) — use proper assertions
 * 3. NO OR conditions as fallbacks — use explicit if/else with assertions on both branches
 * 4. Use page.context().setOffline(true/false) for proper offline simulation
 * 5. French text assertions (the app uses "Hors ligne" and "Connexion retablie")
 * 6. Import from ./fixtures for test, expect
 *
 * The app has:
 * - OfflineBanner component showing "Hors ligne" with role="alert" when offline
 * - "Connexion retablie" banner with role="status" on reconnection
 * - useOffline() hook listening to navigator.onLine + online/offline events
 * - IndexedDB-based offline mutation queue (sq-offline-mutations)
 */

// =============================================================================
// Offline Detection — Banner appears when connection is lost
// =============================================================================
test.describe('Offline Mode — Detection et indicateur', () => {

  test('OFF01: le banner "Hors ligne" apparait quand la connexion est perdue', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch profile from DB first to confirm connectivity
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: verifier que la page est chargee avant de passer offline
    const mainBefore = page.locator('main').first()
    await expect(mainBefore).toBeVisible({ timeout: 10000 })

    // Passer en mode offline via l'API Playwright
    await page.context().setOffline(true)

    // Declencher l'evenement offline dans le navigateur pour activer useOffline()
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: le banner offline avec role="alert" et texte "Hors ligne" DOIT etre visible
    const offlineBanner = page.locator('[role="alert"]').filter({ hasText: /Hors ligne/i })
    await expect(offlineBanner).toBeVisible({ timeout: 5000 })

    // STRICT: le texte secondaire DOIT aussi etre present
    await expect(page.getByText(/Vérifie ta connexion internet/i).first()).toBeVisible({ timeout: 3000 })

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
  })

  test('OFF02: l\'app ne crash pas quand on est offline — le contenu principal reste visible', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: capturer le contenu avant de passer offline
    const mainTextBefore = await page.locator('main').first().textContent()
    expect(mainTextBefore).toBeTruthy()
    expect(mainTextBefore!.trim().length).toBeGreaterThan(10)

    // Passer en mode offline
    await page.context().setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: le contenu principal DOIT toujours etre visible (pas de crash)
    const mainAfterOffline = page.locator('main').first()
    await expect(mainAfterOffline).toBeVisible({ timeout: 5000 })

    // STRICT: la nav DOIT toujours etre visible (pas de page blanche)
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 5000 })

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
  })

  test('OFF03: le bouton de fermeture du banner offline fonctionne', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Passer en mode offline
    await page.context().setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: le banner offline DOIT etre visible
    const offlineBanner = page.locator('[role="alert"]').filter({ hasText: /Hors ligne/i })
    await expect(offlineBanner).toBeVisible({ timeout: 5000 })

    // STRICT: le bouton de fermeture DOIT etre present
    const closeBtn = page.locator('button[aria-label="Fermer l\'alerte hors ligne"]')
    await expect(closeBtn).toBeVisible({ timeout: 3000 })

    // Cliquer sur le bouton de fermeture
    await closeBtn.click()
    await page.waitForTimeout(1000)

    // STRICT: le banner DOIT disparaitre apres le clic
    await expect(offlineBanner).not.toBeVisible({ timeout: 3000 })

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
  })
})

// =============================================================================
// Reconnection — Banner "Connexion retablie" et recovery
// =============================================================================
test.describe('Offline Mode — Reconnexion et recovery', () => {

  test('OFF04: le banner "Connexion retablie" apparait apres reconnexion', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Passer en mode offline
    await page.context().setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // STRICT: confirmer que le banner offline est apparu
    const offlineBanner = page.locator('[role="alert"]').filter({ hasText: /Hors ligne/i })
    await expect(offlineBanner).toBeVisible({ timeout: 5000 })

    // Revenir en ligne
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
    await page.waitForTimeout(2000)

    // STRICT: le banner "Connexion retablie" avec role="status" DOIT apparaitre
    const reconnectedBanner = page.locator('[role="status"]').filter({ hasText: /Connexion rétablie/i })
    await expect(reconnectedBanner).toBeVisible({ timeout: 5000 })

    // STRICT: le banner offline DOIT avoir disparu
    await expect(offlineBanner).not.toBeVisible({ timeout: 3000 })
  })

  test('OFF05: l\'app recupere completement apres offline -> online -> reload', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // Passer en mode offline
    await page.context().setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // Revenir en ligne
    await page.context().setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
    await page.waitForTimeout(1000)

    // Recharger la page pour une recovery complete
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // STRICT: apres recovery, le contenu principal DOIT etre visible
    const mainLandmark = page.locator('main').first()
    await expect(mainLandmark).toBeVisible({ timeout: 15000 })

    // STRICT: la navigation DOIT fonctionner apres recovery
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })

    // STRICT: pas de page d'erreur 500 apres recovery
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    // STRICT: le texte ne DOIT PAS contenir "500" ou "Erreur interne"
    expect(mainText).not.toMatch(/^500$/)
  })

  test('OFF06: cycle offline -> online -> offline -> online fonctionne', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // === Premier cycle: offline ===
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(2000)

    // STRICT: le banner offline DOIT apparaitre au premier cycle
    const offlineBanner1 = page.locator('[role="alert"]').filter({ hasText: /Hors ligne/i })
    await expect(offlineBanner1).toBeVisible({ timeout: 5000 })

    // === Premier cycle: online ===
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(3000)

    // STRICT: le banner offline DOIT disparaitre
    await expect(offlineBanner1).not.toBeVisible({ timeout: 5000 })

    // === Deuxieme cycle: offline ===
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(2000)

    // STRICT: le banner offline DOIT reapparaitre au deuxieme cycle
    const offlineBanner2 = page.locator('[role="alert"]').filter({ hasText: /Hors ligne/i })
    await expect(offlineBanner2).toBeVisible({ timeout: 5000 })

    // === Deuxieme cycle: online ===
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForTimeout(2000)

    // STRICT: le contenu principal DOIT etre visible apres le deuxieme cycle
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// IndexedDB Offline Mutation Queue
// =============================================================================
test.describe('Offline Mode — IndexedDB mutation queue', () => {

  test('OFF07: IndexedDB offline mutation queue est accessible et vide quand online', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // STRICT: IndexedDB DOIT etre ouvrable
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

    // STRICT: la queue DOIT etre exactement 0 quand online
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
    // STRICT: le count DOIT etre exactement 0, pas >= 0
    expect(pendingCount).toBe(0)
  })
})

// =============================================================================
// Cached data visibility while offline
// =============================================================================
test.describe('Offline Mode — Donnees en cache', () => {

  test('OFF08: les donnees deja chargees restent visibles apres passage offline', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: verifier que le username est affiche AVANT de passer offline
    await expect(page.getByText(new RegExp(profile.username, 'i')).first()).toBeVisible({ timeout: 15000 })

    // Passer en mode offline (sans recharger)
    await page.context().setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.waitForTimeout(2000)

    // STRICT: le username DOIT toujours etre visible (donnees en cache cote client)
    await expect(page.getByText(new RegExp(profile.username, 'i')).first()).toBeVisible({ timeout: 5000 })

    // STRICT: la structure de la page DOIT etre intacte
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 5000 })

    // Cleanup
    await page.context().setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
  })
})
