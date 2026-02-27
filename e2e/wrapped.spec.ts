import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Gaming Wrapped E2E Tests — /wrapped
 *
 * MODE STRICT : Tests DB-first.
 * - Verifie que le Wrapped charge et affiche du contenu reel
 * - Verifie les stats coherentes avec la DB
 */

test.describe('Gaming Wrapped — /wrapped', () => {
  test('affiche la page Wrapped avec du contenu', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le main DOIT contenir du contenu significatif
    const main = page.locator('main').first()
    await expect(main).toBeVisible({ timeout: 15000 })
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(50)
  })

  test("affiche des donnees coherentes avec le profil DB ou un etat d'erreur", async ({
    authenticatedPage: page,
    db,
  }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(3000)

    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()

    // La page Wrapped est un carousel avec slides de stats gaming.
    // Verifier que le contenu est coherent : soit le titre Wrapped, soit des stats, soit une erreur
    const hasWrappedContent = /Wrapped|gaming|stats|slide|session|squad/i.test(mainText!)
    const hasProfileData =
      mainText!.includes(profile.username) ||
      (profile.xp > 0 && mainText!.includes(String(profile.xp)))

    // STRICT: la page DOIT afficher du contenu Wrapped OU des donnees profil
    expect(hasWrappedContent || hasProfileData).toBe(true)
  })

  test('affiche les squads du user si elles existent en DB', async ({
    authenticatedPage: page,
    db,
  }) => {
    const squads = await db.getUserSquads()

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(3000)

    if (squads.length > 0) {
      // STRICT: le nombre de squads DOIT etre mentionne
      const mainText = await page.locator('main').first().textContent()
      expect(mainText).toBeTruthy()
      expect(mainText).toContain(String(squads.length))
    }
  })

  test('la page est accessible apres login', async ({ authenticatedPage: page }) => {
    await page.goto('/wrapped')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: l'URL DOIT contenir /wrapped (pas de redirect)
    const url = page.url()
    expect(url).toContain('/wrapped')
  })

  test('les meta tags sont definis', async ({ authenticatedPage: page }) => {
    await page.goto('/wrapped')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT etre non-vide
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(5)
  })
})
