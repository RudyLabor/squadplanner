import { test as base, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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
const hasServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================
// 3. TestDataHelper — requêtes DB pour validation E2E
// ============================================================
export class TestDataHelper {
  private admin: SupabaseClient
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
      .select('squad_id, role, squads!inner(id, name, game, invite_code, owner_id, total_members, is_public, created_at)')
      .eq('user_id', userId)
    return (data || []) as Array<{
      squad_id: string
      role: string
      squads: { id: string; name: string; game: string; invite_code: string; owner_id: string; total_members: number; is_public: boolean; created_at: string }
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

  // --- Discover ---
  async getPublicSquads(game?: string, region?: string) {
    let query = this.admin.from('squads').select('*').eq('is_public', true).order('total_members', { ascending: false }).limit(20)
    if (game) query = query.ilike('game', `%${game}%`)
    if (region) query = query.eq('region', region)
    const { data } = await query
    return data || []
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
        await this.admin.from('squad_members').delete().eq('squad_id', sq.id)
        await this.admin.from('sessions').delete().eq('squad_id', sq.id)
        await this.admin.from('squads').delete().eq('id', sq.id)
      }
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
    if (error) throw new Error(`createTestSquad failed: ${error.message}`)
    await this.admin.from('squad_members').insert({ squad_id: data.id, user_id: userId, role: 'leader' })
    return data
  }

  async deleteTestSquad(squadId: string) {
    await this.admin.from('squads').delete().eq('id', squadId)
  }

  async createTestSession(squadId: string, overrides: Partial<{ title: string; scheduled_at: string; duration_minutes: number }> = {}) {
    const userId = await this.getUserId()
    const { data, error } = await this.admin
      .from('sessions')
      .insert({
        squad_id: squadId,
        title: overrides.title || `E2E Test Session ${Date.now()}`,
        scheduled_at: overrides.scheduled_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: overrides.duration_minutes || 120,
        created_by: userId,
        status: 'proposed',
      })
      .select()
      .single()
    if (error) throw new Error(`createTestSession failed: ${error.message}`)
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
    await btn.waitFor({ state: 'visible', timeout: 3000 })
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
    if (await tourClose.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await tourClose.first().click()
      await page.waitForTimeout(500)
    }
    // Si le tour persiste après le bouton, cliquer l'overlay lui-même
    const overlay = page.locator('div.fixed.inset-0[class*="z-"]').filter({ has: page.locator('rect[mask]') })
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
      await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 20000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      return
    } catch {
      const rateLimited = await page.locator('text=/rate limit/i').isVisible().catch(() => false)
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

export { expect }
