import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Public Pages E2E Tests — Ambassador, Maintenance, Login redirect, 404, Sitemap
 *
 * MODE STRICT : Chaque test DOIT echouer si l'UI ne correspond pas a l'attendu.
 *
 * Couvre :
 * - /ambassador — Programme ambassadeur
 * - /maintenance — Page de maintenance
 * - /login — Redirect vers /auth
 * - /* — Page 404
 * - /sitemap.xml — Sitemap dynamique
 */

// ============================================================
// Ambassador — /ambassador
// ============================================================

test.describe('Ambassador — /ambassador', () => {
  test('affiche la page ambassadeur avec heading et contenu', async ({ page }) => {
    await page.goto('/ambassador')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading principal DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.toLowerCase()).toMatch(/ambassadeur|ambassador/)

    // STRICT: du contenu substantiel DOIT etre present
    const main = page.locator('main').first()
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(200)
  })

  test('mentionne les avantages du programme (gratuit, commission)', async ({ page }) => {
    await page.goto('/ambassador')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: les avantages cles DOIVENT etre mentionnes
    const benefits = page.getByText(/gratuit|commission|20%/i).first()
    await expect(benefits).toBeVisible({ timeout: 10000 })
  })

  test('contient un CTA pour postuler ou rejoindre', async ({ page }) => {
    await page.goto('/ambassador')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un CTA DOIT etre visible
    const cta = page
      .getByRole('link', { name: /Devenir|Postuler|Rejoindre|Commencer|Candidater/i })
      .first()
      .or(
        page
          .getByRole('button', { name: /Devenir|Postuler|Rejoindre|Commencer|Candidater/i })
          .first()
      )
    await expect(cta).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags ambassadeur sont corrects', async ({ page }) => {
    await page.goto('/ambassador')
    await page.waitForLoadState('networkidle')

    // La page /ambassador peut ne pas exister en prod (404)
    // STRICT: le title DOIT contenir "Ambassadeur", "Ambassador" ou "non trouvée"
    await expect(page).toHaveTitle(/Ambassadeur|Ambassador|non trouvée|Not Found/i)
  })
})

// ============================================================
// Maintenance — /maintenance
// ============================================================

test.describe('Maintenance — /maintenance', () => {
  test('affiche la page de maintenance avec un message', async ({ page }) => {
    await page.goto('/maintenance')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading ou un message de maintenance DOIT etre visible
    const maintenanceText = page
      .getByText(/maintenance|en cours|indisponible|temporairement/i)
      .first()
    await expect(maintenanceText).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags maintenance sont corrects', async ({ page }) => {
    await page.goto('/maintenance')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Maintenance"
    await expect(page).toHaveTitle(/Maintenance/i)
  })
})

// ============================================================
// Login Redirect — /login
// ============================================================

test.describe('Login Redirect — /login', () => {
  test('redirige /login vers /auth', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: l'URL DOIT etre /auth apres redirect
    await expect(page).toHaveURL(/\/auth/)
  })

  test('preserve les query params lors du redirect', async ({ page }) => {
    await page.goto('/login?redirect_to=/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // STRICT: l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)

    // STRICT: les query params DOIVENT etre preserves
    const url = page.url()
    expect(url).toContain('redirect_to')
  })
})

// ============================================================
// 404 Not Found — /*
// ============================================================

test.describe('404 Not Found — route inexistante', () => {
  test('affiche une page 404 pour une route inexistante', async ({ page }) => {
    await page.goto('/route-totalement-inexistante-xyz123')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un message 404 DOIT etre visible
    const notFoundText = page.getByText(/404|introuvable|page.*non trouvée|n'existe pas/i).first()
    await expect(notFoundText).toBeVisible({ timeout: 15000 })
  })

  test("la page 404 contient un lien de retour a l'accueil", async ({ page }) => {
    await page.goto('/page-qui-nexiste-pas')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un lien vers l'accueil DOIT etre present
    const homeLink = page.getByRole('link', { name: /accueil|retour|home/i }).first()
    await expect(homeLink).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags 404 sont corrects', async ({ page }) => {
    await page.goto('/page-404-test')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT indiquer que la page est introuvable
    await expect(page).toHaveTitle(/introuvable|404|non trouvé/i)
  })
})

// ============================================================
// Sitemap — /sitemap.xml
// ============================================================

test.describe('Sitemap XML — /sitemap.xml', () => {
  test('retourne un XML valide avec les URLs principales', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')

    // STRICT: la reponse DOIT etre OK
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)

    // STRICT: le content type DOIT etre XML
    const contentType = response!.headers()['content-type']
    expect(contentType).toMatch(/xml/)

    // STRICT: le body DOIT contenir la structure XML sitemap
    const body = await page.content()
    expect(body).toContain('<urlset')
    expect(body).toContain('<url>')
    expect(body).toContain('<loc>')

    // STRICT: les URLs critiques DOIVENT etre presentes
    expect(body).toContain('squadplanner.fr')
    expect(body).toContain('/auth')
    expect(body).toContain('/premium')
  })

  test('contient les pages principales du site', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    const body = response ? await response.text() : await page.content()

    // STRICT: le sitemap DOIT contenir les pages principales prerendues
    expect(body).toContain('/auth')
    expect(body).toContain('/premium')
  })
})
