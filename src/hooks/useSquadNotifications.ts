/**
 * PHASE 3.5 - Squad Notifications Hook
 *
 * Tracks pending session RSVPs and squad invitations for badge display.
 */
import { create } from 'zustand'
import { useEffect } from 'react'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from './useAuth'

interface SquadNotificationsState {
  pendingRsvpCount: number
  isLoading: boolean
  lastFetchedAt: number | null

  // Actions
  fetchPendingCounts: () => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000

// Track realtime subscription
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

export const useSquadNotificationsStore = create<SquadNotificationsState>((set, get) => ({
  pendingRsvpCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  fetchPendingCounts: async () => {
    const state = get()

    // Skip if recently fetched
    if (state.lastFetchedAt && Date.now() - state.lastFetchedAt < CACHE_DURATION) {
      return
    }

    try {
      set({ isLoading: true })

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        set({ pendingRsvpCount: 0, isLoading: false })
        return
      }

      // Get user's squads
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) {
        set({ pendingRsvpCount: 0, isLoading: false, lastFetchedAt: Date.now() })
        return
      }

      const squadIds = memberships.map((m) => m.squad_id)

      // Get proposed/confirmed sessions in user's squads that are in the future
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, status')
        .in('squad_id', squadIds)
        .in('status', ['proposed', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())

      if (!sessions || sessions.length === 0) {
        set({ pendingRsvpCount: 0, isLoading: false, lastFetchedAt: Date.now() })
        return
      }

      const sessionIds = sessions.map((s) => s.id)

      // Get user's RSVPs for these sessions
      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('user_id', user.id)

      const respondedSessionIds = new Set(rsvps?.map((r) => r.session_id) || [])

      // Count sessions where user hasn't responded
      const pendingCount = sessions.filter((s) => !respondedSessionIds.has(s.id)).length

      set({
        pendingRsvpCount: pendingCount,
        isLoading: false,
        lastFetchedAt: Date.now(),
      })
    } catch (error) {
      console.warn('[SquadNotif] Error fetching counts:', error)
      set({ isLoading: false })
    }
  },

  subscribe: () => {
    const state = get()

    // Avoid duplicate subscriptions
    if (realtimeChannel) return

    realtimeChannel = supabase
      .channel('squad-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        // Force refresh on session changes
        state.fetchPendingCounts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_rsvps' }, () => {
        // Force refresh on RSVP changes
        state.fetchPendingCounts()
      })
      .subscribe()
  },

  unsubscribe: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  },
}))

/**
 * Hook to use squad notifications with auto-subscription
 */
export function useSquadNotifications() {
  const user = useAuthStore((state) => state.user)
  const { pendingRsvpCount, fetchPendingCounts, subscribe, unsubscribe } =
    useSquadNotificationsStore()

  useEffect(() => {
    if (!user) return

    fetchPendingCounts()
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [user, fetchPendingCounts, subscribe, unsubscribe])

  return { pendingRsvpCount }
}
