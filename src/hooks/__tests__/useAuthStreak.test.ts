import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
  }
  return { mockFrom, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

import { updateDailyStreak } from '../useAuthStreak'
import type { Profile } from '../../types/database'

// Helper: build a minimal Profile for testing
function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    username: 'testuser',
    email: null,
    avatar_url: null,
    bio: null,
    timezone: null,
    reliability_score: 1,
    total_sessions: 0,
    total_checkins: 0,
    total_noshow: 0,
    total_late: 0,
    xp: 0,
    level: 1,
    streak_days: 0,
    streak_last_date: null,
    subscription_tier: 'free',
    subscription_expires_at: null,
    stripe_customer_id: null,
    region: null,
    preferred_games: [],
    looking_for_squad: false,
    playstyle: null,
    twitch_username: null,
    discord_username: null,
    status_text: null,
    status_emoji: null,
    status_expires_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// Helper: build supabase chain for update
function mockUpdateChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)
  return chain
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function twoDaysAgoStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 2)
  return d.toISOString().split('T')[0]
}

describe('updateDailyStreak', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  // ===== NULL PROFILE =====
  it('returns null when profile is null', async () => {
    const result = await updateDailyStreak('user-1', null)
    expect(result).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // ===== SAME-DAY NO-OP =====
  it('returns the same profile when already updated today (no-op)', async () => {
    const profile = makeProfile({ streak_last_date: todayStr(), streak_days: 5 })
    const result = await updateDailyStreak('user-1', profile)
    expect(result).toBe(profile)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // ===== STREAK CONTINUATION (yesterday -> today) =====
  it('continues streak when last date was yesterday', async () => {
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 3, xp: 50 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 4, xp: 60 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    expect(result).toEqual(updatedProfile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 4, xp: 60 }))
  })

  // ===== STREAK RESET (gap > 1 day) =====
  it('resets streak to 1 when gap is more than one day', async () => {
    const profile = makeProfile({ streak_last_date: twoDaysAgoStr(), streak_days: 10, xp: 200 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 1, xp: 210 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    expect(result).toEqual(updatedProfile)
    // streak resets to 1, xp bonus = 10 (default)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 1, xp: 210 }))
  })

  // ===== STREAK RESET (no previous date) =====
  it('starts streak at 1 when streak_last_date is null', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 1, xp: 10 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    expect(result).toEqual(updatedProfile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 1, xp: 10 }))
  })

  // ===== XP MILESTONE: 7 days =====
  it('grants 100 XP bonus at 7-day streak milestone', async () => {
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 6, xp: 500 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 7, xp: 600 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 7, xp: 600 }))
  })

  // ===== XP MILESTONE: 14 days =====
  it('grants 200 XP bonus at 14-day streak milestone', async () => {
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 13, xp: 1000 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 14, xp: 1200 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ streak_days: 14, xp: 1200 })
    )
  })

  // ===== XP MILESTONE: 30 days =====
  it('grants 500 XP bonus at 30-day streak milestone', async () => {
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 29, xp: 2000 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 30, xp: 2500 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ streak_days: 30, xp: 2500 })
    )
  })

  // ===== XP MILESTONE: 100 days =====
  it('grants 1000 XP bonus at 100-day streak milestone', async () => {
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 99, xp: 5000 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 100, xp: 6000 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ streak_days: 100, xp: 6000 })
    )
  })

  // ===== XP BONUS: every 7 days (non-milestone) =====
  it('grants 50 XP bonus at multiples of 7 that are not milestone days', async () => {
    // Day 21 = 7*3, not 7/14/30/100 => 50 XP bonus
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 20, xp: 300 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 21, xp: 350 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 21, xp: 350 }))
  })

  // ===== DEFAULT XP BONUS (10) =====
  it('grants default 10 XP bonus on normal streak day', async () => {
    // Day 4 continuation, not a multiple of 7
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 3, xp: 100 })
    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 4, xp: 110 })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 4, xp: 110 }))
  })

  // ===== LEVEL CALCULATION =====
  it('calculates correct level from LEVEL_THRESHOLDS', async () => {
    // XP of 260 (250 + 10 from bonus) should be level 3 (threshold at 250)
    const profile = makeProfile({ streak_last_date: yesterdayStr(), streak_days: 1, xp: 250 })
    const updatedProfile = makeProfile({
      streak_last_date: todayStr(),
      streak_days: 2,
      xp: 260,
      level: 3,
    })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    // XP = 250 + 10 = 260 >= 250 (threshold index 2), so level = 3
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ xp: 260, level: 3 }))
  })

  it('calculates level 1 for low XP', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const updatedProfile = makeProfile({
      streak_last_date: todayStr(),
      streak_days: 1,
      xp: 10,
      level: 1,
    })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    // XP = 0 + 10 = 10 >= 0 (threshold index 0), so level = 1
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ xp: 10, level: 1 }))
  })

  it('calculates high level for high XP', async () => {
    // XP = 20000 + 10 = 20010. Threshold[11] = 20000 => level 12
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 20000 })
    const updatedProfile = makeProfile({
      streak_last_date: todayStr(),
      streak_days: 1,
      xp: 20010,
      level: 12,
    })

    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ xp: 20010, level: 12 }))
  })

  // ===== SUPABASE ERROR =====
  it('returns original profile and warns on Supabase error', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const chain = mockUpdateChain({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    expect(result).toBe(profile)
    expect(warnSpy).toHaveBeenCalledWith('Failed to update streak:', { message: 'DB error' })
  })

  // ===== SUPABASE RETURNS NULL DATA (no error) =====
  it('returns original profile when updatedProfile is null but no error', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const chain = mockUpdateChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    // updatedProfile is null, so it falls through to `updatedProfile || profile`
    expect(result).toBe(profile)
  })

  // ===== HANDLES NULL XP AND STREAK_DAYS =====
  it('handles profile with null xp and streak_days gracefully', async () => {
    const profile = makeProfile({
      streak_last_date: yesterdayStr(),
      streak_days: 0,
      xp: 0,
    })
    // Override to simulate null-ish values via casting
    ;(profile as any).xp = null as unknown as number
    ;(profile as any).streak_days = null as unknown as number

    const updatedProfile = makeProfile({ streak_last_date: todayStr(), streak_days: 1, xp: 10 })
    const chain = mockUpdateChain({ data: updatedProfile, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await updateDailyStreak('user-1', profile)
    expect(result).toEqual(updatedProfile)
    // (null || 0) + 1 = 1 for streak_days
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ streak_days: 1, xp: 10 }))
  })

  // ===== TODAY STRING SET CORRECTLY =====
  it('sets streak_last_date to today', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const chain = mockUpdateChain({ data: makeProfile(), error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ streak_last_date: todayStr() })
    )
  })

  // ===== CALLS SUPABASE CORRECTLY =====
  it('calls supabase.from(profiles).update().eq().select().single()', async () => {
    const profile = makeProfile({ streak_last_date: null, streak_days: 0, xp: 0 })
    const chain = mockUpdateChain({ data: makeProfile(), error: null })
    mockFrom.mockReturnValue(chain)

    await updateDailyStreak('user-1', profile)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(chain.update).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'user-1')
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })
})
