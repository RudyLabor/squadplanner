/**
 * Tests for src/lib/challengeTracker.ts
 * Covers: trackChallengeProgress (fire-and-forget helper)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock supabaseMinimal — must be before the import under test
// ---------------------------------------------------------------------------
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
})

vi.mock('../supabaseMinimal', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

import { trackChallengeProgress } from '../challengeTracker'
import { isSupabaseReady } from '../supabaseMinimal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupChallenges(
  challenges: Array<{ id: string; requirements: { type: string; count?: number } }>,
  existing: Array<{
    id: string
    challenge_id: string
    progress: number
    target: number
    completed_at: string | null
  }> = []
) {
  // challenges query chain: from('challenges').select(...).eq(...)
  mockSelect.mockReturnValueOnce({
    eq: vi.fn().mockResolvedValue({ data: challenges, error: null }),
  })

  // user_challenges query chain: from('user_challenges').select(...).eq(...).in(...)
  mockSelect.mockReturnValueOnce({
    eq: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({ data: existing, error: null }),
    }),
  })

  // update/insert return resolved promises
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  })
  mockInsert.mockResolvedValue({ data: null, error: null })
}

describe('challengeTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isSupabaseReady).mockReturnValue(true)
  })

  // =========================================================================
  // Guard clauses
  // =========================================================================
  it('should return early if supabase is not ready', async () => {
    vi.mocked(isSupabaseReady).mockReturnValue(false)
    await trackChallengeProgress('user-1', 'session_join')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('should return early if challenges query errors', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    })

    await trackChallengeProgress('user-1', 'session_join')
    // Should only call from('challenges'), not from('user_challenges')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('should return early if no matching challenges found', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'ch-1', requirements: { type: 'other_action', count: 5 } }],
        error: null,
      }),
    })

    await trackChallengeProgress('user-1', 'session_join')
    // Only 1 call to from('challenges'), no from('user_challenges')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  // =========================================================================
  // Insert new user_challenges entry
  // =========================================================================
  it('should insert a new user_challenges entry when none exists', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 3 } }],
      [] // no existing user_challenges
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockFrom).toHaveBeenCalledWith('user_challenges')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        challenge_id: 'ch-1',
        progress: 1,
        target: 3,
      })
    )
  })

  it('should mark completed immediately if target is 1 and inserting', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 1 } }],
      []
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 1,
        target: 1,
        completed_at: expect.any(String),
      })
    )
  })

  it('should default target to 1 when count is missing in requirements', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join' } }], // no count
      []
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 1,
        progress: 1,
        completed_at: expect.any(String), // 1 >= 1 so completed
      })
    )
  })

  // =========================================================================
  // Update existing user_challenges
  // =========================================================================
  it('should update progress for existing user_challenge', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 5 } }],
      [{ id: 'uc-1', challenge_id: 'ch-1', progress: 2, target: 5, completed_at: null }]
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 3,
        updated_at: expect.any(String),
      })
    )
  })

  it('should mark completed when progress reaches target', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 3 } }],
      [{ id: 'uc-1', challenge_id: 'ch-1', progress: 2, target: 3, completed_at: null }]
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 3,
        completed_at: expect.any(String),
      })
    )
  })

  it('should skip already completed challenges', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 3 } }],
      [
        {
          id: 'uc-1',
          challenge_id: 'ch-1',
          progress: 3,
          target: 3,
          completed_at: '2026-01-01T00:00:00.000Z',
        },
      ]
    )

    await trackChallengeProgress('user-1', 'session_join')

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should cap progress at target (not exceed)', async () => {
    setupChallenges(
      [{ id: 'ch-1', requirements: { type: 'session_join', count: 2 } }],
      [{ id: 'uc-1', challenge_id: 'ch-1', progress: 2, target: 2, completed_at: null }]
    )

    await trackChallengeProgress('user-1', 'session_join')

    // Math.min(2+1, 2) = 2 and completed
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 2,
        completed_at: expect.any(String),
      })
    )
  })

  // =========================================================================
  // Error handling
  // =========================================================================
  it('should catch and log errors without throwing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockRejectedValue(new Error('Network failure')),
    })

    await expect(trackChallengeProgress('user-1', 'session_join')).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(
      '[ChallengeTracker] Error tracking progress:',
      expect.any(Error)
    )
    warnSpy.mockRestore()
  })
})
