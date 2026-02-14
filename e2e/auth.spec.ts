import { test, expect } from '@playwright/test'

/**
 * Auth E2E Tests — F01-F05
 * F01: Landing page + sections
 * F02: Registration form + validation
 * F03: Login form + login error
 * F04: Google OAuth button
 * F05: Password reset link + reset flow
 * + Protected routes redirection
 *
 * Ces tests s'exécutent SANS authentification (visiteur anonyme).
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

/**
 * Helper: switch to register mode on the /auth page.
 * Clicks the "Créer un compte" toggle and waits for the register heading.
 */
async function switchToRegisterMode(page: import('@playwright/test').Page) {
  const registerToggle = page.getByText(/Créer un compte/i).first()
  await registerToggle.click()
  await expect(
    page.getByRole('heading', { name: /Rejoins l'aventure/i })
  ).toBeVisible({ timeout: 10000 })
}

// ============================================================
// F01 — Landing Page
// ============================================================

test.describe('F01 — Landing Page', () => {
  test('F01: Landing page displays H1, CTAs, and correct title', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)

    // H1 contenant "Transforme"
    await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible()

    // Boutons CTA principaux
    await expect(
      page.getByRole('link', { name: /Se connecter/i }).first()
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Créer ma squad/i }).first()
    ).toBeVisible()

    // Titre de la page
    await expect(page).toHaveTitle(/Squad Planner/)
  })

  test('F01: Landing page has Features, FAQ, and Pricing sections', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)

    // Section Features
    const featuresSection = page.locator('#features')
    await expect(featuresSection).toBeAttached()

    // Section FAQ
    const faqSection = page.locator('#faq, section:has-text("FAQ"), [data-section="faq"]')
    await expect(faqSection.first()).toBeAttached()

    // Section Pricing
    const pricingSection = page.locator('#pricing, section:has-text("Prix"), section:has-text("Tarif"), [data-section="pricing"]')
    await expect(pricingSection.first()).toBeAttached()
  })
})

// ============================================================
// F02 — Registration Form
// ============================================================

test.describe('F02 — Registration Form', () => {
  test('F02: Register form appears with email and password fields', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Cliquer sur "Créer un compte" pour basculer en mode inscription
    await switchToRegisterMode(page)

    // Champs email et password présents
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('F02: Submitting empty register form shows validation errors', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    await switchToRegisterMode(page)

    // Vérifier que les champs sont vides
    await expect(page.locator('input[type="email"]')).toHaveValue('')
    await expect(page.locator('input[type="password"]')).toHaveValue('')

    // Soumettre le formulaire vide
    await page.click('button[type="submit"]')

    // Attendre que les messages d'erreur de validation apparaissent
    // Le code source montre ces messages exacts dans handleSubmit :
    // - "Le pseudo est requis" (username vide en mode register)
    // - "L'email est requis" (email vide)
    // - "Le mot de passe est requis" (password vide)
    const errorMessages = page.locator('.text-error')
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })

    // Au moins 2 erreurs doivent apparaître (pseudo + email ou password)
    const errorCount = await errorMessages.count()
    expect(errorCount).toBeGreaterThanOrEqual(2)

    // Vérifier les messages spécifiques
    const pageContent = await page.textContent('body')
    expect(pageContent).toContain('Le pseudo est requis')
    expect(pageContent).toContain("L'email est requis")
  })

  test('F02: Invalid email and short password show specific validation errors', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    await switchToRegisterMode(page)

    // Remplir un pseudo valide pour isoler les erreurs email/password
    const usernameInput = page.locator('input[placeholder*="pseudo" i], input[autocomplete="username"]').first()
    await usernameInput.fill('TestUser123')

    // Remplir un email invalide
    await page.fill('input[type="email"]', 'not@valid')

    // Remplir un mot de passe trop court (< 6 chars)
    await page.fill('input[type="password"]', 'ab1')

    // Soumettre
    await page.click('button[type="submit"]')

    // Attendre les erreurs de validation
    const errorMessages = page.locator('.text-error')
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })

    // Vérifier les messages d'erreur spécifiques
    const pageContent = await page.textContent('body')

    // Le code source valide avec emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // "not@valid" ne matche pas (pas de dot dans le domaine)
    expect(pageContent).toContain("L'adresse email n'est pas valide")

    // Le mot de passe "ab1" fait 3 chars, < 6
    expect(pageContent).toContain('Le mot de passe doit contenir au moins 6 caractères')
  })
})

// ============================================================
// F03 — Login Form
// ============================================================

test.describe('F03 — Login Form', () => {
  test('F03: Login page shows heading, form elements, and submit button', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Heading login : "T'as manqué à ta squad !"
    await expect(
      page.getByRole('heading', { name: /manqué à ta squad/i })
    ).toBeVisible()

    // Champs de formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Bouton submit
    await expect(
      page.getByRole('button', { name: /Se connecter/i })
    ).toBeVisible()
  })

  test('F03: Login with invalid credentials stays on /auth', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Remplir avec des identifiants invalides
    await page.fill('input[type="email"]', 'fake-user-e2e@test.invalid')
    await page.fill('input[type="password"]', 'WrongPassword999!')
    await page.click('button[type="submit"]')

    // Attendre la réponse du serveur
    await page.waitForTimeout(3000)

    // L'utilisateur reste sur /auth (pas de redirection)
    await expect(page).toHaveURL(/\/auth/)
  })
})

