import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Club Dashboard E2E Tests — /club
 *
 * La route /club peut ne pas exister en prod et rediriger vers /home.
 * Ces tests verifient le comportement reel de la route.
 */

/** Remove all overlays from the DOM via JavaScript */
async function removeOverlays(page: import('@playwright/test').Page) {
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookies-accepted', 'true')
    localStorage.setItem('sp-cookie-consent', 'all')
    localStorage.setItem('tour-completed', 'true')
    localStorage.setItem('onboarding-completed', 'true')
    localStorage.setItem('guided-tour-done', 'true')
    localStorage.setItem('sp-tour-completed', 'true')
    document
      .querySelectorAll('[class*="cookie"], [class*="Cookie"], [id*="cookie"], [id*="consent"]')
      .forEach((el) => el.remove())
    document
      .querySelectorAll('[class*="tour"], [class*="Tour"], [class*="onboarding"]')
      .forEach((el) => el.remove())
    document.querySelectorAll('div.fixed.inset-0').forEach((el) => {
      const z = getComputedStyle(el).zIndex
      if (Number(z) >= 50) el.remove()
    })
  })
  await page.waitForTimeout(500)
  await dismissCookieBanner(page)
}

test.describe('Club Dashboard — /club', () => {
  test('la page club charge ou redirige vers home', async ({ authenticatedPage: page }) => {
    await page.goto('/club')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await removeOverlays(page)

    // La route /club peut rediriger vers /home ou afficher un dashboard club
    const url = page.url()
    const isClub = url.includes('/club')
    const isHome = url.includes('/home')

    // STRICT: la page DOIT etre soit /club soit /home (pas /auth ni 404)
    expect(isClub || isHome).toBe(true)

    // STRICT: du contenu significatif DOIT etre present
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(50)
  })

  test('affiche les squads du user', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()

    await page.goto('/club')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await removeOverlays(page)
    await page.waitForTimeout(1000)

    if (squads.length > 0) {
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

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/club')
    await page.waitForTimeout(4000)

    await expect(page).toHaveURL(/\/auth/)
  })

  test('le title est defini', async ({ authenticatedPage: page }) => {
    await page.goto('/club')
    await page.waitForLoadState('networkidle')

    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(5)
  })
})
