import { supabase, isSupabaseReady } from './supabase'

/**
 * Track progress for challenges matching a given action type.
 *
 * Finds all active challenges whose requirements.type matches `actionType`,
 * upserts a user_challenges row (creating it if absent), increments progress,
 * and marks the challenge completed when progress >= target.
 *
 * This is a fire-and-forget helper — errors are logged but never thrown
 * so callers don't need to handle failures.
 */
export async function trackChallengeProgress(
  userId: string,
  actionType: string
): Promise<void> {
  if (!isSupabaseReady()) return
  try {
    // 1. Find matching active challenges
    const { data: challenges, error: chErr } = await supabase
      .from('challenges')
      .select('id, requirements')
      .eq('is_active', true)

    if (chErr || !challenges) return

    const matching = challenges.filter((c) => {
      const req = c.requirements as { type?: string; count?: number } | null
      return req?.type === actionType
    })

    if (matching.length === 0) return

    // 2. Fetch existing user_challenges for these challenge IDs
    const challengeIds = matching.map((c) => c.id)
    const { data: existing } = await supabase
      .from('user_challenges')
      .select('id, challenge_id, progress, target, completed_at')
      .eq('user_id', userId)
      .in('challenge_id', challengeIds)

    const existingMap = new Map(
      (existing || []).map((uc) => [uc.challenge_id, uc])
    )

    // 3. For each matching challenge, upsert progress
    for (const challenge of matching) {
      const req = challenge.requirements as { count?: number }
      const target = req?.count ?? 1
      const uc = existingMap.get(challenge.id)

      if (uc) {
        // Already completed — skip
        if (uc.completed_at) continue

        const newProgress = Math.min(uc.progress + 1, target)
        const completed = newProgress >= target

        await supabase
          .from('user_challenges')
          .update({
            progress: newProgress,
            ...(completed ? { completed_at: new Date().toISOString() } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', uc.id)
      } else {
        // Create new user_challenges entry
        const newProgress = 1
        const completed = newProgress >= target

        await supabase.from('user_challenges').insert({
          user_id: userId,
          challenge_id: challenge.id,
          progress: newProgress,
          target,
          ...(completed ? { completed_at: new Date().toISOString() } : {}),
        })
      }
    }
  } catch (err) {
    console.warn('[ChallengeTracker] Error tracking progress:', err)
  }
}
