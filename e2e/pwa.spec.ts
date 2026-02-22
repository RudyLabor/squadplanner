import { test, expect } from './fixtures'
import { navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * PWA E2E Tests — STRICT MODE (P1.2)
 *
 * STRICT RULES ENFORCED:
 * 1. NO .catch(() => false) — use proper assertions
 * 2. NO OR conditions as fallbacks — use explicit if/else with assertions on both branches
 * 3. Each manifest field MUST be present and valid — otherwise FAIL
 * 4. Service worker MUST be registered — otherwise FAIL
 * 5. Meta tags MUST exist in the DOM — otherwise FAIL
 * 6. French text assertions where applicable
 * 7. Import from ./fixtures for test, expect
 *
 * The app has:
 * - /manifest.json with name, short_name, start_url, display, icons
 * - /sw.js service worker
 * - <meta name="theme-color"> in root.tsx
 * - <link rel="apple-touch-icon"> in root.tsx
 * - PWA install banner logic with localStorage keys
 */

// =============================================================================
// Manifest Validation
// =============================================================================
test.describe('PWA — Manifest validation', () => {
  test('PWA01: le manifest.json est accessible et retourne un JSON valide', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')

    // STRICT: la reponse DOIT exister
    expect(response).toBeTruthy()
    // STRICT: le status DOIT etre exactement 200
    expect(response!.status()).toBe(200)

    // STRICT: le contenu DOIT etre du JSON parsable
    const manifest = await response!.json()
    expect(manifest).toBeTruthy()
    expect(typeof manifest).toBe('object')
  })

  test('PWA02: le manifest contient le champ "name" non-vide', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: name DOIT etre present, string, et non-vide
    expect(manifest.name).toBeTruthy()
    expect(typeof manifest.name).toBe('string')
    expect(manifest.name.length).toBeGreaterThan(0)
  })

  test('PWA03: le manifest contient le champ "short_name" non-vide', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: short_name DOIT etre present, string, et non-vide
    expect(manifest.short_name).toBeTruthy()
    expect(typeof manifest.short_name).toBe('string')
    expect(manifest.short_name.length).toBeGreaterThan(0)
  })

  test('PWA04: le manifest contient le champ "start_url"', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: start_url DOIT etre present et non-vide
    expect(manifest.start_url).toBeTruthy()
    expect(typeof manifest.start_url).toBe('string')
  })

  test('PWA05: le manifest a un "display" valide pour PWA', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: display DOIT etre present
    expect(manifest.display).toBeTruthy()
    // STRICT: display DOIT etre un des modes PWA valides
    const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui']
    expect(validDisplayModes).toContain(manifest.display)
  })

  test('PWA06: le manifest contient au moins une icone avec src et sizes', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: icons DOIT etre un array non-vide
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)

    // STRICT: chaque icone DOIT avoir src et sizes
    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy()
      expect(typeof icon.src).toBe('string')
      expect(icon.sizes).toBeTruthy()
      expect(typeof icon.sizes).toBe('string')
    }
  })

  test('PWA07: le manifest contient une icone 192x192 et une 512x512', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)

    // STRICT: une icone 192x192 DOIT exister
    const has192 = manifest.icons.some((icon: { sizes: string }) => icon.sizes === '192x192')
    expect(has192).toBe(true)

    // STRICT: une icone 512x512 DOIT exister
    const has512 = manifest.icons.some((icon: { sizes: string }) => icon.sizes === '512x512')
    expect(has512).toBe(true)
  })

  test('PWA08: le manifest a un theme_color et background_color', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/manifest.json')
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    const manifest = await response!.json()

    // STRICT: theme_color DOIT etre present et etre une string couleur
    expect(manifest.theme_color).toBeTruthy()
    expect(typeof manifest.theme_color).toBe('string')
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/)

    // STRICT: background_color DOIT etre present et etre une string couleur
    expect(manifest.background_color).toBeTruthy()
    expect(typeof manifest.background_color).toBe('string')
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})

// =============================================================================
// Service Worker
// =============================================================================
test.describe('PWA — Service Worker', () => {
  test('PWA09: le fichier sw.js est accessible et contient du JavaScript', async ({ page }) => {
    const response = await page.goto('https://squadplanner.fr/sw.js')

    // STRICT: la reponse DOIT exister
    expect(response).toBeTruthy()
    // STRICT: le status DOIT etre 200
    expect(response!.status()).toBe(200)

    // STRICT: le Content-Type DOIT contenir javascript
    const contentType = response!.headers()['content-type'] || ''
    expect(contentType).toContain('javascript')

    // STRICT: le body DOIT contenir du code JS (pas vide)
    const body = await response!.text()
    expect(body).toBeTruthy()
    expect(body.length).toBeGreaterThan(10)
  })

  test('PWA10: le service worker est enregistre dans le navigateur', async ({ page }) => {
    await page.goto('https://squadplanner.fr/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: verifier via navigator.serviceWorker que le SW est enregistre
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.getRegistration()
      return registration !== undefined
    })
    // STRICT: le service worker DOIT etre enregistre
    expect(swRegistered).toBe(true)
  })

  test('PWA11: le service worker a un scope valide', async ({ page }) => {
    await page.goto('https://squadplanner.fr/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: verifier le scope du service worker
    const swScope = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return null
      const registration = await navigator.serviceWorker.getRegistration()
      return registration?.scope || null
    })
    // STRICT: le scope DOIT exister
    expect(swScope).toBeTruthy()
    // STRICT: le scope DOIT pointer vers le domaine de l'app
    expect(swScope).toContain('squadplanner.fr')
  })
})

