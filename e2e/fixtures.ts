import { test as base, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import AxeBuilder from '@axe-core/playwright'
import dotenv from 'dotenv'
import { resolve } from 'path'

// ============================================================
// 1. LOAD ENV (Playwright ne charge pas .env automatiquement)
// ============================================================
dotenv.config({ path: resolve(process.cwd(), '.env') })

// ============================================================
// 2. CONSTANTS
// ============================================================
export const TEST_USER = {
  email: 'rudylabor@hotmail.fr',
  password: 'ruudboy92',
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nxbqiwmfyafgshxzczxo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
const hasServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================
// 3. TestDataHelper — requêtes DB pour validation E2E
// ============================================================
export class TestDataHelper {
  public admin: SupabaseClient
  private _userId: string | null = null

  constructor(admin: SupabaseClient) {
    this.admin = admin
  }

  /** Résout l'ID du test user via auth.admin (la table profiles n'a pas de colonne email) */
  async getUserId(): Promise<string> {
    if (this._userId) return this._userId
    // Recherche via auth.admin.listUsers() — seule source fiable pour l'email
    const { data: users, error } = await this.admin.auth.admin.listUsers()
    if (error) throw new Error(`auth.admin.listUsers failed: ${error.message}`)
    const user = users?.users?.find((u) => u.email === TEST_USER.email)
    if (!user) throw new Error(`Test user ${TEST_USER.email} not found in auth.users`)
    this._userId = user.id
    return user.id
  }

  // --- Profile ---
  async getProfile() {
    const userId = await this.getUserId()
    const { data } = await this.admin.from('profiles').select('*').eq('id', userId).single()
    return data
  }

  // --- Squads ---
  async getUserSquads() {
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('squad_members')
      .select(
        'squad_id, role, squads!inner(id, name, game, invite_code, owner_id, total_members, is_public, created_at)'
      )
      .eq('user_id', userId)
    return (data || []) as unknown as Array<{
      squad_id: string
      role: string
      squads: {
        id: string
        name: string
        game: string
        invite_code: string
        owner_id: string
        total_members: number
        is_public: boolean
        created_at: string
      }
    }>
  }

  async getSquadById(squadId: string) {
    const { data } = await this.admin.from('squads').select('*').eq('id', squadId).single()
    return data
  }

  async getSquadMembers(squadId: string) {
    const { data } = await this.admin
      .from('squad_members')
      .select('*, profiles(username, avatar_url, reliability_score, level, xp)')
      .eq('squad_id', squadId)
    return data || []
  }

  // --- Sessions ---
  async getUserUpcomingSessions() {
    const squads = await this.getUserSquads()
    const squadIds = squads.map((s) => s.squads.id)
    if (squadIds.length === 0) return []
    const { data } = await this.admin
      .from('sessions')
      .select('*, session_rsvps(*)')
      .in('squad_id', squadIds)
      .neq('status', 'cancelled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(20)
    return data || []
  }

  async getSquadSessions(squadId: string) {
    const { data } = await this.admin
      .from('sessions')
      .select('*, session_rsvps(*), session_checkins(*)')
      .eq('squad_id', squadId)
      .order('scheduled_at', { ascending: false })
      .limit(20)
    return data || []
  }

  async getSessionRsvps(sessionId: string) {
    const { data } = await this.admin
      .from('session_rsvps')
      .select('*, profiles(username)')
      .eq('session_id', sessionId)
    return data || []
  }

  // --- Messages ---
  async getSquadMessages(squadId: string, limit = 20) {
    const { data } = await this.admin
      .from('messages')
      .select('*, profiles:sender_id(username)')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }

  async getDirectMessages(limit = 20) {
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }

  async getPinnedMessages(squadId: string) {
    const { data } = await this.admin
      .from('pinned_messages')
      .select('*, messages(content, sender_id)')
      .eq('squad_id', squadId)
    return data || []
  }

  // --- Gamification ---
  async getChallenges() {
    const userId = await this.getUserId()
    const [challengesRes, userChallengesRes, badgesRes] = await Promise.all([
      this.admin.from('challenges').select('*').eq('is_active', true),
      this.admin.from('user_challenges').select('*').eq('user_id', userId),
      this.admin.from('seasonal_badges').select('*').eq('user_id', userId),
    ])
    return {
      challenges: challengesRes.data || [],
      userChallenges: userChallengesRes.data || [],
      badges: badgesRes.data || [],
    }
  }

  // --- Session Checkins ---
  async getSessionCheckins(sessionId: string) {
    const { data } = await this.admin
      .from('session_checkins')
      .select('*')
      .eq('session_id', sessionId)
    return data || []
  }

  // --- Call History ---
  async getCallHistory(limit = 20) {
    const userId = await this.getUserId()
    const { data, error } = await this.admin
      .from('calls')
      .select('id, caller_id, receiver_id, status, duration_seconds, created_at, ended_at')
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)
    // If table doesn't exist, return empty array gracefully
    if (error) return []
    return data || []
  }

  // --- Leaderboard (uses same RPC as the app) ---
  async getLeaderboard(limit = 20) {
    const { data, error } = await this.admin.rpc('get_global_leaderboard', {
      p_game: null,
      p_region: null,
      p_limit: limit,
    })
    if (error) {
      // Fallback to direct query if RPC not available
      const { data: fallback } = await this.admin
        .from('profiles')
        .select('id, username, xp, level, avatar_url')
        .order('xp', { ascending: false })
        .limit(limit)
      return fallback || []
    }
    return data || []
  }

  // --- Players looking for squad ---
  async getPlayersLookingForSquad(limit = 20) {
    const { data } = await this.admin
      .from('profiles')
      .select('id, username, xp, level, avatar_url, preferred_games, region')
      .eq('looking_for_squad', true)
      .limit(limit)
    return data || []
  }

  // --- DM conversation count (unique partners) ---
  async getDMConversationCount(): Promise<number> {
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('direct_messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    if (!data || data.length === 0) return 0
    const partners = new Set<string>()
    for (const dm of data) {
      const partnerId = dm.sender_id === userId ? dm.receiver_id : dm.sender_id
      partners.add(partnerId)
    }
    return partners.size
  }

  // --- Discover ---
  async getPublicSquads(game?: string, region?: string) {
    let query = this.admin
      .from('squads')
      .select('*')
      .eq('is_public', true)
      .order('total_members', { ascending: false })
      .limit(20)
    if (game) query = query.ilike('game', `%${game}%`)
    if (region) query = query.eq('region', region)
    const { data } = await query
    // Filter test/debug squads (same as app's useDiscoverQueries)
    const TEST_PATTERNS = /\b(test|debug|audit|e2e)\b/i
    return (data || []).filter((s: { name: string }) => !TEST_PATTERNS.test(s.name))
  }

  // --- Premium ---
  async getSubscription() {
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('profiles')
      .select('subscription_tier, subscription_expires_at, stripe_customer_id')
      .eq('id', userId)
      .single()
    return data
  }

  // ============================================================
  // MUTATION HELPERS (create + cleanup)
  // ============================================================

  async createTestSquad(overrides: Partial<{ name: string; game: string }> = {}) {
    const userId = await this.getUserId()

    // Nettoyer les anciennes squads E2E avant de créer (éviter la limite de 2 squads freemium)
    const { data: oldSquads } = await this.admin
      .from('squads')
      .select('id')
      .ilike('name', '%E2E Test%')
      .eq('owner_id', userId)
    if (oldSquads && oldSquads.length > 0) {
      for (const sq of oldSquads) {
        await this.deleteTestSquad(sq.id)
      }
    }

    // Check if user is at freemium squad limit — temporarily upgrade to premium if needed
    const { count } = await this.admin
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const needsUpgrade = (count || 0) >= 2
    if (needsUpgrade) {
      await this.admin
        .from('profiles')
        .update({ subscription_tier: 'premium' })
        .eq('id', userId)
    }

    const code = 'E2E' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await this.admin
      .from('squads')
      .insert({
        name: overrides.name || `E2E Test Squad ${Date.now()}`,
        game: overrides.game || 'Valorant',
        owner_id: userId,
        invite_code: code,
        is_public: false,
      })
      .select()
      .single()

    // Reset to club tier if we temporarily upgraded (user is on club plan)
    if (needsUpgrade) {
      await this.admin
        .from('profiles')
        .update({ subscription_tier: 'club', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('id', userId)
    }

    if (error) throw new Error(`createTestSquad failed: ${error.message}`)
    await this.admin
      .from('squad_members')
      .insert({ squad_id: data.id, user_id: userId, role: 'leader' })
    return data
  }

  async deleteTestSquad(squadId: string) {
    // Delete related data first to avoid FK constraints
    try {
      await this.admin.from('pinned_messages').delete().eq('squad_id', squadId)
      await this.admin.from('messages').delete().eq('squad_id', squadId)
      const { data: sessions } = await this.admin
        .from('sessions')
        .select('id')
        .eq('squad_id', squadId)
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s: { id: string }) => s.id)
        await this.admin.from('session_checkins').delete().in('session_id', sessionIds)
        await this.admin.from('session_rsvps').delete().in('session_id', sessionIds)
      }
      await this.admin.from('sessions').delete().eq('squad_id', squadId)
      await this.admin.from('squad_members').delete().eq('squad_id', squadId)
    } catch {
      /* ignore cleanup errors */
    }
    await this.admin.from('squads').delete().eq('id', squadId)
  }

  /** Nettoie toutes les squads E2E du test user pour libérer la limite freemium */
  async cleanupE2ESquads() {
    const userId = await this.getUserId()
    const { data: memberEntries } = await this.admin
      .from('squad_members')
      .select('squad_id, squads!inner(id, name)')
      .eq('user_id', userId)
    if (memberEntries) {
      for (const entry of memberEntries) {
        const squad = (entry as unknown as { squads: { id: string; name: string } }).squads
        if (squad.name.includes('E2E Test')) {
          await this.deleteTestSquad(squad.id)
        }
      }
    }
  }

  async createActiveTestSession(squadId: string, overrides: Partial<{ title: string }> = {}) {
    const userId = await this.getUserId()
    // Session started 15 min ago, lasts 120 min → currently active
    const startedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data, error } = await this.admin
      .from('sessions')
      .insert({
        squad_id: squadId,
        title: overrides.title || `E2E Test Active Session ${Date.now()}`,
        scheduled_at: startedAt,
        duration_minutes: 120,
        created_by: userId,
        status: 'confirmed',
      })
      .select()
      .single()
    if (error) throw new Error(`createActiveTestSession failed: ${error.message}`)
    return data
  }

  async createTestSession(
    squadId: string,
    overrides: Partial<{
      title: string
      scheduled_at: string
      duration_minutes: number
      auto_confirm_threshold: number
      status: string
    }> = {}
  ) {
    const userId = await this.getUserId()
    const { data, error } = await this.admin
      .from('sessions')
      .insert({
        squad_id: squadId,
        title: overrides.title || `E2E Test Session ${Date.now()}`,
        scheduled_at:
          overrides.scheduled_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: overrides.duration_minutes || 120,
        created_by: userId,
        status: overrides.status || 'proposed',
        ...(overrides.auto_confirm_threshold !== undefined && {
          auto_confirm_threshold: overrides.auto_confirm_threshold,
        }),
      })
      .select()
      .single()
    if (error) throw new Error(`createTestSession failed: ${error.message}`)
    return data
  }

  async createTestRsvp(
    sessionId: string,
    userId: string,
    response: 'present' | 'absent' | 'maybe' = 'present'
  ) {
    const { data, error } = await this.admin
      .from('session_rsvps')
      .insert({ session_id: sessionId, user_id: userId, response })
      .select()
      .single()
    if (error) throw new Error(`createTestRsvp failed: ${error.message}`)
    return data
  }

  async getSessionById(sessionId: string) {
    const { data } = await this.admin.from('sessions').select('*').eq('id', sessionId).single()
    return data
  }

  async deleteTestSession(sessionId: string) {
    await this.admin.from('session_rsvps').delete().eq('session_id', sessionId)
    await this.admin.from('session_checkins').delete().eq('session_id', sessionId)
    await this.admin.from('sessions').delete().eq('id', sessionId)
  }

  async createTestMessage(squadId: string, content: string) {
    const userId = await this.getUserId()
    const { data, error } = await this.admin
      .from('messages')
      .insert({ squad_id: squadId, sender_id: userId, content })
      .select()
      .single()
    if (error) throw new Error(`createTestMessage failed: ${error.message}`)
    return data
  }

  async deleteTestMessage(messageId: string) {
    await this.admin.from('messages').delete().eq('id', messageId)
  }

  /** Nettoyage global de toutes les données E2E orphelines */
  async cleanupAllTestData() {
    await this.admin.from('messages').delete().ilike('content', '%[E2E]%')
    await this.admin.from('sessions').delete().ilike('title', '%E2E Test%')
    await this.admin.from('squads').delete().ilike('name', '%E2E Test%')
  }

  // ============================================================
  // NOUVELLES MÉTHODES — Sprint 100/100
  // ============================================================

  /** Récupère les champs spécifiques du profil (username, avatar_url, timezone, bio) */
  async getProfileFields() {
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('profiles')
      .select('username, avatar_url, timezone, bio, updated_at')
      .eq('id', userId)
      .single()
    return data
  }

  /** Crée un user temporaire pour tester la suppression de compte (GDPR F64) */
  async createTemporaryTestUser(): Promise<{ userId: string; email: string; password: string }> {
    const email = `e2e-delete-test-${Date.now()}@test.invalid`
    const password = 'E2ETest123!'
    const { data, error } = await this.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw new Error(`createTemporaryTestUser failed: ${error.message}`)
    // Créer un profil minimal
    await this.admin.from('profiles').insert({
      id: data.user.id,
      username: `e2e-temp-${Date.now()}`,
      timezone: 'Europe/Paris',
    })
    return { userId: data.user.id, email, password }
  }

  /** Vérifie que toutes les données d'un user ont été supprimées de la DB (8 tables) */
  async verifyUserDataDeleted(userId: string): Promise<{ tables: Record<string, number> }> {
    const results: Record<string, number> = {}
    const tables = [
      { table: 'profiles', column: 'id' },
      { table: 'squad_members', column: 'user_id' },
      { table: 'session_rsvps', column: 'user_id' },
      { table: 'session_checkins', column: 'user_id' },
      { table: 'messages', column: 'user_id' },
      { table: 'direct_messages', column: 'sender_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'ai_insights', column: 'user_id' },
    ]
    for (const { table, column } of tables) {
      const { count } = await this.admin
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(column, userId)
      results[table] = count || 0
    }
    return { tables: results }
  }

  /** Supprime un user temporaire et toutes ses données (cascade sur 9 tables + auth) */
  async deleteTemporaryTestUser(userId: string): Promise<void> {
    const tables = [
      'session_checkins',
      'session_rsvps',
      'messages',
      'direct_messages',
      'party_participants',
      'push_subscriptions',
      'squad_members',
      'ai_insights',
      'profiles',
    ]
    for (const table of tables) {
      const col =
        table === 'profiles' ? 'id' : table === 'direct_messages' ? 'sender_id' : 'user_id'
      await this.admin.from(table).delete().eq(col, userId)
    }
    await this.admin.auth.admin.deleteUser(userId)
  }

  /** Récupère les push_subscriptions d'un user */
  async getPushSubscriptions(userId?: string) {
    const uid = userId || (await this.getUserId())
    const { data } = await this.admin.from('push_subscriptions').select('*').eq('user_id', uid)
    return data || []
  }

  /** Récupère les ai_insights / reminders d'un user */
  async getAiInsights(userId?: string) {
    const uid = userId || (await this.getUserId())
    const { data } = await this.admin
      .from('ai_insights')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
    return data || []
  }

  /** Remet le subscription_tier à sa valeur originale après un test trial */
  private _originalTier: string | null = null

  async saveOriginalTier() {
    if (this._originalTier) return
    const userId = await this.getUserId()
    const { data } = await this.admin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    this._originalTier = data?.subscription_tier || 'club'
  }

  async resetTrialStatus() {
    const userId = await this.getUserId()
    // Restore original tier (default to 'club' since the test user has club access)
    const tier = this._originalTier || 'club'
    await this.admin
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: tier !== 'free' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      })
      .eq('id', userId)
  }
}

