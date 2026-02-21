import { test, expect, navigateWithFallback, dismissTourOverlay } from './fixtures'

/**
 * Profile E2E Tests — /profile et /u/:username
 *
 * MODE STRICT : Tests DB-first.
 * - Verifie que le profil affiche les donnees exactes de la DB (username, level, XP, fiabilite)
 * - Verifie le profil public /u/:username
 * - Verifie les sections challenges, badges, statistiques
 */

// ============================================================
// Profile Page — /profile
// ============================================================

test.describe('Profile — /profile', () => {
  test('affiche le username exact depuis la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le username DB DOIT etre visible sur la page profil
    await expect(page.getByText(profile.username).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le niveau et l\'XP correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const level = Number(profile.level ?? 1)
    const xp = Number(profile.xp ?? 0)

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // La page affiche le niveau comme un chiffre seul + le rang + XP
    // STRICT: le chiffre du niveau OU l'XP DOIVENT etre visibles
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()

    const hasLevel = mainText!.includes(String(level))
    const hasXP = xp > 0 && mainText!.includes(String(xp))

    expect(hasLevel || hasXP).toBe(true)
  })

  test('affiche le score de fiabilite correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const reliability = Number(profile.reliability_score ?? 0)

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (reliability > 0) {
      // STRICT: le score de fiabilite DB DOIT etre visible
      const scoreText = page.getByText(new RegExp(`${reliability}\\s*%`)).first()
      await expect(scoreText).toBeVisible({ timeout: 15000 })
    }
  })

  test('affiche la section Challenges avec le nombre correct de la DB', async ({ authenticatedPage: page, db }) => {
    const challengeData = await db.getChallenges()
    const activeChallenges = challengeData.challenges

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (activeChallenges.length > 0) {
      // STRICT: la section challenges DOIT etre visible quand la DB a des challenges actifs
      const challengeSection = page.getByText(/Défi|Challenge|Objectif/i).first()
      await expect(challengeSection).toBeVisible({ timeout: 15000 })
    }
  })

  test('affiche la section Badges si des badges existent en DB', async ({ authenticatedPage: page, db }) => {
    const challengeData = await db.getChallenges()
    const badges = challengeData.badges

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (badges.length > 0) {
      // STRICT: la section badges DOIT etre visible quand la DB a des badges
      const badgeSection = page.getByText(/Badge|badge|Récompense/i).first()
      await expect(badgeSection).toBeVisible({ timeout: 15000 })
    }
  })

  test('affiche le nombre de squads correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const squads = await db.getUserSquads()
    const dbSquadCount = squads.length

    const loaded = await navigateWithFallback(page, '/profile')
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)
    await page.waitForTimeout(2000)

    // STRICT: le compteur de squads DOIT etre quelque part sur la page
    const mainText = await page.locator('main').first().textContent()
    expect(mainText).toBeTruthy()

    if (dbSquadCount > 0) {
      // Le profil affiche "X squads" dans les stats
      expect(mainText).toContain(String(dbSquadCount))
    }
  })

  test('les meta tags profil sont corrects', async ({ authenticatedPage: page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Profil"
    await expect(page).toHaveTitle(/Profil/i)
  })

  test('la page est protegee — redirige vers /auth sans connexion', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForTimeout(4000)

    // STRICT: sans auth, l'URL DOIT etre /auth
    await expect(page).toHaveURL(/\/auth/)
  })
})

// ============================================================
// Public Profile — /u/:username
// ============================================================

test.describe('Public Profile — /u/:username', () => {
  test('affiche le profil public avec le username exact de la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    expect(profile.username).toBeTruthy()

    const loaded = await navigateWithFallback(page, `/u/${profile.username}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le username DB DOIT etre affiche sur le profil public
    await expect(page.getByText(profile.username).first()).toBeVisible({ timeout: 15000 })
  })

  test('affiche le niveau du joueur correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const level = Number(profile.level ?? 1)

    const loaded = await navigateWithFallback(page, `/u/${profile.username}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    // STRICT: le niveau DB DOIT etre affiche sur le profil public
    const levelText = page.getByText(new RegExp(`Niveau\\s*${level}|Niv\\.?\\s*${level}|Level\\s*${level}`, 'i')).first()
    await expect(levelText).toBeVisible({ timeout: 15000 })
  })

  test('affiche le score de fiabilite du joueur correspondant a la DB', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()
    const reliability = Number(profile.reliability_score ?? 0)

    const loaded = await navigateWithFallback(page, `/u/${profile.username}`)
    expect(loaded).toBe(true)
    await dismissTourOverlay(page)

    if (reliability > 0) {
      // STRICT: le score de fiabilite DOIT etre visible sur le profil public
      const scoreText = page.getByText(new RegExp(`${reliability}\\s*%`)).first()
      await expect(scoreText).toBeVisible({ timeout: 15000 })
    }
  })

  test('affiche "Joueur introuvable" pour un username inexistant', async ({ authenticatedPage: page }) => {
    await page.goto('/u/utilisateur-qui-nexiste-pas-xyz123')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: un message d'erreur DOIT etre visible pour un username inexistant
    const error = page.getByText(/introuvable|non trouvé|n'existe pas|404/i).first()
    await expect(error).toBeVisible({ timeout: 15000 })
  })

  test('les meta tags du profil public sont corrects', async ({ authenticatedPage: page, db }) => {
    const profile = await db.getProfile()
    expect(profile).toBeTruthy()

    await page.goto(`/u/${profile.username}`)
    await page.waitForLoadState('networkidle')

    // STRICT: le title DOIT contenir "Profil"
    await expect(page).toHaveTitle(/Profil/i)
  })
})
