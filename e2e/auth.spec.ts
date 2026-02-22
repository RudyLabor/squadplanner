import { test, expect, dismissCookieBanner } from './fixtures'

/**
 * Auth E2E Tests — F01-F05 (STRICT MODE)
 *
 * REGLE STRICTE : Chaque test DOIT echouer si l'UI ne correspond pas a l'attendu.
 * - Pas de `.catch(() => false)` sur les assertions
 * - Pas de OR conditions qui passent toujours
 * - Pas de fallback sur `<main>` quand un element specifique est attendu
 * - Pas de `toBeGreaterThanOrEqual(0)`
 *
 * F01: Landing page + sections
 * F02: Registration form + validation
 * F03: Login form + login error
 * F04: Google OAuth button
 * F05: Password reset link + reset flow
 * + Protected routes redirection
 *
 * Ces tests s'executent SANS authentification (visiteur anonyme).
 * Le fixture `db` est utilise pour valider les donnees quand pertinent.
 */

/**
 * Helper: switch to register mode on the /auth page.
 * Clicks the "Creer un compte" toggle and waits for the register heading.
 */
async function switchToRegisterMode(page: import('@playwright/test').Page) {
  const registerToggle = page.getByText(/Créer un compte/i).first()
  // STRICT: le toggle DOIT etre visible
  await expect(registerToggle).toBeVisible({ timeout: 10000 })
  await registerToggle.click()
  // STRICT: le heading d'inscription DOIT apparaitre
  await expect(page.getByRole('heading', { name: /Rejoins l'aventure/i })).toBeVisible({
    timeout: 10000,
  })
}

// ============================================================
// F01 — Landing Page
// ============================================================

test.describe('F01 — Landing Page', () => {
  test('F01: Landing page displays H1, CTAs, and correct title', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)

    // STRICT: H1 contenant "Transforme" DOIT etre visible
    await expect(page.getByRole('heading', { name: /Transforme/i })).toBeVisible({ timeout: 10000 })

    // STRICT: les deux CTAs principaux DOIVENT etre visibles
    await expect(page.getByRole('link', { name: /Se connecter/i }).first()).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('link', { name: /Créer ma squad/i }).first()).toBeVisible({
      timeout: 5000,
    })

    // STRICT: le titre de la page DOIT contenir "Squad Planner"
    await expect(page).toHaveTitle(/Squad Planner/)
  })

  test('F01: Landing page has Features, FAQ, and Pricing sections', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)

    // STRICT: la section Features DOIT exister
    await expect(page.locator('#features')).toBeAttached({ timeout: 10000 })

    // STRICT: la section FAQ DOIT exister
    const faqSection = page.locator('#faq, section:has-text("FAQ"), [data-section="faq"]')
    await expect(faqSection.first()).toBeAttached({ timeout: 10000 })

    // STRICT: la section Pricing DOIT exister
    const pricingSection = page.locator(
      '#pricing, section:has-text("Prix"), section:has-text("Tarif"), [data-section="pricing"]'
    )
    await expect(pricingSection.first()).toBeAttached({ timeout: 10000 })
  })

  test('F01: Landing page has navigation links', async ({ page }) => {
    await page.goto('/')
    await dismissCookieBanner(page)

    // STRICT: un header/nav DOIT exister avec des liens
    const nav = page.locator('header nav, nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })

    // STRICT: le lien "Se connecter" DOIT etre dans la nav
    const loginLink = page.getByRole('link', { name: /Se connecter/i }).first()
    await expect(loginLink).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// F02 — Registration Form
// ============================================================

test.describe('F02 — Registration Form', () => {
  test('F02: Register form appears with email, password, and username fields', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    await switchToRegisterMode(page)

    // STRICT: les champs email, password et pseudo DOIVENT etre visibles
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 })

    // Le champ pseudo DOIT exister en mode inscription
    const usernameInput = page
      .locator('input[placeholder*="pseudo" i], input[autocomplete="username"]')
      .first()
    await expect(usernameInput).toBeVisible({ timeout: 5000 })
  })

  test('F02: Submitting empty register form shows validation errors', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    await switchToRegisterMode(page)

    // STRICT: verifier que les champs sont vides
    await expect(page.locator('input[type="email"]')).toHaveValue('')
    await expect(page.locator('input[type="password"]')).toHaveValue('')

    // Soumettre le formulaire vide
    await page.click('button[type="submit"]')

    // STRICT: les messages d'erreur DOIVENT apparaitre
    const errorMessages = page.locator('.text-error')
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })

    // STRICT: au moins 2 erreurs distinctes (pseudo + email minimum)
    const errorCount = await errorMessages.count()
    // STRICT: on attend au moins 2, pas >= 0
    expect(errorCount).toBeGreaterThanOrEqual(2)

    // STRICT: messages specifiques DOIVENT etre presents dans le body
    const pageContent = await page.textContent('body')
    // STRICT: le message "Le pseudo est requis" DOIT apparaitre
    expect(pageContent).toContain('Le pseudo est requis')
    // STRICT: le message "L'email est requis" DOIT apparaitre
    expect(pageContent).toContain("L'email est requis")
  })

  test('F02: Invalid email and short password show specific validation errors', async ({
    page,
  }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    await switchToRegisterMode(page)

    // Remplir un pseudo valide pour isoler les erreurs email/password
    const usernameInput = page
      .locator('input[placeholder*="pseudo" i], input[autocomplete="username"]')
      .first()
    await usernameInput.fill('TestUser123')

    // Remplir un email invalide (pas de dot dans le domaine)
    await page.fill('input[type="email"]', 'not@valid')

    // Remplir un mot de passe trop court (< 6 chars)
    await page.fill('input[type="password"]', 'ab1')

    // Soumettre
    await page.click('button[type="submit"]')

    // STRICT: les erreurs de validation DOIVENT apparaitre
    const errorMessages = page.locator('.text-error')
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })

    const pageContent = await page.textContent('body')

    // STRICT: le message email invalide DOIT etre present
    expect(pageContent).toContain("L'adresse email n'est pas valide")

    // STRICT: le message mot de passe trop court DOIT etre present
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

    // STRICT: le heading de login DOIT etre visible
    await expect(page.getByRole('heading', { name: /manqué à ta squad/i })).toBeVisible({
      timeout: 10000,
    })

    // STRICT: les champs du formulaire DOIVENT etre visibles
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 })

    // STRICT: le bouton submit DOIT etre visible
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible({ timeout: 5000 })
  })

  test('F03: Login with invalid credentials shows error and stays on /auth', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Remplir avec des identifiants invalides
    await page.fill('input[type="email"]', 'fake-user-e2e@test.invalid')
    await page.fill('input[type="password"]', 'WrongPassword999!')
    await page.click('button[type="submit"]')

    // Attendre la reponse du serveur
    await page.waitForTimeout(3000)

    // STRICT: l'utilisateur DOIT rester sur /auth (pas de redirection)
    await expect(page).toHaveURL(/\/auth/)

    // STRICT: un message d'erreur DOIT apparaitre (role="alert" ou .text-error)
    const errorAlert = page.locator('[role="alert"], .text-error').first()
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
  })

  test('F03: Login with real credentials redirects away from /auth', async ({ page, db }) => {
    // Fetch profile from DB to confirm user exists
    const profile = await db.getProfile()
    // STRICT: le profil DOIT exister en DB
    expect(profile).toBeTruthy()
    // STRICT: le username DOIT exister
    expect(profile.username).toBeTruthy()

    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Utiliser les credentials du test user
    await page.fill('input[type="email"]', 'rudylabor@hotmail.fr')
    await page.fill('input[type="password"]', 'ruudboy92')
    await page.click('button[type="submit"]')

    // STRICT: l'utilisateur DOIT etre redirige hors de /auth
    await page.waitForURL((url) => !url.pathname.includes('/auth'), {
      timeout: 20000,
      waitUntil: 'domcontentloaded',
    })

    const url = page.url()
    // STRICT: l'URL DOIT etre une page protegee, PAS /auth
    expect(url).not.toContain('/auth')
  })
})