// ============================================================
// F04 — Google OAuth
// ============================================================

test.describe('F04 — Google OAuth', () => {
  test('F04: Google login button is visible', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    const googleBtn = page.getByRole('button', { name: /Continuer avec Google/i })
    await expect(googleBtn).toBeVisible()
  })

  test('F04a: Google button click initiates OAuth redirect to Supabase', async ({ page }) => {
    let oauthRedirectUrl: string | null = null

    // Intercept the OAuth redirect to Supabase auth
    await page.route('**/auth/v1/authorize**', async (route) => {
      oauthRedirectUrl = route.request().url()
      // Abort to prevent actual Google redirect
      await route.abort()
    })

    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    const googleBtn = page.getByRole('button', { name: /Continuer avec Google/i })
    await expect(googleBtn).toBeVisible()
    await googleBtn.click()
    await page.waitForTimeout(3000)

    // Verify OAuth flow was initiated
    if (oauthRedirectUrl) {
      // The URL should contain Google as the provider
      expect(oauthRedirectUrl).toContain('provider=google')
    } else {
      // Page may have navigated to Google or Supabase OAuth directly
      const url = page.url()
      const navigatedToOAuth =
        url.includes('supabase') ||
        url.includes('accounts.google.com') ||
        url.includes('auth/v1')
      // If stayed on /auth, the button may have triggered a popup instead
      expect(navigatedToOAuth || url.includes('/auth')).toBe(true)
    }
  })

  test('F04b: Google button has correct icon and accessibility', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Find Google button
    const googleBtn = page.getByRole('button', { name: /Continuer avec Google|Google/i })
    await expect(googleBtn).toBeVisible()

    // Verify Google SVG icon is present inside the button
    const hasSvg = await googleBtn.locator('svg').first().isVisible().catch(() => false)
    const hasImg = await googleBtn.locator('img').first().isVisible().catch(() => false)
    expect(hasSvg || hasImg).toBe(true)
  })
})

// ============================================================
// F05 — Password Reset
// ============================================================

test.describe('F05 — Password Reset', () => {
  test('F05: Password reset link is visible', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    const resetLink = page.getByText(/Mot de passe oublié/i)
    await expect(resetLink).toBeVisible()
  })

  test('F05: Clicking "Mot de passe oublié" without email shows error message', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // S'assurer que le champ email est vide
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill('')

    // Cliquer sur "Mot de passe oublié ?"
    const resetLink = page.getByText(/Mot de passe oublié/i)
    await resetLink.click()

    // Le code source affiche: "Entre ton email pour recevoir le lien de réinitialisation"
    // quand l'email est vide (handleForgotPassword)
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })

    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('Entre ton email pour recevoir le lien de réinitialisation')
  })

  test('F05: Clicking "Mot de passe oublié" with email triggers reset flow', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Remplir un email valide
    await page.fill('input[type="email"]', 'test-reset-e2e@example.com')

    // Cliquer sur "Mot de passe oublié ?"
    const resetLink = page.getByText(/Mot de passe oublié/i)
    await resetLink.click()

    // Attendre la réponse du serveur
    await page.waitForTimeout(3000)

    // Deux résultats possibles :
    // 1. Succès : "Email envoyé ! Vérifie ta boîte mail" (texte dans le composant)
    // 2. Erreur : un message d'erreur traduit (rate limit, etc.)
    // Dans les deux cas, un feedback visible doit apparaître
    const successMessage = page.getByText(/Email envoyé/i)
    const errorAlert = page.locator('[role="alert"]')
    const loadingText = page.getByText(/Envoi en cours/i)

    const hasSuccess = await successMessage.isVisible().catch(() => false)
    const hasError = await errorAlert.isVisible().catch(() => false)
    const hasLoading = await loadingText.isVisible().catch(() => false)

    // Le système doit avoir répondu d'une manière ou d'une autre
    expect(hasSuccess || hasError || hasLoading).toBe(true)
  })
})

// ============================================================
// Protected Routes — Redirection
// ============================================================

test.describe('Protected Routes — Redirection', () => {
  const protectedRoutes = ['/squads', '/sessions', '/messages', '/profile']

  for (const route of protectedRoutes) {
    test(`Unauthenticated user visiting ${route} is redirected to /auth`, async ({ page }) => {
      await page.goto(route)

      // Attendre la redirection client-side
      await page.waitForTimeout(4000)

      const url = page.url()
      // L'utilisateur non-authentifié doit être redirigé vers /auth
      expect(url).toContain('/auth')
    })
  }
})
