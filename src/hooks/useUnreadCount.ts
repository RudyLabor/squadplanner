import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// =====================================================
// PHASE 5.5 - APP BADGE API
// Updates PWA icon badge with unread count
// =====================================================

// Check if App Badge API is supported
function isAppBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator
}

// Update the app badge with unread count
async function updateAppBadge(count: number): Promise<void> {
  if (!isAppBadgeSupported()) return

  try {
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch (error) {
    // Badge API might fail silently on some platforms
    // This is expected behavior, no need to log in production
    if (import.meta.env.DEV) {
      console.debug('[AppBadge] Failed to update badge:', error)
    }
  }
}

interface UnreadCountState {
  squadUnread: number
  dmUnread: number
  totalUnread: number
  isSubscribed: boolean
  channel: RealtimeChannel | null

  // Actions
  fetchCounts: () => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
  incrementSquad: () => void
  incrementDM: () => void
  decrementSquad: (count?: number) => void
  decrementDM: (count?: number) => void
}

export const useUnreadCountStore = create<UnreadCountState>((set, get) => ({
  squadUnread: 0,
  dmUnread: 0,
  totalUnread: 0,
  isSubscribed: false,
  channel: null,

  fetchCounts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's squads
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('squad_id')

      if (!memberships || memberships.length === 0) {
        set({ squadUnread: 0, dmUnread: 0, totalUnread: 0 })
        return
      }

      const squadIds = memberships.map(m => m.squad_id)

      // Count unread squad messages
      const { count: squadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('squad_id', squadIds)
        .neq('sender_id', user.id)
        .not('read_by', 'cs', `{${user.id}}`)

      // Count unread DMs
      const { count: dmCount } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)

      const squadUnread = squadCount || 0
      const dmUnread = dmCount || 0

      const totalUnread = squadUnread + dmUnread
      set({ squadUnread, dmUnread, totalUnread })
      updateAppBadge(totalUnread)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  },

  subscribe: () => {
    if (get().isSubscribed) return

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's squads for filtering
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('squad_id')

      const squadIds = memberships?.map(m => m.squad_id) || []

      const channel = supabase
        .channel('unread-counts')
        // Listen to new squad messages
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const msg = payload.new as { sender_id: string; squad_id: string }
            // Only count if it's from someone else and in user's squads
            if (msg.sender_id !== user.id && squadIds.includes(msg.squad_id)) {
              set(state => {
                const newTotal = state.totalUnread + 1
                updateAppBadge(newTotal)
                return {
                  squadUnread: state.squadUnread + 1,
                  totalUnread: newTotal
                }
              })
            }
          }
        )
        // Listen to new DMs
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          (payload) => {
            const msg = payload.new as { receiver_id: string }
            // Only count if user is the receiver
            if (msg.receiver_id === user.id) {
              set(state => {
                const newTotal = state.totalUnread + 1
                updateAppBadge(newTotal)
                return {
                  dmUnread: state.dmUnread + 1,
                  totalUnread: newTotal
                }
              })
            }
          }
        )
        // Note: We don't listen to UPDATE events for read status because
        // payload.old doesn't contain full data without REPLICA IDENTITY FULL.
        // Instead, fetchCounts() is called after markAsRead() in the hooks.
        .subscribe()

      set({ channel, isSubscribed: true })
    }

    setupSubscription()
  },

  unsubscribe: () => {
    const { channel } = get()
    if (channel) {
      supabase.removeChannel(channel)
      set({ channel: null, isSubscribed: false })
    }
  },

  incrementSquad: () => {
    set(state => {
      const newTotal = state.totalUnread + 1
      updateAppBadge(newTotal)
      return {
        squadUnread: state.squadUnread + 1,
        totalUnread: newTotal
      }
    })
  },

  incrementDM: () => {
    set(state => {
      const newTotal = state.totalUnread + 1
      updateAppBadge(newTotal)
      return {
        dmUnread: state.dmUnread + 1,
        totalUnread: newTotal
      }
    })
  },

  decrementSquad: (count = 1) => {
    set(state => {
      const newTotal = Math.max(0, state.totalUnread - count)
      updateAppBadge(newTotal)
      return {
        squadUnread: Math.max(0, state.squadUnread - count),
        totalUnread: newTotal
      }
    })
  },

  decrementDM: (count = 1) => {
    set(state => {
      const newTotal = Math.max(0, state.totalUnread - count)
      updateAppBadge(newTotal)
      return {
        dmUnread: Math.max(0, state.dmUnread - count),
        totalUnread: newTotal
      }
    })
  },
}))

export default useUnreadCountStore
