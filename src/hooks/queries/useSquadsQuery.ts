/**
 * PHASE 1.1 - React Query hooks for Squads
 *
 * These hooks replace the manual fetching in useSquads.ts with
 * React Query for automatic caching and deduplication.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryClient'
import type { Squad, SquadMember } from '../../types/database'
import { showSuccess, showError } from '../../lib/toast'
import { sendMemberJoinedMessage, sendMemberLeftMessage } from '../../lib/systemMessages'

export interface SquadWithMembers extends Squad {
  members?: (SquadMember & { profiles?: { username?: string; avatar_url?: string; reliability_score?: number } })[]
  member_count?: number
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Fetch all squads for the current user
async function fetchSquads(): Promise<SquadWithMembers[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('squad_members')
    .select(`
      squad_id,
      squads!inner (
        id,
        name,
        game,
        invite_code,
        owner_id,
        created_at
      )
    `)

  if (memberError) throw memberError

  if (!memberships || memberships.length === 0) {
    return []
  }

  // Extract unique squads and get member counts in parallel
  const squadIds = [...new Set(memberships.map(m => m.squad_id))]
  const squadsData = memberships.map(m => m.squads as unknown as Squad)
  const uniqueSquads = squadIds.map(id => squadsData.find(s => s.id === id)!).filter(Boolean)

  // Get all member counts in one query
  const { data: memberCounts } = await supabase
    .from('squad_members')
    .select('squad_id')
    .in('squad_id', squadIds)

  // Count members per squad
  const countBySquad: Record<string, number> = {}
  memberCounts?.forEach(m => {
    countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
  })

  return uniqueSquads
    .map(squad => ({
      ...squad,
      member_count: countBySquad[squad.id] || 0
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Fetch a single squad with members
async function fetchSquadById(id: string): Promise<SquadWithMembers | null> {
  const { data: squad, error } = await supabase
    .from('squads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  // Get members with profiles
  const { data: members } = await supabase
    .from('squad_members')
    .select('*, profiles(username, avatar_url, reliability_score)')
    .eq('squad_id', id)

  return {
    ...squad,
    members: members || [],
    member_count: members?.length || 0
  }
}

/**
 * Hook to fetch all squads for the current user
 * Uses React Query for automatic caching and deduplication
 */
export function useSquadsQuery() {
  return useQuery({
    queryKey: queryKeys.squads.list(),
    queryFn: fetchSquads,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch a single squad by ID
 */
export function useSquadQuery(squadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.squads.detail(squadId ?? ''),
    queryFn: () => squadId ? fetchSquadById(squadId) : null,
    enabled: !!squadId,
    staleTime: 30 * 1000,
  })
}

/**
 * Mutation to create a new squad
 */
export function useCreateSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, game }: { name: string; game: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (profileError) throw new Error('Impossible de créer le profil')
      }

      const inviteCode = generateInviteCode()

      // Create squad
      const { data: squad, error: squadError } = await supabase
        .from('squads')
        .insert({
          name,
          game,
          owner_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single()

      if (squadError) throw squadError

      // Add creator as leader
      await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'leader' as const,
        })

      return squad
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Squad créée avec succès !')
    },
    onError: (error) => {
      showError(error.message || 'Erreur lors de la création')
    },
  })
}

/**
 * Mutation to join a squad by invite code
 */
export function useJoinSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        if (profileError) throw new Error('Impossible de créer le profil')
      }

      // Find squad
      const { data: squad, error: findError } = await supabase
        .from('squads')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (findError || !squad) throw new Error('Code d\'invitation invalide')

      // Check if already member
      const { data: existing } = await supabase
        .from('squad_members')
        .select('id')
        .eq('squad_id', squad.id)
        .eq('user_id', user.id)
        .single()

      if (existing) throw new Error('Tu fais déjà partie de cette squad')

      // Join squad
      const { error: joinError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'member' as const,
        })

      if (joinError) throw joinError

      // Send system message
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        sendMemberJoinedMessage(squad.id, profile.username).catch(console.error)
      }

      return squad.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Tu as rejoint la squad !')
    },
    onError: (error) => {
      showError(error.message || 'Impossible de rejoindre la squad')
    },
  })
}

/**
 * Mutation to leave a squad
 */
export function useLeaveSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (squadId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get username for system message
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // Send system message BEFORE leaving
      if (profile?.username) {
        await sendMemberLeftMessage(squadId, profile.username)
      }

      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Tu as quitté la squad')
    },
    onError: (error) => {
      showError(error.message || 'Impossible de quitter la squad')
    },
  })
}

/**
 * Mutation to delete a squad
 */
export function useDeleteSquadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (squadId: string) => {
      const { error } = await supabase
        .from('squads')
        .delete()
        .eq('id', squadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.squads.all })
      showSuccess('Squad supprimée')
    },
    onError: (error) => {
      showError(error.message || 'Impossible de supprimer la squad')
    },
  })
}
