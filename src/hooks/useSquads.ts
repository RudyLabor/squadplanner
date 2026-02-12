import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Squad, SquadMember } from '../types/database'
import { createSquadAction, joinSquadAction, leaveSquadAction } from './useSquadActions'

interface SquadWithMembers extends Squad {
  members?: (SquadMember & {
    profiles?: { username?: string; avatar_url?: string; reliability_score?: number }
  })[]
  member_count?: number
}

interface SquadsState {
  squads: SquadWithMembers[]
  currentSquad: SquadWithMembers | null
  isLoading: boolean
  lastFetchedAt: number | null
  fetchSquads: (force?: boolean) => Promise<void>
  fetchSquadById: (id: string) => Promise<SquadWithMembers | null>
  createSquad: (data: {
    name: string
    game: string
  }) => Promise<{ squad: Squad | null; error: Error | null }>
  joinSquad: (inviteCode: string) => Promise<{ error: Error | null }>
  leaveSquad: (squadId: string) => Promise<{ error: Error | null }>
  deleteSquad: (squadId: string) => Promise<{ error: Error | null }>
  setCurrentSquad: (squad: SquadWithMembers | null) => void
  reset: () => void
}

const CACHE_DURATION = 30 * 1000
let inFlightFetchSquads: Promise<void> | null = null

export const useSquadsStore = create<SquadsState>((set, get) => ({
  squads: [],
  currentSquad: null,
  isLoading: false,
  lastFetchedAt: null,

  fetchSquads: async (force = false) => {
    const state = get()
    if (!force && state.lastFetchedAt && Date.now() - state.lastFetchedAt < CACHE_DURATION) return
    if (inFlightFetchSquads) return inFlightFetchSquads

    const fetchPromise = (async () => {
      try {
        set({ isLoading: true })
        const { data: memberships, error: memberError } = await supabase
          .from('squad_members')
          .select(`squad_id, squads!inner (id, name, game, invite_code, owner_id, created_at)`)
        if (memberError) throw memberError

        if (!memberships || memberships.length === 0) {
          set({ squads: [], isLoading: false, lastFetchedAt: Date.now() })
          return
        }

        const squadIds = [...new Set(memberships.map((m) => m.squad_id))]
        const squadsData = memberships.map((m) => m.squads as unknown as Squad)
        const uniqueSquads = squadIds
          .map((id) => squadsData.find((s) => s.id === id)!)
          .filter(Boolean)

        const { data: memberCounts } = await supabase
          .from('squad_members')
          .select('squad_id')
          .in('squad_id', squadIds)
        const countBySquad: Record<string, number> = {}
        memberCounts?.forEach((m) => {
          countBySquad[m.squad_id] = (countBySquad[m.squad_id] || 0) + 1
        })

        const squadsWithCount: SquadWithMembers[] = uniqueSquads
          .map((squad) => ({
            ...squad,
            member_count: countBySquad[squad.id] || 0,
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        set({ squads: squadsWithCount, isLoading: false, lastFetchedAt: Date.now() })
      } catch (error) {
        console.warn('[Squads] Error fetching:', error)
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
      const { data: squad, error } = await supabase.from('squads').select('*').eq('id', id).single()
      if (error) throw error

      const { data: members } = await supabase
        .from('squad_members')
        .select('*, profiles(username, avatar_url, reliability_score)')
        .eq('squad_id', id)

      const squadWithMembers: SquadWithMembers = {
        ...squad,
        members: members || [],
        member_count: members?.length || 0,
      }
      set({ currentSquad: squadWithMembers, isLoading: false })
      return squadWithMembers
    } catch (error) {
      console.warn('[Squads] Error fetching squad:', error)
      set({ isLoading: false })
      return null
    }
  },

  createSquad: async ({ name, game }) => {
    set({ isLoading: true })
    const result = await createSquadAction({ name, game })
    if (!result.error)
      get()
        .fetchSquads()
        .catch(() => {})
    set({ isLoading: false })
    return result
  },

  joinSquad: async (inviteCode: string) => {
    set({ isLoading: true })
    const result = await joinSquadAction(inviteCode)
    if (!result.error) await get().fetchSquads()
    set({ isLoading: false })
    return result
  },

  leaveSquad: async (squadId: string) => {
    const result = await leaveSquadAction(squadId)
    if (!result.error) await get().fetchSquads()
    return result
  },

  deleteSquad: async (squadId: string) => {
    try {
      const { error } = await supabase.from('squads').delete().eq('id', squadId)
      if (error) throw error
      await get().fetchSquads()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  setCurrentSquad: (squad) => set({ currentSquad: squad }),

  reset: () => {
    inFlightFetchSquads = null
    set({ squads: [], currentSquad: null, isLoading: false, lastFetchedAt: null })
  },
}))