// ============================================================
// 4. SHARED FIXTURES
// ============================================================

export const test = base.extend<{
  authenticatedPage: import('@playwright/test').Page
  db: TestDataHelper
}>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const helper = new TestDataHelper(supabaseAdmin)
    await use(helper)
  },
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page)
    // Marquer le guided tour comme complété via localStorage pour éviter l'overlay bloquant
    await page.evaluate(() => {
      localStorage.setItem('sq-tour-completed-v1', 'true')
    })
    await use(page)
  },
})

// ============================================================
// 5. SHARED HELPERS
// ============================================================

export async function dismissCookieBanner(page: import('@playwright/test').Page) {
  try {
    const btn = page.getByRole('button', { name: /Tout accepter/i })
    await btn.waitFor({ state: 'visible', timeout: 5000 })
    await btn.click()
    await page.waitForTimeout(500)
  } catch {
    // Cookie banner not present
  }
}

/** Ferme le guided tour overlay s'il est visible */
export async function dismissTourOverlay(page: import('@playwright/test').Page) {
  try {
    // Le tour overlay utilise une div fixed z-[70] avec un SVG mask
    const tourClose = page.locator(
      'button:has-text("Fermer le guide"), button:has-text("Passer"), button:has-text("Terminer"), button:has-text("Compris"), button[aria-label="Fermer"]'
    )
    if (
      await tourClose
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await tourClose.first().click()
      await page.waitForTimeout(500)
    }
    // Si le tour persiste après le bouton, cliquer l'overlay lui-même
    const overlay = page
      .locator('div.fixed.inset-0[class*="z-"]')
      .filter({ has: page.locator('rect[mask]') })
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      // Presser Escape pour fermer le tour
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
  } catch {
    // No tour overlay
  }
}

