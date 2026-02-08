import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Squad, SquadMember } from '../types/database'
import { sendMemberJoinedMessage, sendMemberLeftMessage } from '../lib/systemMessages'

interface SquadWithMembers extends Squad {
  members?: (SquadMember & { profiles?: { username?: string; avatar_url?: string; reliability_score?: number } })[]
  member_count?: number
}

interface SquadsState {
  squads: SquadWithMembers[]
  currentSquad: SquadWithMembers | null
  isLoading: boolean
  lastFetchedAt: number | null

  // Actions
  fetchSquads: (force?: boolean) => Promise<void>
  fetchSquadById: (id: string) => Promise<SquadWithMembers | null>
  createSquad: (data: { name: string; game: string }) => Promise<{ squad: Squad | null; error: Error | null }>
  joinSquad: (inviteCode: string) => Promise<{ error: Error | null }>
  leaveSquad: (squadId: string) => Promise<{ error: Error | null }>
  deleteSquad: (squadId: string) => Promise<{ error: Error | null }>
  setCurrentSquad: (squad: SquadWithMembers | null) => void
}

// Cache duration in ms (30 seconds)
const CACHE_DURATION = 30 * 1000

// In-flight request tracking to prevent duplicate concurrent requests
let inFlightFetchSquads: Promise<void> | null = null

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
  lastFetchedAt: null,

  fetchSquads: async (force = false) => {
    const state = get()

    // Return cached data if still fresh (unless force refresh)
    if (!force && state.lastFetchedAt && Date.now() - state.lastFetchedAt < CACHE_DURATION) {
      return
    }

    // Deduplicate concurrent requests
    if (inFlightFetchSquads) {
      return inFlightFetchSquads
    }

    const fetchPromise = (async () => {
      try {
        set({ isLoading: true })

        // Get user's squads with member count in a single query
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
          set({ squads: [], isLoading: false, lastFetchedAt: Date.now() })
          return
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

        const squadsWithCount: SquadWithMembers[] = uniqueSquads.map(squad => ({
          ...squad,
          member_count: countBySquad[squad.id] || 0
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        set({ squads: squadsWithCount, isLoading: false, lastFetchedAt: Date.now() })
      } catch (error) {
        console.error('Error fetching squads:', error)
        set({ isLoading: false })
      } finally {
        inFlightFetchSquads = null
      }
    })()

    inFlightFetchSquads = fetchPromise
    return fetchPromise
  },

  fetchSquadById: async (id: string) => {
    try {
      set({ isLoading: true, currentSquad: null })

      const { data: squad, error } = await supabase
        .from('squads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get members with profiles (including avatar_url and reliability_score)
      const { data: members } = await supabase
        .from('squad_members')
        .select('*, profiles(username, avatar_url, reliability_score)')
        .eq('squad_id', id)

      const squadWithMembers: SquadWithMembers = {
        ...squad,
        members: members || [],
        member_count: members?.length || 0
      }

      set({ currentSquad: squadWithMembers, isLoading: false })
      return squadWithMembers
    } catch (error) {
      console.error('Error fetching squad:', error)
      set({ isLoading: false })
      return null
    }
  },

  createSquad: async ({ name, game }) => {
    try {
      set({ isLoading: true })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // CRITICAL: Ensure profile exists before creating squad (foreign key constraint)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('Impossible de créer le profil. Veuillez réessayer.')
        }
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

      // Add creator as leader member
      const { error: memberError } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
          role: 'leader' as const,
        })

      if (memberError) throw memberError

      // Refresh squads list in background (don't block)
      get().fetchSquads().catch(console.error)

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

      // CRITICAL: Ensure profile exists before joining squad (foreign key constraint)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('Impossible de créer le profil. Veuillez réessayer.')
        }
      }

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

      // Récupérer le username pour le message système
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // Envoyer le message système "X a rejoint la squad"
      if (profile?.username) {
        sendMemberJoinedMessage(squad.id, profile.username).catch(console.error)
      }

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

      // Récupérer le username avant de quitter pour le message système
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // Envoyer le message système AVANT de quitter (sinon on n'a plus accès)
      if (profile?.username) {
        await sendMemberLeftMessage(squadId, profile.username)
      }

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
