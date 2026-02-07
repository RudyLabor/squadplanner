/**
 * PRIORITE 1 - React Query hook for Challenges
 *
 * Centralizes all challenges and user_challenges fetching with caching.
 * Query key: ['challenges', userId]
 *
 * Replaces direct supabase calls:
 * - .from('challenges').select(...)
 * - .from('user_challenges').select(...)
 * - .from('seasonal_badges').select(...)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthUserQuery } from './useAuthQuery'

// Re-export types from Challenges component for consistency
export type { Challenge, UserChallenge } from '../../components/Challenges'

export interface SeasonalBadge {
  id: string
  user_id: string
  badge_type: string
  season: string
  squad_id: string | null
  awarded_at: string
  squads?: { name: string } | null
}

// Database row type (different from display type)
// Note: Database column is 'type', not 'challenge_type'
interface DbChallenge {
  id: string
  title: string
  description: string | null
  xp_reward: number
  type: 'daily' | 'weekly' | 'seasonal' | 'achievement'
  icon: string | null
  requirements: {
    type: string
    count?: number
    score?: number
  } | null
  is_active: boolean
  created_at: string
}

interface DbUserChallenge {
  challenge_id: string
  progress: number
  target: number | null
  completed_at: string | null
  xp_claimed: boolean
}

export interface ChallengesData {
  challenges: DbChallenge[]
  userChallenges: DbUserChallenge[]
  badges: SeasonalBadge[]
}

// Fetch challenges with user progress
async function fetchChallenges(userId: string): Promise<ChallengesData> {
  const [challengesRes, userChallengesRes, badgesRes] = await Promise.all([
    supabase.from('challenges').select('*').eq('is_active', true),
    supabase.from('user_challenges').select('*').eq('user_id', userId),
    supabase
      .from('seasonal_badges')
      .select('id, user_id, badge_type, season, squad_id, awarded_at, squads(name)')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false }),
  ])

  if (challengesRes.error) throw challengesRes.error
  if (userChallengesRes.error) throw userChallengesRes.error
  if (badgesRes.error) throw badgesRes.error

  // Map badges to handle the squads relation (Supabase returns array for relations)
  const badges: SeasonalBadge[] = (badgesRes.data || []).map((badge: {
    id: string
    user_id: string
    badge_type: string
    season: string
    squad_id: string | null
    awarded_at: string
    squads: { name: string }[] | { name: string } | null
  }) => ({
    id: badge.id,
    user_id: badge.user_id,
    badge_type: badge.badge_type,
    season: badge.season,
    squad_id: badge.squad_id,
    awarded_at: badge.awarded_at,
    // Handle both array and single object relations
    squads: Array.isArray(badge.squads) ? badge.squads[0] || null : badge.squads,
  }))

  return {
    challenges: challengesRes.data || [],
    userChallenges: (userChallengesRes.data || []).map(uc => ({
      challenge_id: uc.challenge_id,
      progress: uc.progress,
      target: uc.target || 1,
      completed_at: uc.completed_at,
      xp_claimed: uc.xp_claimed,
    })),
    badges,
  }
}

/**
 * Hook to fetch all challenges with user progress
 * Query key: ['challenges', userId]
 */
export function useChallengesQuery() {
  const { data: user } = useAuthUserQuery()

  return useQuery({
    queryKey: ['challenges', user?.id] as const,
    queryFn: () => user?.id ? fetchChallenges(user.id) : { challenges: [], userChallenges: [], badges: [] },
    enabled: !!user?.id,
    staleTime: 60_000, // 1 minute - challenges don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Mutation to claim XP for a completed challenge
 */
export function useClaimChallengeXPMutation() {
  const queryClient = useQueryClient()
  const { data: user } = useAuthUserQuery()

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error('Not authenticated')

      // Get challenge XP reward
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('xp_reward')
        .eq('id', challengeId)
        .single()

      if (challengeError || !challenge) throw new Error('Challenge not found')

      // Mark XP as claimed
      const { error: claimError } = await supabase
        .from('user_challenges')
        .update({ xp_claimed: true })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)

      if (claimError) throw claimError

      // Award XP to user profile - try RPC first, fallback to direct update
      const { error: xpError } = await supabase.rpc('add_xp', {
        p_user_id: user.id,
        p_amount: challenge.xp_reward,
        p_reason: `Challenge: ${challengeId}`,
        p_source_type: 'challenge',
        p_source_id: challengeId,
      })

      // If RPC fails, fallback to direct profile update
      if (xpError) {
        console.warn('XP RPC failed, using direct update:', xpError.message)

        // Get current XP and calculate new level
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', user.id)
          .single()

        if (profile) {
          const newXP = (profile.xp || 0) + challenge.xp_reward
          // Level thresholds: 0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, ...
          const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000]
          let newLevel = 1
          for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (newXP >= levelThresholds[i]) {
              newLevel = i + 1
              break
            }
          }

          await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel })
            .eq('id', user.id)
        }
      }

      return challenge.xp_reward
    },
    onSuccess: () => {
      // Invalidate challenges to refresh the list
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      // Also invalidate profile in case XP/level changed
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
