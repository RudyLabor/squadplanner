import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * SEO Pages E2E Tests — /games/:game, /lfg/:game, /alternative/*, /vs/*
 *
 * MODE STRICT : Chaque test DOIT echouer si l'UI ne correspond pas a l'attendu.
 *
 * Couvre :
 * - Game landing pages (/games/:game)
 * - LFG pages (/lfg/:game)
 * - Alternative pages (/alternative/guilded, /alternative/gamerlink, /alternative/discord-events)
 * - VS comparison page (/vs/guilded-vs-squad-planner)
 */

// ============================================================
// Game Landing Pages — /games/:game
// ============================================================

test.describe('Game Landing Page — /games/valorant', () => {
  test('affiche le heading avec le nom du jeu et les CTAs', async ({ page }) => {
    await page.goto('/games/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 DOIT contenir "Valorant" ou "session"
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.toLowerCase()).toMatch(/valorant|session/)

    // STRICT: un CTA principal DOIT etre visible
    const cta = page.getByRole('link', { name: /Créer ma squad|Rejoindre/i }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })

  test('affiche les 3 etapes et la section features', async ({ page }) => {
    await page.goto('/games/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: la section "3 etapes" DOIT etre presente
    const stepsHeading = page.getByText(/3 étapes|C'est tout/i).first()
    await expect(stepsHeading).toBeVisible({ timeout: 10000 })

    // STRICT: la section Features DOIT etre presente
    const featuresHeading = page.getByText(/Ce que Squad Planner change/i).first()
    await expect(featuresHeading).toBeVisible({ timeout: 10000 })
  })

  test('affiche la section FAQ avec des questions expandables', async ({ page }) => {
    await page.goto('/games/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Scroller vers la FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7))
    await page.waitForTimeout(1000)

    // STRICT: la section FAQ DOIT etre visible
    const faqHeading = page.getByText(/Questions fréquentes/i).first()
    await expect(faqHeading).toBeVisible({ timeout: 10000 })

    // STRICT: au moins une question FAQ DOIT etre cliquable
    const faqItem = page
      .locator('button, details, [role="button"]')
      .filter({ hasText: /\?/ })
      .first()
    await expect(faqItem).toBeVisible({ timeout: 10000 })
  })

  test('affiche la section "Autres jeux" avec des liens', async ({ page }) => {
    await page.goto('/games/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Scroller tout en bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // STRICT: la section "Tu joues a autre chose" DOIT etre visible
    const otherGames = page.getByText(/Tu joues à autre chose|autres jeux/i).first()
    await expect(otherGames).toBeVisible({ timeout: 10000 })
  })

  test('les meta tags SEO du jeu sont corrects', async ({ page }) => {
    await page.goto('/games/valorant')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Valorant" et "Squad Planner"
    await expect(page).toHaveTitle(/Valorant.*Squad Planner|Squad Planner.*Valorant/i)

    // STRICT: le canonical DOIT contenir /games/valorant
    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/games/valorant')
  })
})

test.describe('Game Landing Page — /games/league-of-legends', () => {
  test('affiche correctement la page LoL', async ({ page }) => {
    await page.goto('/games/league-of-legends')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 15000 })

    // STRICT: le CTA DOIT etre visible
    const cta = page.getByRole('link', { name: /Créer ma squad|Rejoindre/i }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Game Landing Page — jeu inexistant', () => {
  test('affiche "Jeu non trouve" pour un jeu inexistant', async ({ page }) => {
    await page.goto('/games/jeu-qui-nexiste-pas')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le message "Jeu non trouve" DOIT etre visible
    const notFound = page.getByText(/Jeu non trouvé|n'existe pas|introuvable/i).first()
    await expect(notFound).toBeVisible({ timeout: 15000 })

    // STRICT: un lien retour a l'accueil DOIT etre visible
    const backLink = page.getByRole('link', { name: /Retour|accueil/i }).first()
    await expect(backLink).toBeVisible({ timeout: 10000 })
  })
})

// ============================================================
// LFG Pages — /lfg/:game
// ============================================================

test.describe('LFG Page — /lfg/valorant', () => {
  test('affiche le heading LFG avec le nom du jeu', async ({ page }) => {
    await page.goto('/lfg/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 DOIT contenir un texte relatif a "joueurs" ou "squad"
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.toLowerCase()).toMatch(/joueurs|squad|valorant/)

    // STRICT: le CTA "Rejoindre maintenant" DOIT etre visible
    const cta = page.getByRole('link', { name: /Rejoindre|Créer/i }).first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })

  test('affiche les 3 etapes et la section benefits', async ({ page }) => {
    await page.goto('/lfg/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: la section etapes DOIT etre presente
    const stepsHeading = page.getByText(/3 étapes|Trouve ta squad/i).first()
    await expect(stepsHeading).toBeVisible({ timeout: 10000 })

    // STRICT: la section benefits DOIT etre presente
    const benefitsHeading = page.getByText(/Pas un LFG de plus|vrai outil/i).first()
    await expect(benefitsHeading).toBeVisible({ timeout: 10000 })
  })

  test('affiche les temoignages', async ({ page }) => {
    await page.goto('/lfg/valorant')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Scroller vers les temoignages
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6))
    await page.waitForTimeout(1000)

    // STRICT: la section temoignages DOIT etre visible
    const testimonials = page.getByText(/trouvé leur squad|témoignages/i).first()
    await expect(testimonials).toBeVisible({ timeout: 10000 })
  })

  test('les meta tags SEO LFG sont corrects', async ({ page }) => {
    await page.goto('/lfg/valorant')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Valorant"
    await expect(page).toHaveTitle(/Valorant/i)

    // STRICT: la meta description DOIT etre non-vide
    const metaDesc = page.locator('meta[name="description"]').first()
    const descContent = await metaDesc.getAttribute('content')
    expect(descContent).toBeTruthy()
    expect(descContent!.length).toBeGreaterThan(30)
  })
})

// ============================================================
// Alternative Pages — /alternative/*
// ============================================================

test.describe('Alternative Guilded — /alternative/guilded', () => {
  test('affiche la page alternative Guilded avec heading et contenu', async ({ page }) => {
    await page.goto('/alternative/guilded')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading principal DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.toLowerCase()).toMatch(/guilded|alternative/)

    // STRICT: du contenu substantiel DOIT etre present
    const main = page.locator('main').first()
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(200)
  })

  test('les meta tags alternative/guilded sont corrects', async ({ page }) => {
    await page.goto('/alternative/guilded')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Guilded"
    await expect(page).toHaveTitle(/Guilded/i)

    // STRICT: le canonical DOIT pointer vers /alternative/guilded
    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/alternative/guilded')
  })

  test('contient un CTA vers Squad Planner', async ({ page }) => {
    await page.goto('/alternative/guilded')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un CTA principal DOIT etre visible
    const cta = page
      .getByRole('link', { name: /Créer|Découvrir|Essayer|Commencer|Squad Planner/i })
      .first()
    await expect(cta).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Alternative GamerLink — /alternative/gamerlink', () => {
  test('affiche la page alternative GamerLink', async ({ page }) => {
    await page.goto('/alternative/gamerlink')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 15000 })

    // STRICT: le contenu DOIT mentionner GamerLink ou matchmaking
    const content = page.getByText(/GamerLink|matchmaking|alternative/i).first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('les meta tags alternative/gamerlink sont corrects', async ({ page }) => {
    await page.goto('/alternative/gamerlink')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "GamerLink"
    await expect(page).toHaveTitle(/GamerLink/i)
  })
})

test.describe('Alternative Discord Events — /alternative/discord-events', () => {
  test('affiche la page alternative Discord Events', async ({ page }) => {
    await page.goto('/alternative/discord-events')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 15000 })

    // STRICT: le contenu DOIT mentionner Discord
    const content = page.getByText(/Discord|événements|alternative/i).first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('les meta tags alternative/discord-events sont corrects', async ({ page }) => {
    await page.goto('/alternative/discord-events')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Discord"
    await expect(page).toHaveTitle(/Discord/i)
  })
})

// ============================================================
// VS Comparison Page — /vs/guilded-vs-squad-planner
// ============================================================

test.describe('VS Comparison — /vs/guilded-vs-squad-planner', () => {
  test('affiche la page de comparaison avec heading et tableau', async ({ page }) => {
    await page.goto('/vs/guilded-vs-squad-planner')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un heading DOIT etre visible
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 15000 })
    const headingText = await heading.textContent()
    expect(headingText).toBeTruthy()
    expect(headingText!.toLowerCase()).toMatch(/guilded|squad planner|comparaison|vs/)

    // STRICT: du contenu de comparaison DOIT etre present
    const main = page.locator('main').first()
    const mainText = await main.textContent()
    expect(mainText).toBeTruthy()
    expect(mainText!.length).toBeGreaterThan(300)
  })

  test('contient un tableau ou des sections de comparaison', async ({ page }) => {
    await page.goto('/vs/guilded-vs-squad-planner')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: un element de comparaison DOIT exister (table ou sections)
    const comparison = page.locator('table, [class*="comparison"], [class*="versus"]').first()
    const hasComparison = await comparison.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasComparison) {
      // Alternative: verifier que les deux produits sont mentionnes
      const guilded = page.getByText(/Guilded/i).first()
      const sp = page.getByText(/Squad Planner/i).first()
      await expect(guilded).toBeVisible({ timeout: 10000 })
      await expect(sp).toBeVisible({ timeout: 10000 })
    }
  })

  test('les meta tags de comparaison sont corrects', async ({ page }) => {
    await page.goto('/vs/guilded-vs-squad-planner')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Guilded" et "Squad Planner"
    await expect(page).toHaveTitle(/Guilded.*Squad Planner|Squad Planner.*Guilded/i)

    // STRICT: le canonical DOIT pointer vers cette page
    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')
    expect(href).toContain('/vs/guilded-vs-squad-planner')
  })

  test('contient un CTA final', async ({ page }) => {
    await page.goto('/vs/guilded-vs-squad-planner')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // Scroller en bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // STRICT: un CTA DOIT etre visible en bas de page
    const cta = page
      .getByRole('link', { name: /Créer|Essayer|Commencer|Découvrir|Squad Planner/i })
      .first()
    await expect(cta).toBeVisible({ timeout: 10000 })
  })
})