export async function loginViaUI(page: import('@playwright/test').Page) {
  await page.goto('/auth')
  await page.waitForSelector('form', { timeout: 15000 })
  await dismissCookieBanner(page)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForURL((url) => !url.pathname.includes('/auth'), {
        timeout: 20000,
        waitUntil: 'domcontentloaded',
      })
      await page.waitForTimeout(1000)
      return
    } catch {
      const rateLimited = await page
        .locator('text=/rate limit/i')
        .isVisible()
        .catch(() => false)
      if (rateLimited && attempt < 2) {
        await page.waitForTimeout(3000 + attempt * 2000)
        await page.click('button[type="submit"]')
      } else {
        throw new Error(`Login failed after ${attempt + 1} attempts`)
      }
    }
  }
}

export async function isAuthenticated(page: import('@playwright/test').Page): Promise<boolean> {
  const url = page.url()
  return !url.includes('/auth') && !url.endsWith('/')
}

/** Vérifie si la page affiche une erreur 500 */
export async function hasServerError(page: import('@playwright/test').Page): Promise<boolean> {
  const has500 = await page
    .getByText(/^500$/)
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false)
  const hasErrText = await page
    .getByText(/Erreur interne du serveur/i)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false)
  return has500 || hasErrText
}

/** Vérifie si la page affiche une erreur réseau et tente un reload */
export async function retryOnNetworkError(
  page: import('@playwright/test').Page,
  maxRetries = 2
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const hasError = await page
      .getByText(/Erreur réseau/i)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    if (!hasError) return true // pas d'erreur
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
  }
  return !(await page
    .getByText(/Erreur réseau/i)
    .first()
    .isVisible({ timeout: 1000 })
    .catch(() => false))
}

