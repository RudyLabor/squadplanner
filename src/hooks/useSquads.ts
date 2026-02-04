import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Squad, SquadMember } from '../types/database'

interface SquadWithMembers extends Squad {
  members?: (SquadMember & { profiles?: { username?: string } })[]
  member_count?: number
}

interface SquadsState {
  squads: SquadWithMembers[]
  currentSquad: SquadWithMembers | null
  isLoading: boolean
  
  // Actions
  fetchSquads: () => Promise<void>
  fetchSquadById: (id: string) => Promise<SquadWithMembers | null>
  createSquad: (data: { name: string; game: string }) => Promise<{ squad: Squad | null; error: Error | null }>
  joinSquad: (inviteCode: string) => Promise<{ error: Error | null }>
  leaveSquad: (squadId: string) => Promise<{ error: Error | null }>
  deleteSquad: (squadId: string) => Promise<{ error: Error | null }>
  setCurrentSquad: (squad: SquadWithMembers | null) => void
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

export const useSquadsStore = create<SquadsState>((set, get) => ({
  squads: [],
  currentSquad: null,
  isLoading: false,

  fetchSquads: async () => {
    try {
      set({ isLoading: true })
      
      // Get user's squads through squad_members
      const { data: memberships, error: memberError } = await supabase
        .from('squad_members')
        .select('squad_id')
      
      if (memberError) throw memberError
      
      if (!memberships || memberships.length === 0) {
        set({ squads: [], isLoading: false })
        return
      }

      const squadIds = memberships.map(m => m.squad_id)
      
      // Fetch squads with member count
      const { data: squads, error } = await supabase
        .from('squads')
        .select('*')
        .in('id', squadIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts separately
      const squadsWithCount: SquadWithMembers[] = []
      for (const squad of squads || []) {
        const { count } = await supabase
          .from('squad_members')
          .select('*', { count: 'exact', head: true })
          .eq('squad_id', squad.id)
        
        squadsWithCount.push({
          ...squad,
          member_count: count || 0
        })
      }

      set({ squads: squadsWithCount, isLoading: false })
    } catch (error) {
      console.error('Error fetching squads:', error)
      set({ isLoading: false })
    }
  },

  fetchSquadById: async (id: string) => {
    try {
      const { data: squad, error } = await supabase
        .from('squads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get members with profiles
      const { data: members } = await supabase
        .from('squad_members')
        .select('*, profiles(username)')
        .eq('squad_id', id)

      const squadWithMembers: SquadWithMembers = {
        ...squad,
        members: members || [],
        member_count: members?.length || 0
      }

      set({ currentSquad: squadWithMembers })
      return squadWithMembers
    } catch (error) {
      console.error('Error fetching squad:', error)
      return null
    }
  },

  createSquad: async ({ name, game }) => {
    try {
      set({ isLoading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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

      // Add creator as leader member
      const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'leader' as const,
        })

      if (memberError) throw memberError

      // Refresh squads list
      await get().fetchSquads()
      
      set({ isLoading: false })
      return { squad, error: null }
    } catch (error) {
      set({ isLoading: false })
      return { squad: null, error: error as Error }
    }
  },

  joinSquad: async (inviteCode: string) => {
    try {
      set({ isLoading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find squad by invite code
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

      await get().fetchSquads()
      set({ isLoading: false })
      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  leaveSquad: async (squadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchSquads()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  deleteSquad: async (squadId: string) => {
    try {
      const { error } = await supabase
        .from('squads')
        .delete()
        .eq('id', squadId)

      if (error) throw error

      await get().fetchSquads()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  setCurrentSquad: (squad) => set({ currentSquad: squad }),
}))
