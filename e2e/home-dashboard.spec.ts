import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Home Dashboard E2E Tests — /home
 *
 * MODE STRICT : Tests DB-first.
 * Verifie les widgets du dashboard (greeting, squads, sessions).
 * Utilise page.evaluate pour supprimer les overlays (tour, cookies) du DOM.
 */

/** Remove all overlays from the DOM via JavaScript */
async function removeOverlays(page: import('@playwright/test').Page) {
  await page.waitForTimeout(1500)

  // Supprimer les overlays par JavaScript — plus fiable que les clicks
  await page.evaluate(() => {
    // Accepter les cookies via localStorage
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookies-accepted', 'true')
    localStorage.setItem('sp-cookie-consent', 'all')

    // Marquer le tour comme termine
    localStorage.setItem('tour-completed', 'true')
    localStorage.setItem('onboarding-completed', 'true')
    localStorage.setItem('guided-tour-done', 'true')
    localStorage.setItem('sp-tour-completed', 'true')

    // Supprimer les overlays du DOM
    document.querySelectorAll('[class*="cookie"], [class*="Cookie"], [id*="cookie"], [id*="consent"]').forEach(el => el.remove())
    document.querySelectorAll('[class*="tour"], [class*="Tour"], [class*="onboarding"]').forEach(el => el.remove())
    // Supprimer les overlays fixed en z-index eleve
    document.querySelectorAll('div.fixed.inset-0').forEach(el => {
      const z = getComputedStyle(el).zIndex
      if (Number(z) >= 50) el.remove()
    })
  })

  await page.waitForTimeout(500)

  // Si le cookie banner est toujours la, cliquer "Tout accepter"
  await dismissCookieBanner(page)
}

// ============================================================
// Dashboard — Affichage complet
// ============================================================

test.describe('Home Dashboard — Affichage complet', () => {
  test('affiche le greeting avec le username DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await removeOverlays(page)

    // STRICT: le username DOIT apparaitre quelque part dans la page
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!).toContain(profile.username)
  })

  test('affiche du contenu significatif dans le main', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await removeOverlays(page)

    // STRICT: le main DOIT contenir du contenu
    const main = page.locator('main').first()
    await expect(main).toBeVisible({ timeout: 15000 })
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(50)
  })

  test('affiche les sections du dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await removeOverlays(page)
    await page.waitForTimeout(2000)

    // STRICT: au moins une section de stats DOIT etre visible
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    // Le dashboard contient des mots-cles specifiques
    expect(mainText!).toMatch(/session|squad|classement|fiabilité|semaine/i)
  })

  test('affiche les squads du user', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()

    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await removeOverlays(page)
    await page.waitForTimeout(2000)

    if (squads.length > 0) {
      // STRICT: au moins un nom de squad DB DOIT etre visible
      const mainText = await page.locator('main').first().textContent()
      let foundSquad = false
      for (const membership of squads.slice(0, 3)) {
        if (mainText!.includes(membership.squads.name)) {
          foundSquad = true
          break
        }
      }
      expect(foundSquad).toBe(true)
    }
  })
})

// ============================================================
// Dashboard — Protection
// ============================================================

test.describe('Home Dashboard — Protection', () => {
  test('redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/home')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })

  test('le title est defini', async ({ authenticatedPage: page }) => {
    await page.goto('/home')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT etre non-vide
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(5)
  })
})
