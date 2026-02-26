import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'
import { queryKeys } from '../../lib/queryClient'
import { useAuthStore } from '../useAuth'
import type { Squad, SquadMember } from '../../types/database'

export {
  useCreateSquadMutation,
  useJoinSquadMutation,
  useUpdateSquadMutation,
  useLeaveSquadMutation,
  useDeleteSquadMutation,
} from './useSquadsMutations'

export interface SquadWithMembers extends Squad {
  members?: (SquadMember & {
    profiles?: { username?: string; avatar_url?: string; reliability_score?: number }
  })[]
  member_count?: number
}

async function fetchSquads(userId: string): Promise<SquadWithMembers[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('squad_members')
    .select(
      `
      squad_id,
      squads!inner (
        id,
        name,
        game,
        invite_code,
        owner_id,
        total_members,
        created_at
      )
    `
    )
    .eq('user_id', userId)

  if (memberError) throw memberError

  if (!memberships || memberships.length === 0) {
    return []
  }

  const squadIds = [...new Set(memberships.map((m) => m.squad_id))]
  const squadsData = memberships.map((m) => m.squads as unknown as Squad)
  const uniqueSquads = squadIds.map((id) => squadsData.find((s) => s.id === id)!).filter(Boolean)

  // Fetch actual member counts per squad (total_members column may be stale/null)
  const memberCountMap = new Map<string, number>()
  if (squadIds.length > 0) {
    const { data: allMembers } = await supabase
      .from('squad_members')
      .select('squad_id')
      .in('squad_id', squadIds)
    if (allMembers) {
      for (const m of allMembers) {
        memberCountMap.set(m.squad_id, (memberCountMap.get(m.squad_id) || 0) + 1)
      }
    }
  }

  return uniqueSquads
    .map((squad) => ({
      ...squad,
      member_count: memberCountMap.get(squad.id) ?? (squad as unknown as { total_members?: number }).total_members ?? 0,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

async function fetchSquadById(id: string): Promise<SquadWithMembers | null> {
  const { data: squad, error } = await supabase.from('squads').select('*').eq('id', id).single()

  if (error) throw error

  const { data: members } = await supabase
    .from('squad_members')
    .select('*, profiles(username, avatar_url, reliability_score)')
    .eq('squad_id', id)

  return {
    ...squad,
    members: members || [],
    member_count: members?.length ?? 0,
  }
}

export function useSquadsQuery() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: queryKeys.squads.list(),
    queryFn: () => fetchSquads(user!.id),
    staleTime: 30 * 1000,
    // Guard: don't fetch until auth is ready
    enabled: !!user,
  })
}

export function useSquadQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.squads.detail(squadId ?? ''),
    queryFn: () => (squadId ? fetchSquadById(squadId) : null),
    enabled: !!squadId,
    staleTime: 30 * 1000,
  })
}
