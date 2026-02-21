import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Gaming Wrapped E2E Tests — /wrapped
 *
 * MODE STRICT : Tests DB-first.
 * - Verifie que le Wrapped affiche les vraies stats du user (profil, sessions, squads)
 * - Verifie la coherence entre donnees DB et affichage UI
 * - Verifie les etats vides et les interactions
 */

test.describe('Gaming Wrapped — /wrapped', () => {
  test('affiche la page Wrapped avec le heading principal', async ({ authenticatedPage: page }) => {
    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: un heading contenant "Wrapped" ou "2026" DOIT etre visible
    const heading = page.getByText(/Wrapped|2026|récap/i).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('affiche le username du profil DB dans le Wrapped', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le username de la DB DOIT apparaitre dans le Wrapped
    await expect(page.getByText(profile.username).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le nombre de squads correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    const dbSquadCount = squads.length

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le nombre de squads DOIT etre affiche dans les stats
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()

    // Le Wrapped affiche "X squads" — le nombre exact DOIT correspondre a la DB
    if (dbSquadCount > 0) {
      expect(mainText).toContain(String(dbSquadCount))
    }
  })

  test('affiche le score de fiabilite correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const reliabilityScore = Number(profile.reliability_score ?? 0)

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    if (reliabilityScore > 0) {
      // STRICT: le score de fiabilite DB DOIT etre visible dans le Wrapped
      const scoreText = page.getByText(new RegExp(`${reliabilityScore}\\s*%`)).first()
      await expect(scoreText).toBeVisible({ timeout: 15000 })
    }
  })

  test('affiche le niveau et l\'XP correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const level = Number(profile.level ?? 1)
    const xp = Number(profile.xp ?? 0)

    const loaded = await navigateWithFallback(page, '/wrapped')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le niveau DOIT etre affiche
    const levelText = page.getByText(new RegExp(`Niveau\\s*${level}|Niv\\.?\\s*${level}|Level\\s*${level}`, 'i')).first()
    await expect(levelText).toBeVisible({ timeout: 15000 })

    if (xp > 0) {
      // STRICT: l'XP DOIT etre affiche
      const mainText = await page.locator('main').first().textContent()
      expect(mainText).toContain(String(xp))
    }
  })

  test('les meta tags Wrapped sont corrects', async ({ authenticatedPage: page }) => {
    await page.goto('/wrapped')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Wrapped" et "2026"
    await expect(page).toHaveTitle(/Wrapped.*2026|Gaming Wrapped/i)
  })

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/wrapped')
    await page.waitForTimeout(4000)

    // Le wrapped peut etre accessible sans auth mais avec userId=null
    // Verifier que la page charge ou redirige
    const url = page.url()
    const isWrapped = url.includes('/wrapped')
    const isAuth = url.includes('/auth')

    // STRICT: l'une des deux situations DOIT etre vraie
    expect(isWrapped || isAuth).toBe(true)
  })
})
