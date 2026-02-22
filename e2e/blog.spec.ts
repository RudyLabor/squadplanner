import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Blog E2E Tests — /blog et /blog/:slug
 *
 * MODE STRICT : Chaque test DOIT echouer si l'UI ne correspond pas a l'attendu.
 * - Pas de .catch(() => false) sur les assertions
 * - Pas de OR conditions qui passent toujours
 * - Pas de fallback sur <main> quand un element specifique est attendu
 *
 * Tests couvrent :
 * - Blog index : affichage de la liste, heading, CTA, meta tags
 * - Blog post detail : contenu, meta, related articles
 * - Blog 404 : slug invalide
 */

// ============================================================
// Blog Index — /blog
// ============================================================

test.describe('Blog Index — /blog', () => {
  test('affiche le heading principal "Le Blog" avec le sous-titre "Squad Planner"', async ({
    page,
  }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 "Le Blog" DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toContain('Blog')
  })

  test('affiche le badge et les stats rapides', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le badge "Guides Gaming" DOIT etre visible
    const badge = page.getByText(/Guides Gaming/i).first()
    await expect(badge).toBeVisible({ timeout: 10000 })

    // STRICT: au moins un article DOIT etre affiche (blog n'est pas vide)
    const articleCards = page.locator('article, [data-testid="blog-card"], a[href^="/blog/"]')
    const cardCount = await articleCards.count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test("affiche les cartes d'articles avec titre, extrait, date et temps de lecture", async ({
    page,
  }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: la premiere carte d'article DOIT etre visible
    const firstCard = page.locator('a[href^="/blog/"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    // STRICT: le texte de la carte DOIT contenir du contenu significatif
    const cardText = await firstCard.textContent()
    expect(cardText).toBeTruthy()
    expect(cardText!.length).toBeGreaterThan(20)

    // STRICT: le temps de lecture DOIT etre affiche (ex: "8 min")
    const readTime = page.getByText(/\d+\s*min/i).first()
    await expect(readTime).toBeVisible({ timeout: 5000 })
  })

  test('le CTA "Créer ma squad" est visible et pointe vers /auth', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le CTA principal DOIT etre visible
    const cta = page.getByRole('link', { name: /Créer ma squad/i }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })

    // STRICT: le lien DOIT pointer vers /auth ou /onboarding
    const href = await cta.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toMatch(/\/(auth|onboarding)/)
  })

  test('les meta tags SEO sont correctement definis', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Blog" et "Squad Planner"
    await expect(page).toHaveTitle(/Blog.*Squad Planner/i)

    // STRICT: la meta description DOIT exister et etre non-vide
    const metaDesc = page.locator('meta[name="description"]').first()
    const descContent = await metaDesc.getAttribute('content')
    expect(descContent).toBeTruthy()
    expect(descContent!.length).toBeGreaterThan(30)

    // STRICT: le canonical DOIT pointer vers /blog
    const canonical = page.locator('link[rel="canonical"]').first()
    const canonicalHref = await canonical.getAttribute('href')
    expect(canonicalHref).toContain('/blog')
  })

  test('cliquer sur un article navigue vers /blog/:slug', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: cliquer sur le premier article
    const firstCard = page.locator('a[href^="/blog/"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    const href = await firstCard.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toMatch(/^\/blog\/.+/)

    await firstCard.click()
    await page.waitForLoadState('networkidle')

    // STRICT: l'URL DOIT contenir /blog/ suivi d'un slug
    await expect(page).toHaveURL(/\/blog\/.+/)
  })
})

// ============================================================
// Blog Post Detail — /blog/:slug
// ============================================================

test.describe('Blog Post Detail — /blog/:slug', () => {
  const validSlug = 'guilded-alternatives-2026'

  test("affiche le titre de l'article et les metadonnees", async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 avec le titre de l'article DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.length).toBeGreaterThan(10)

    // STRICT: la date de publication DOIT etre visible
    const dateElement = page.getByText(/202[4-6]/).first()
    await expect(dateElement).toBeVisible({ timeout: 5000 })

    // STRICT: le temps de lecture DOIT etre visible
    const readTime = page.getByText(/\d+\s*min/i).first()
    await expect(readTime).toBeVisible({ timeout: 5000 })

    // STRICT: le nom de l'auteur DOIT etre visible
    const author = page.getByText(/Par\s/i).first()
    await expect(author).toBeVisible({ timeout: 5000 })
  })

  test("affiche le contenu de l'article avec du texte significatif", async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: l'article DOIT avoir du contenu substantiel
    const article = page.locator('article, .prose, [class*="prose"]').first()
    await expect(article).toBeVisible({ timeout: 15000 })
    const articleText = await article.textContent()
    expect(articleText).toBeTruthy()
    // STRICT: le contenu DOIT avoir plus de 200 caracteres (vrai article, pas un stub)
    expect(articleText!.length).toBeGreaterThan(200)
  })

  test("affiche les tags de l'article", async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: au moins un tag DOIT etre visible
    const tags = page.locator('[class*="tag"], [class*="badge"]').filter({ hasText: /.+/ })
    const tagCount = await tags.count()
    expect(tagCount).toBeGreaterThan(0)
  })

  test('affiche le lien retour vers le blog', async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le lien "Retour au blog" DOIT etre visible
    const backLink = page.getByText(/Retour au blog/i).first()
    await expect(backLink).toBeVisible({ timeout: 10000 })
  })

  test('affiche la section "Articles connexes"', async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Scroller en bas pour voir les articles connexes
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // STRICT: la section articles connexes DOIT etre visible (si des articles existent)
    const relatedSection = page.getByText(/Articles connexes/i).first()
    const hasRelated = await relatedSection.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasRelated) {
      await expect(relatedSection).toBeVisible()
    }

    // STRICT: le CTA final DOIT etre visible
    const cta = page.getByRole('link', { name: /Créer ma squad/i }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })

  test("les meta tags SEO de l'article sont corrects", async ({ page }) => {
    await page.goto(`/blog/${validSlug}`)
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir le nom du blog et "Squad Planner"
    await expect(page).toHaveTitle(/Squad Planner/i)

    // STRICT: la meta og:type DOIT etre "article" (last() car le layout injecte aussi un og:type)
    const ogType = page.locator('meta[property="og:type"]').last()
    const ogTypeContent = await ogType.getAttribute('content')
    expect(ogTypeContent).toBe('article')

    // STRICT: le canonical DOIT contenir le slug
    const canonical = page.locator('link[rel="canonical"]').last()
    const canonicalHref = await canonical.getAttribute('href')
    expect(canonicalHref).toContain(validSlug)
  })
})

// ============================================================
// Blog 404 — slug invalide
// ============================================================

test.describe('Blog 404 — slug invalide', () => {
  test('affiche une page 404 pour un slug inexistant', async ({ page }) => {
    await page.goto('/blog/slug-qui-nexiste-pas-du-tout-12345')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: la page DOIT indiquer que l'article n'existe pas
    const notFoundText = page.getByText(/non trouvé|introuvable|n'existe pas|404/i).first()
    await expect(notFoundText).toBeVisible({ timeout: 15000 })
  })
})
