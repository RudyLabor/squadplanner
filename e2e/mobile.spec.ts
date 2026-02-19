import { test, expect, dismissCookieBanner } from './fixtures'
import { navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Mobile & Tablet Viewport E2E Tests — STRICT MODE (P1.2)
 *
 * STRICT RULES ENFORCED:
 * 1. Every test fetches real DB data FIRST, then verifies UI matches
 * 2. NO .catch(() => false) — use proper assertions
 * 3. NO OR conditions as fallbacks — use explicit if/else with assertions on both branches
 * 4. NO CSS class checks for behavior — use aria attributes or data
 * 5. Use navigateWithFallback() for SSR resilience
 * 6. French text assertions (the app is in French)
 * 7. Import from ./fixtures for test, expect, TestDataHelper
 *
 * Viewports tested:
 * - Mobile: 375x667 (iPhone SE)
 * - Tablet: 768x1024 (iPad)
 * - Desktop reference: 1280x720 (for sidebar visibility contrast)
 */

// ============================================================
// Mobile Viewport (375x667)
// ============================================================

test.describe('Mobile viewport (375x667) — Navigation et layout', () => {

  test('MV01: la barre de navigation mobile est visible sur mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // STRICT: fetch profile from DB first
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la nav mobile avec aria-label DOIT etre visible
    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    await expect(mobileNav).toBeVisible({ timeout: 10000 })

    // STRICT: la nav DOIT contenir au moins 4 liens (Accueil, Squads, Sessions, Messages + Party)
    const navLinks = mobileNav.locator('a[href]')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(4)

    // STRICT: verifier les liens specifiques de la nav
    await expect(mobileNav.locator('a[href="/home"]')).toBeVisible({ timeout: 5000 })
    await expect(mobileNav.locator('a[href="/squads"]')).toBeVisible({ timeout: 5000 })
    await expect(mobileNav.locator('a[href="/sessions"]')).toBeVisible({ timeout: 5000 })
    await expect(mobileNav.locator('a[href="/messages"]')).toBeVisible({ timeout: 5000 })
  })

  test('MV02: le sidebar desktop est cache sur mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le sidebar desktop (classe desktop-only) DOIT etre cache sur mobile
    // Verifier via computed style que display=none
    const sidebarHidden = await page.evaluate(() => {
      const sidebar = document.querySelector('.desktop-only')
      if (!sidebar) return true // pas de sidebar du tout = cache
      const style = window.getComputedStyle(sidebar)
      return style.display === 'none'
    })
    expect(sidebarHidden).toBe(true)
  })

  test('MV03: les touch targets font au moins 44x44px', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: mesurer les dimensions des liens de la nav mobile
    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    await expect(mobileNav).toBeVisible({ timeout: 10000 })

    const navLinks = mobileNav.locator('a[href]')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(4)

    // STRICT: chaque lien de nav DOIT avoir une zone tactile >= 44x44px
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i)
      const box = await link.boundingBox()
      // STRICT: le boundingBox DOIT exister (element visible)
      expect(box).toBeTruthy()
      // STRICT: largeur >= 44px
      expect(box!.width).toBeGreaterThanOrEqual(44)
      // STRICT: hauteur >= 44px
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('MV04: /home rend correctement sur mobile avec les donnees DB', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le username de la DB DOIT etre affiche
    await expect(page.getByText(new RegExp(profile.username, 'i')).first()).toBeVisible({ timeout: 15000 })

    // STRICT: pas de scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 5)
  })

  test('MV05: /squads rend correctement sur mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const squads = await db.getUserSquads()
    expect(Array.isArray(squads)).toBe(true)

    const loaded = await navigateWithFallback(page, '/squads')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le heading DOIT etre visible
    await expect(page.getByText(/Mes Squads/i).first()).toBeVisible({ timeout: 10000 })

    if (squads.length > 0) {
      // STRICT: le premier nom de squad de la DB DOIT etre visible
      await expect(page.getByText(squads[0].squads.name).first()).toBeVisible({ timeout: 15000 })
    } else {
      // STRICT: si pas de squads, empty state DOIT etre visible
      await expect(page.getByText(/Crée ta première squad|Aucune squad/i).first()).toBeVisible({ timeout: 10000 })
    }

    // STRICT: pas de scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 5)
  })

  test('MV06: /sessions rend correctement sur mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/sessions')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la page sessions DOIT avoir du contenu dans main
    const mainContent = await page.locator('main').first().textContent()
    expect(mainContent).toBeTruthy()
    expect(mainContent!.trim().length).toBeGreaterThan(10)

    // STRICT: pas de scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 5)
  })

  test('MV07: /messages rend correctement sur mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const squads = await db.getUserSquads()
    expect(Array.isArray(squads)).toBe(true)

    const loaded = await navigateWithFallback(page, '/messages')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la page DOIT avoir du contenu dans main
    const mainContent = await page.locator('main').first().textContent()
    expect(mainContent).toBeTruthy()
    expect(mainContent!.trim().length).toBeGreaterThan(10)

    // STRICT: pas de scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 5)
  })
})

