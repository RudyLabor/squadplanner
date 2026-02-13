import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'
import { queryKeys } from '../../lib/queryClient'
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

async function fetchSquads(): Promise<SquadWithMembers[]> {
  const { data: memberships, error: memberError } = await supabase.from('squad_members').select(`
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
    `)

  if (memberError) throw memberError

  if (!memberships || memberships.length === 0) {
    return []
  }

  const squadIds = [...new Set(memberships.map((m) => m.squad_id))]
  const squadsData = memberships.map((m) => m.squads as unknown as Squad)
  const uniqueSquads = squadIds.map((id) => squadsData.find((s) => s.id === id)!).filter(Boolean)

  return uniqueSquads
    .map((squad) => ({
      ...squad,
      member_count: (squad as any).total_members ?? 1,
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
  return useQuery({
    queryKey: queryKeys.squads.list(),
    queryFn: fetchSquads,
    staleTime: 30 * 1000,
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