/** Navigate to a page. If SSR returns 500, navigate via the sidebar link instead */
export async function navigateWithFallback(
  page: import('@playwright/test').Page,
  path: string
): Promise<boolean> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  if (await hasServerError(page)) {
    // SSR failed — try going to /home first (which works), then click nav link
    await page.goto('/home')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const link = page.locator(`a[href="${path}"]`).first()
    if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
      await link.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
    } else {
      // No nav link found — try simple reload
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
    }

    return !(await hasServerError(page))
  }

  return true
}

/**
 * Accessibility regression helper — runs axe-core WCAG 2.1 AA audit
 * Returns critical/serious violations. Use in any E2E test to guard against a11y regressions.
 */
export async function checkAccessibility(
  page: import('@playwright/test').Page,
  options?: { tags?: string[]; excludeSelectors?: string[]; disableRules?: string[] }
) {
  let builder = new AxeBuilder({ page }).withTags(
    options?.tags || ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
  )

  if (options?.excludeSelectors) {
    for (const selector of options.excludeSelectors) {
      builder = builder.exclude(selector)
    }
  }

  if (options?.disableRules) {
    builder = builder.disableRules(options.disableRules)
  }

  const results = await builder.analyze()

  const seriousViolations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )

  return {
    violations: seriousViolations,
    totalViolations: results.violations.length,
    passes: results.passes.length,
  }
}

export { expect }