// ============================================================
// F04 — Google OAuth
// ============================================================

test.describe('F04 — Google OAuth', () => {
  test('F04: Google login button is visible with correct text', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // STRICT: le bouton Google DOIT etre visible
    const googleBtn = page.getByRole('button', { name: /Continuer avec Google/i })
    await expect(googleBtn).toBeVisible({ timeout: 5000 })

    // STRICT: le bouton DOIT contenir le texte "Google"
    const btnText = await googleBtn.textContent()
    expect(btnText).toContain('Google')
  })

  test('F04a: Google button click initiates OAuth redirect to Supabase', async ({ page }) => {
    let oauthRedirectUrl: string | null = null

    // Intercept the OAuth redirect to Supabase auth
    await page.route('**/auth/v1/authorize**', async (route) => {
      oauthRedirectUrl = route.request().url()
      await route.abort()
    })

    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    const googleBtn = page.getByRole('button', { name: /Continuer avec Google/i })
    // STRICT: le bouton Google DOIT etre visible
    await expect(googleBtn).toBeVisible({ timeout: 5000 })
    await googleBtn.click()
    await page.waitForTimeout(3000)

    // STRICT: soit l'URL a ete interceptee, soit la page a navigue vers OAuth
    const url = page.url()

    if (oauthRedirectUrl) {
      // STRICT: l'URL interceptee DOIT contenir provider=google
      expect(oauthRedirectUrl).toContain('provider=google')
    } else {
      // STRICT: la page DOIT avoir navigue vers Supabase ou Google
      const navigatedToOAuth =
        url.includes('supabase') || url.includes('accounts.google.com') || url.includes('auth/v1')
      // STRICT: l'un de ces URLs DOIT etre atteint
      expect(navigatedToOAuth).toBe(true)
    }
  })

  test('F04b: Google button has an icon (SVG or image)', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    const googleBtn = page.getByRole('button', { name: /Continuer avec Google|Google/i })
    // STRICT: le bouton DOIT etre visible
    await expect(googleBtn).toBeVisible({ timeout: 5000 })

    // STRICT: le bouton DOIT contenir un SVG ou une image
    const svgCount = await googleBtn.locator('svg').count()
    const imgCount = await googleBtn.locator('img').count()
    // STRICT: au moins un icone DOIT etre present
    expect(svgCount + imgCount).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================
// F05 — Password Reset
// ============================================================

test.describe('F05 — Password Reset', () => {
  test('F05: Password reset link is visible on login form', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // STRICT: le lien "Mot de passe oublie" DOIT etre visible
    const resetLink = page.getByText(/Mot de passe oublié/i)
    await expect(resetLink).toBeVisible({ timeout: 5000 })
  })

  test('F05: Clicking reset without email shows specific error message', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // S'assurer que le champ email est vide
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill('')

    // Cliquer sur "Mot de passe oublie ?"
    const resetLink = page.getByText(/Mot de passe oublié/i)
    await resetLink.click()

    // STRICT: une alerte DOIT apparaitre
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })

    // STRICT: le message DOIT contenir le texte exact
    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('Entre ton email pour recevoir le lien de réinitialisation')
  })

  test('F05: Clicking reset with valid email triggers feedback', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('form', { timeout: 15000 })
    await dismissCookieBanner(page)

    // Remplir un email valide
    await page.fill('input[type="email"]', 'test-reset-e2e@example.com')

    // Cliquer sur "Mot de passe oublie ?"
    const resetLink = page.getByText(/Mot de passe oublié/i)
    await resetLink.click()

    // Attendre la reponse du serveur
    await page.waitForTimeout(3000)

    // STRICT: le systeme DOIT repondre avec un message visible (succes OU erreur)
    // Succes = "Email envoye" | Erreur = role="alert" (rate limit etc.)
    const successMessage = page.getByText(/Email envoyé/i)
    const errorAlert = page.locator('[role="alert"]')

    // STRICT: l'un des deux DOIT etre visible — pas de page silencieuse
    // Utilisation de .or() pour une assertion Playwright native
    await expect(successMessage.or(errorAlert)).toBeVisible({ timeout: 5000 })
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

      // STRICT: l'URL DOIT contenir /auth
      await expect(page).toHaveURL(/\/auth/)
    })
  }
})

// ============================================================
// Auth State — DB Validation
// ============================================================

test.describe('Auth State — DB Validation', () => {
  test('Test user exists in DB with valid profile', async ({ db }) => {
    // STRICT: le user ID DOIT etre resolvable
    const userId = await db.getUserId()
    expect(userId).toBeTruthy()
    expect(typeof userId).toBe('string')
    // STRICT: le user ID DOIT etre un UUID valide
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)

    // STRICT: le profil DOIT exister
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    // STRICT: le username DOIT etre non-vide
    expect(profile.username).toBeTruthy()
    expect(profile.username.length).toBeGreaterThan(0)
  })
})
