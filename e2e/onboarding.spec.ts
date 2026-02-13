import { test, expect } from '@playwright/test'

/**
 * Onboarding E2E Tests — F06-F09 (read-only)
 * F06: Onboarding page loads
 * F07: Join squad option (code input)
 * F08: Profile setup (username/avatar)
 * F09: Permissions step (notifications/micro)
 *
 * Le test user a déjà complété l'onboarding, donc ces tests vérifient
 * la redirection correcte OU la structure de la page d'onboarding.
 * Pas d'authentification requise — l'onboarding est pour les nouveaux utilisateurs.
 */

async function dismissCookieBanner(page: import('@playwright/test').Page) {
  try {
    const btn = page.getByRole('button', { name: /Tout accepter/i })
    await btn.waitFor({ state: 'visible', timeout: 3000 })
    await btn.click()
    await page.waitForTimeout(500)
  } catch {
    // Cookie banner not present
  }
}

// ============================================================
// F06 — Onboarding Page Loads
// ============================================================

test.describe('F06 — Onboarding Page', () => {
  test('F06: Onboarding page loads or redirects to a known location', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()

    // La page doit rediriger vers un emplacement connu — jamais une page blanche
    expect(url).toMatch(/\/(onboarding|auth|home|squads)/)

    if (url.includes('/home')) {
      // Redirection vers /home : vérifier que la page d'accueil s'est chargée
      // Chercher un heading, le nom d'utilisateur, ou un élément structurant
      const homeHeading = page.getByRole('heading').first()
      const hasHeading = await homeHeading.isVisible().catch(() => false)

      const navElement = page.locator('nav, [role="navigation"]').first()
      const hasNav = await navElement.isVisible().catch(() => false)

      expect(hasHeading || hasNav).toBe(true)
    } else if (url.includes('/auth')) {
      // Redirection vers /auth : vérifier que le formulaire de login est présent
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
    } else if (url.includes('/onboarding')) {
      // Sur la page d'onboarding : vérifier que le contenu du premier step est visible
      const body = page.locator('body')
      const bodyText = await body.textContent()

      // Le premier step doit contenir du contenu significatif (pas une page blanche)
      expect(bodyText!.length).toBeGreaterThan(50)

      // Vérifier qu'un élément interactif est présent (bouton, input, lien)
      const interactiveElement = page.locator('button, input, a[href]').first()
      await expect(interactiveElement).toBeVisible()
    }
  })
})

// ============================================================
// F07 — Join Squad Option
// ============================================================

test.describe('F07 — Join Squad via Code', () => {
  test('F07: Join squad code input or join option exists on onboarding', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()

    if (url.includes('/onboarding')) {
      // Chercher un champ de saisie de code d'invitation
      const codeInput = page.locator(
        'input[placeholder*="code" i], input[placeholder*="invitation" i], input[placeholder*="rejoin" i], input[name*="code" i]'
      ).first()
      const hasCodeInput = await codeInput.isVisible().catch(() => false)

      // Ou chercher un bouton/texte "Rejoindre"
      const joinOption = page.getByText(/Rejoindre/i).first()
      const hasJoinOption = await joinOption.isVisible().catch(() => false)

      // L'un des deux DOIT exister sur la page d'onboarding
      expect(hasCodeInput || hasJoinOption).toBe(true)
    } else {
      // Redirection — vérifier que la cible est valide (pas une page blanche)
      expect(url).toMatch(/\/(auth|home|squads)/)

      // La page de destination doit avoir du contenu réel
      const bodyText = await page.locator('body').textContent()
      expect(bodyText!.length).toBeGreaterThan(50)
    }
  })
})

// ============================================================
// F08 — Profile Setup
// ============================================================

test.describe('F08 — Profile Setup', () => {
  test('F08: Profile setup step has username or avatar fields if on onboarding', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()

    if (url.includes('/onboarding')) {
      // Chercher les champs de profil (username, avatar)
      const usernameInput = page.locator(
        'input[placeholder*="pseudo" i], input[placeholder*="username" i], input[placeholder*="nom" i], input[name*="username" i]'
      ).first()
      const hasUsername = await usernameInput.isVisible().catch(() => false)

      const avatarField = page.locator(
        'input[type="file"], button:has-text("avatar"), [data-testid*="avatar"], img[alt*="avatar" i]'
      ).first()
      const hasAvatar = await avatarField.isVisible().catch(() => false)

      // Au moins un des champs de profil DOIT être présent sur l'onboarding
      expect(hasUsername || hasAvatar).toBe(true)
    } else {
      // Redirection — vérifier que la cible est valide
      expect(url).toMatch(/\/(auth|home|squads)/)

      // La page de destination doit avoir du contenu réel
      const bodyText = await page.locator('body').textContent()
      expect(bodyText!.length).toBeGreaterThan(50)
    }
  })
})

// ============================================================
// F09 — Permissions Step
// ============================================================

test.describe('F09 — Permissions Step', () => {
  test('F09: Permissions step mentions notifications, microphone, or permissions if on onboarding', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForTimeout(3000)
    await dismissCookieBanner(page)

    const url = page.url()

    if (url.includes('/onboarding')) {
      // Chercher du texte lié aux permissions
      const notifText = page.getByText(/notification|notif/i).first()
      const hasNotif = await notifText.isVisible().catch(() => false)

      const microText = page.getByText(/micro|microphone|audio|voix/i).first()
      const hasMicro = await microText.isVisible().catch(() => false)

      const permissionText = page.getByText(/permission|autoriser|activer/i).first()
      const hasPermission = await permissionText.isVisible().catch(() => false)

      // Au moins un des éléments de permissions DOIT être présent
      expect(hasNotif || hasMicro || hasPermission).toBe(true)
    } else {
      // Redirection — vérifier que la cible est valide
      expect(url).toMatch(/\/(auth|home|squads)/)

      // La page de destination doit avoir du contenu réel
      const bodyText = await page.locator('body').textContent()
      expect(bodyText!.length).toBeGreaterThan(50)
    }
  })
})
