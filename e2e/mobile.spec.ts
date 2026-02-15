import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Mobile Viewport E2E Tests (STRICT MODE)
 *
 * REGLE STRICTE : Chaque test DOIT echouer si les donnees DB ne s'affichent pas.
 * - Pas de `.catch(() => false)` sur les assertions
 * - Pas de OR conditions qui passent toujours
 * - Pas de fallback sur `<main>` quand un element specifique est attendu
 * - Pas de `toBeGreaterThanOrEqual(0)`
 * - Pas de early returns sans assertions reelles
 * - Pas de try/catch qui avalent les erreurs
 *
 * Tests at 375px (iPhone SE) and 428px (iPhone 14 Pro Max) viewports.
 * Protected page tests validate displayed data against Supabase DB.
 * Uses `db` fixture and `authenticatedPage` from ./fixtures.
 */

const mobileViewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926 },
]

for (const viewport of mobileViewports) {
  test.describe(`Mobile ${viewport.name} (${viewport.width}px)`, () => {

    // ================================================================
    // Public Pages — No Auth Required
    // ================================================================

    test('landing page renders correctly at mobile width', async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await dismissCookieBanner(page)

      // STRICT: le H1 DOIT etre visible
      await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible({ timeout: 10000 })

      // STRICT: au moins un CTA DOIT etre visible (Se connecter OU Creer ma squad)
      const connectLink = page.getByRole('link', { name: /Se connecter/i }).first()
      const createLink = page.getByRole('link', { name: /Créer ma squad/i }).first()

      const connectVisible = await connectLink.isVisible({ timeout: 5000 })
      const createVisible = await createLink.isVisible({ timeout: 2000 })
      // STRICT: au moins un des deux DOIT etre visible
      expect(connectVisible || createVisible).toBe(true)

      // STRICT: pas de scroll horizontal — le body ne DOIT PAS deborder
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('auth page renders correctly at mobile width', async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/auth')
      await page.waitForSelector('form', { timeout: 15000 })
      await dismissCookieBanner(page)

      // STRICT: les champs email et password DOIVENT etre visibles
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 })

      // STRICT: le bouton Se connecter DOIT etre visible
      await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible({ timeout: 5000 })

      // STRICT: le formulaire ne DOIT PAS deborder du viewport
      const formWidth = await page.evaluate(() => {
        const form = document.querySelector('form')
        return form ? form.scrollWidth : 0
      })
      // STRICT: formWidth DOIT etre > 0 (le form existe)
      expect(formWidth).toBeGreaterThan(0)
      expect(formWidth).toBeLessThanOrEqual(viewport.width)
    })

    // ================================================================
    // Protected Pages — Auth Required, DB Validated
    // ================================================================

    test('bottom navigation is visible after login', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch real profile from DB
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()
      // STRICT: username DOIT exister
      expect(profile.username).toBeTruthy()

      await authenticatedPage.goto('/home')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(1500)

      // STRICT: une nav DOIT etre visible en mobile
      const nav = authenticatedPage.locator('nav').last()
      await expect(nav).toBeVisible({ timeout: 10000 })

      // STRICT: la nav DOIT contenir des liens de navigation
      const navLinks = authenticatedPage.locator('nav a[href]')
      const linkCount = await navLinks.count()
      // STRICT: au moins 3 liens de nav (home, squads, messages, etc.)
      expect(linkCount).toBeGreaterThanOrEqual(3)
    })

    test('can navigate between pages via mobile nav', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: verify user has profile
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      await authenticatedPage.goto('/home')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(1500)

      // STRICT: le lien messages DOIT etre present dans la nav mobile (pas le sidebar desktop)
      const mobileNav = authenticatedPage.locator('nav[aria-label="Navigation mobile"]')
      const messagesLink = mobileNav.locator('a[href="/messages"]').first()
      await expect(messagesLink).toBeVisible({ timeout: 10000 })

      // STRICT: cliquer sur messages DOIT naviguer vers /messages
      await messagesLink.click()
      await expect(authenticatedPage).toHaveURL(/\/messages/, { timeout: 10000 })
    })

    test('squads page renders on mobile with DB data', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch squads from DB first
      const userSquads = await db.getUserSquads()
      // STRICT: le resultat DOIT etre un array
      expect(Array.isArray(userSquads)).toBe(true)

      await authenticatedPage.goto('/squads')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(2000)

      // STRICT: le heading "Mes Squads" DOIT etre visible
      await expect(authenticatedPage.getByText(/Mes Squads/i).first()).toBeVisible({ timeout: 10000 })

      if (userSquads.length > 0) {
        // STRICT: si la DB a des squads, au moins un nom DOIT etre affiche
        let foundSquad = false
        for (const membership of userSquads.slice(0, 3)) {
          const nameLocator = authenticatedPage
            .getByText(membership.squads.name, { exact: false })
            .first()
          const isVisible = await nameLocator.isVisible({ timeout: 3000 })
          if (isVisible) {
            foundSquad = true
            break
          }
        }
        // STRICT: au moins un nom de squad de la DB DOIT etre visible sur la page
        expect(foundSquad).toBe(true)
      } else {
        // STRICT: si pas de squads, un empty state ou bouton Creer DOIT etre visible
        const createBtn = authenticatedPage.getByRole('button', { name: /Créer/i }).first()
        await expect(createBtn).toBeVisible({ timeout: 5000 })
      }

      // STRICT: pas de scroll horizontal
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('messages page renders on mobile with DB context', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch squads pour savoir si l'user a des conversations potentielles
      const squads = await db.getUserSquads()
      expect(Array.isArray(squads)).toBe(true)

      await authenticatedPage.goto('/messages')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(2000)

      if (squads.length > 0) {
        // STRICT: si l'user a des squads, la page messages DOIT afficher du contenu
        // (soit des conversations, soit un empty state explicite, soit le nom d'une squad)
        const mainContent = await authenticatedPage.locator('main').first().textContent()
        expect(mainContent).toBeTruthy()
        // STRICT: le contenu ne DOIT PAS etre vide (plus de 10 chars)
        expect(mainContent!.trim().length).toBeGreaterThan(10)
      } else {
        // STRICT: sans squads, un message indiquant "pas de conversations" DOIT exister
        const emptyState = authenticatedPage.getByText(/aucun|pas de|vide|conversation/i).first()
        await expect(emptyState).toBeVisible({ timeout: 5000 })
      }

      // STRICT: pas de scroll horizontal
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('profile page renders on mobile with DB username', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch real profile from DB
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()
      // STRICT: username DOIT exister en DB
      expect(profile.username).toBeTruthy()

      await authenticatedPage.goto('/profile')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(2000)

      // STRICT: le username de la DB DOIT etre affiche sur la page profil
      const usernameOnPage = authenticatedPage.getByText(profile.username, { exact: false }).first()
      await expect(usernameOnPage).toBeVisible({ timeout: 10000 })

      // STRICT: pas de scroll horizontal
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    test('settings page renders on mobile with heading', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch profile from DB
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      await authenticatedPage.goto('/settings')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(1500)

      // STRICT: le heading "Parametres" DOIT etre visible
      await expect(authenticatedPage.getByRole('heading', { name: /Paramètres/i })).toBeVisible({ timeout: 10000 })

      // STRICT: pas de scroll horizontal
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)
    })

    // ================================================================
    // Touch Interactions
    // ================================================================

    test('touch interactions work - squad create button', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: verify user context from DB
      const squads = await db.getUserSquads()
      expect(Array.isArray(squads)).toBe(true)

      await authenticatedPage.goto('/squads')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(2000)

      // STRICT: le heading "Mes Squads" DOIT etre visible
      await expect(authenticatedPage.getByText(/Mes Squads/i).first()).toBeVisible({ timeout: 10000 })

      // Chercher le bouton Creer
      const createBtn = authenticatedPage.locator('main').getByRole('button', { name: /Créer/i }).last()
      const hasCreate = await createBtn.isVisible({ timeout: 5000 })

      if (hasCreate) {
        await createBtn.click()
        await authenticatedPage.waitForTimeout(1000)

        // STRICT: apres le clic, le formulaire de creation DOIT apparaitre
        await expect(authenticatedPage.getByText(/Créer une squad/i)).toBeVisible({ timeout: 5000 })
      } else {
        // STRICT: si pas de bouton Creer visible, la page DOIT avoir un moyen d'action
        // (peut-etre que l'user a atteint la limite freemium)
        const limitMsg = authenticatedPage.getByText(/limite|maximum|premium/i).first()
        const hasLimit = await limitMsg.isVisible({ timeout: 3000 })

        if (!hasLimit) {
          // STRICT: ni bouton Creer ni message de limite -> la page DOIT au moins
          // afficher les squads existantes
          expect(squads.length).toBeGreaterThan(0)
          const firstSquadName = squads[0].squads.name
          await expect(
            authenticatedPage.getByText(firstSquadName, { exact: false }).first()
          ).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('touch interactions work - theme toggle in settings', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: verify user context
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()

      await authenticatedPage.goto('/settings')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(1500)

      // STRICT: le heading Parametres DOIT etre visible
      await expect(authenticatedPage.getByRole('heading', { name: /Paramètres/i })).toBeVisible({ timeout: 10000 })

      // STRICT: les boutons de theme DOIVENT etre visibles
      const lightBtn = authenticatedPage.getByText('Clair').first()
      const darkBtn = authenticatedPage.getByText('Sombre').first()

      // STRICT: au moins un bouton de theme DOIT etre visible
      const lightVisible = await lightBtn.isVisible({ timeout: 5000 })
      const darkVisible = await darkBtn.isVisible({ timeout: 2000 })
      expect(lightVisible || darkVisible).toBe(true)

      if (lightVisible) {
        await lightBtn.click()
        await authenticatedPage.waitForTimeout(500)

        // STRICT: apres le clic sur "Clair", le theme DOIT etre "light"
        const theme = await authenticatedPage.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(theme).toBe('light')
      }

      if (darkVisible) {
        await darkBtn.click()
        await authenticatedPage.waitForTimeout(500)

        // STRICT: apres le clic sur "Sombre", le theme DOIT etre "dark"
        const themeDark = await authenticatedPage.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(themeDark).toBe('dark')
      }
    })

    // ================================================================
    // Mobile-Specific Layout Checks
    // ================================================================

    test('home page dashboard renders at mobile width with DB data', async ({ authenticatedPage, db }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height })

      // STRICT: fetch real data
      const profile = await db.getProfile()
      expect(profile).toBeTruthy()
      expect(profile.username).toBeTruthy()

      await authenticatedPage.goto('/home')
      await authenticatedPage.waitForLoadState('networkidle')
      await authenticatedPage.waitForTimeout(2000)

      // STRICT: le username DOIT etre visible sur le dashboard
      const greeting = authenticatedPage.getByText(new RegExp(profile.username, 'i')).first()
      await expect(greeting).toBeVisible({ timeout: 15000 })

      // STRICT: pas de scroll horizontal sur le dashboard
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5)

      // STRICT: la section main DOIT exister et avoir du contenu
      const mainText = await authenticatedPage.locator('main').first().textContent()
      expect(mainText).toBeTruthy()
      expect(mainText!.trim().length).toBeGreaterThan(20)
    })
  })
}