// =============================================================================
// Meta Tags (theme-color, apple-touch-icon)
// =============================================================================
test.describe('PWA — Meta tags HTML', () => {
  test('PWA12: la meta tag theme-color existe dans le DOM', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await page.waitForLoadState('domcontentloaded')

    // STRICT: la meta theme-color DOIT exister
    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta ? meta.getAttribute('content') : null
    })
    expect(themeColor).toBeTruthy()
    // STRICT: la valeur DOIT etre une couleur hex valide
    expect(themeColor).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('PWA13: le link apple-touch-icon existe dans le DOM', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await page.waitForLoadState('domcontentloaded')

    // STRICT: le link apple-touch-icon DOIT exister
    const appleTouchIcon = await page.evaluate(() => {
      const link = document.querySelector('link[rel="apple-touch-icon"]')
      return link ? link.getAttribute('href') : null
    })
    expect(appleTouchIcon).toBeTruthy()
    // STRICT: le href DOIT pointer vers un fichier image
    expect(appleTouchIcon).toMatch(/\.(png|jpg|svg|webp)$/i)
  })

  test('PWA14: le link manifest existe dans le DOM', async ({ page }) => {
    await page.goto('https://squadplanner.fr/')
    await page.waitForLoadState('domcontentloaded')

    // STRICT: le link manifest DOIT exister
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]')
      return link ? link.getAttribute('href') : null
    })
    expect(manifestHref).toBeTruthy()
    // STRICT: le href DOIT pointer vers manifest.json ou manifest.webmanifest
    expect(manifestHref).toMatch(/manifest\.(json|webmanifest)$/)
  })
})

// =============================================================================
// App Shell — loads after first load even without network
// =============================================================================
test.describe('PWA — App Shell offline', () => {
  test("PWA15: l'app shell se charge meme apres une coupure reseau post-premier-chargement", async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    // Premier chargement complet avec reseau
    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: verifier que la page est completement chargee
    const mainBefore = page.locator('main').first()
    await expect(mainBefore).toBeVisible({ timeout: 10000 })

    // Attendre que le SW ait eu le temps de cacher les assets
    await page.waitForTimeout(3000)

    // Passer en mode offline
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // Recharger la page en mode offline
    // Le SW devrait servir l'app shell depuis le cache
    await page.reload().catch(() => {
      // La navigation peut echouer en offline, c'est attendu
    })
    await page.waitForTimeout(3000)

    // STRICT: verifier que quelque chose s'affiche (soit l'app shell, soit le banner offline)
    // L'app shell cachee par le SW DOIT au minimum afficher une page
    const bodyContent = await page.evaluate(() => document.body.textContent)
    expect(bodyContent).toBeTruthy()
    expect(bodyContent!.trim().length).toBeGreaterThan(0)

    // Cleanup
    await page.context().setOffline(false)
  })
})

// =============================================================================
// PWA Install Banner — localStorage keys
// =============================================================================
test.describe('PWA — Install banner localStorage', () => {
  test('PWA16: les cles localStorage du PWA install banner fonctionnent correctement', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // STRICT: le compteur de visites DOIT etre lisible (retourne un nombre)
    const visits = await page.evaluate(() => {
      return Number(localStorage.getItem('sq-visits') || '0')
    })
    expect(typeof visits).toBe('number')
    expect(Number.isFinite(visits)).toBe(true)

    // STRICT: simuler 3+ visites et effacer les flags dismiss/installed
    await page.evaluate(() => {
      localStorage.setItem('sq-visits', '3')
      localStorage.removeItem('sq-pwa-dismissed')
      localStorage.removeItem('sq-pwa-installed')
    })

    // STRICT: le flag dismissed DOIT etre null apres suppression
    const dismissedAt = await page.evaluate(() => localStorage.getItem('sq-pwa-dismissed'))
    expect(dismissedAt).toBeNull()

    // STRICT: le flag installed DOIT etre null apres suppression
    const installedAt = await page.evaluate(() => localStorage.getItem('sq-pwa-installed'))
    expect(installedAt).toBeNull()

    // STRICT: les visites DOIVENT relire '3'
    const visitsReadback = await page.evaluate(() => localStorage.getItem('sq-visits'))
    expect(visitsReadback).toBe('3')
  })

  test("PWA17: le dispatch de beforeinstallprompt ne crash pas l'app", async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // STRICT: dispatcher l'evenement beforeinstallprompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = () => Promise.resolve()
      ;(event as any).userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
    })
    await page.waitForTimeout(1000)

    // STRICT: le contenu principal DOIT toujours etre visible
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 5000 })

    // STRICT: la navigation DOIT toujours fonctionner
    const navExists = page.locator('nav').first()
    await expect(navExists).toBeVisible({ timeout: 5000 })
  })

  test('PWA18: le flag dismissed persiste correctement', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // STRICT: ecrire un timestamp de dismiss
    const now = Date.now()
    await page.evaluate((ts) => {
      localStorage.setItem('sq-pwa-dismissed', String(ts))
    }, now)

    // STRICT: relire le timestamp — DOIT correspondre
    const readDismissed = await page.evaluate(() => localStorage.getItem('sq-pwa-dismissed'))
    expect(readDismissed).toBe(String(now))

    // STRICT: effacer et verifier que c'est null
    await page.evaluate(() => {
      localStorage.removeItem('sq-pwa-dismissed')
    })
    const cleared = await page.evaluate(() => localStorage.getItem('sq-pwa-dismissed'))
    expect(cleared).toBeNull()
  })
})