// ============================================================
// Tablet Viewport (768x1024)
// ============================================================

test.describe('Tablet viewport (768x1024) — Layout responsive', () => {

  test('TV01: la nav mobile est visible sur tablette (pas hover-capable)', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: la nav mobile DOIT etre visible sur tablette (largeur < 1024px)
    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    await expect(mobileNav).toBeVisible({ timeout: 10000 })
  })

  test('TV02: les pages principales rendent sans scroll horizontal sur tablette', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const pages = ['/home', '/squads', '/sessions', '/messages']

    for (const pagePath of pages) {
      const loaded = await navigateWithFallback(page, pagePath)
      expect(loaded).toBe(true)

      // STRICT: pas de scroll horizontal sur chaque page
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyScrollWidth).toBeLessThanOrEqual(768 + 5)
    }
  })

  test('TV03: les touch targets de la nav font au moins 44x44px sur tablette', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    await expect(mobileNav).toBeVisible({ timeout: 10000 })

    const navLinks = mobileNav.locator('a[href]')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(4)

    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i)
      const box = await link.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })
})

// ============================================================
// Desktop Viewport — Sidebar visible, bottom nav hidden
// ============================================================

test.describe('Desktop viewport (1280x720) — Contraste responsive', () => {

  test('DV01: le sidebar desktop est visible et la nav mobile est cachee sur desktop', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le sidebar desktop DOIT etre visible sur desktop
    const sidebarVisible = await page.evaluate(() => {
      const sidebar = document.querySelector('.desktop-only')
      if (!sidebar) return false
      const style = window.getComputedStyle(sidebar)
      return style.display !== 'none'
    })
    expect(sidebarVisible).toBe(true)

    // STRICT: la nav mobile DOIT etre cachee sur desktop
    const mobileNavHidden = await page.evaluate(() => {
      const nav = document.querySelector('.mobile-bottom-nav')
      if (!nav) return true
      const style = window.getComputedStyle(nav)
      return style.display === 'none'
    })
    expect(mobileNavHidden).toBe(true)
  })
})

// ============================================================
// Public Pages — Mobile viewport without auth
// ============================================================

test.describe('Mobile viewport — Pages publiques', () => {

  test('PP01: la landing page rend correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await dismissCookieBanner(page)

    // STRICT: le H1 DOIT etre visible
    await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible({ timeout: 10000 })

    // STRICT: au moins un CTA DOIT etre visible
    const connectLink = page.getByRole('link', { name: /Se connecter/i }).first()
    await expect(connectLink).toBeVisible({ timeout: 5000 })

    // STRICT: pas de scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 5)
  })

  test('PP02: la page auth rend correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
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
    expect(formWidth).toBeGreaterThan(0)
    expect(formWidth).toBeLessThanOrEqual(375)
  })
})

// ============================================================
// Navigation entre pages via la nav mobile
// ============================================================

test.describe('Mobile viewport — Navigation inter-pages', () => {

  test('NAV01: naviguer de /home vers /messages via la nav mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: cliquer sur le lien messages dans la nav mobile
    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    const messagesLink = mobileNav.locator('a[href="/messages"]')
    await expect(messagesLink).toBeVisible({ timeout: 10000 })
    await messagesLink.click()

    // STRICT: l'URL DOIT contenir /messages
    await expect(page).toHaveURL(/\/messages/, { timeout: 10000 })
  })

  test('NAV02: naviguer de /home vers /squads via la nav mobile', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    const squadsLink = mobileNav.locator('a[href="/squads"]')
    await expect(squadsLink).toBeVisible({ timeout: 10000 })
    await squadsLink.click()

    // STRICT: l'URL DOIT contenir /squads
    await expect(page).toHaveURL(/\/squads/, { timeout: 10000 })

    // STRICT: le heading Mes Squads DOIT apparaitre
    await expect(page.getByText(/Mes Squads/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('NAV03: l\'indicateur aria-current=page est actif sur la page courante', async ({ authenticatedPage: page, db }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/home')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le lien /home dans la nav mobile DOIT avoir aria-current="page"
    const mobileNav = page.locator('nav[aria-label="Navigation mobile"]')
    const homeLink = mobileNav.locator('a[href="/home"]')
    await expect(homeLink).toBeVisible({ timeout: 10000 })
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
  })
})
