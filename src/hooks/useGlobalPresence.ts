/**
 * Phase 4.2.1 — Global Presence System
 * Broadcasts user status via Supabase Presence (ephemeral, no DB needed)
 * Tracks: availability, custom status, game status, activity
 */
import { useEffect, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useUserStatusStore, type AvailabilityStatus } from './useUserStatus'

export interface GlobalPresenceUser {
  userId: string
  username: string
  avatarUrl: string | null
  availability: AvailabilityStatus
  customEmoji: string | null
  customText: string | null
  gameStatus: string | null
  activity: 'party' | 'session' | 'call' | null
  onlineAt: string
}

interface GlobalPresenceState {
  onlineUsers: Map<string, GlobalPresenceUser>
  channel: RealtimeChannel | null
  isConnected: boolean

  setOnlineUsers: (users: Map<string, GlobalPresenceUser>) => void
  setChannel: (channel: RealtimeChannel | null) => void
  setConnected: (connected: boolean) => void

  getUser: (userId: string) => GlobalPresenceUser | undefined
  isUserOnline: (userId: string) => boolean
}

export const useGlobalPresenceStore = create<GlobalPresenceState>((set, get) => ({
  onlineUsers: new Map(),
  channel: null,
  isConnected: false,

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setChannel: (channel) => set({ channel }),
  setConnected: (isConnected) => set({ isConnected }),

  getUser: (userId) => get().onlineUsers.get(userId),
  isUserOnline: (userId) => {
    const user = get().onlineUsers.get(userId)
    if (!user) return false
    return user.availability !== 'invisible'
  },
}))

interface UseGlobalPresenceOptions {
  userId: string | undefined
  username: string
  avatarUrl: string | null
}

/**
 * Hook to connect to the global presence channel.
 * Should be used once at app level (e.g., in AppLayout or App.tsx).
 */
export function useGlobalPresence({ userId, username, avatarUrl }: UseGlobalPresenceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastSeenTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const { availability, customStatus, gameStatus } = useUserStatusStore()
  const { setOnlineUsers, setChannel, setConnected } = useGlobalPresenceStore()

  // Build presence payload
  const getPresencePayload = useCallback((): Omit<GlobalPresenceUser, 'onlineAt'> => ({
    userId: userId || '',
    username,
    avatarUrl,
    availability,
    customEmoji: customStatus?.emoji || null,
    customText: customStatus?.text || null,
    gameStatus: gameStatus?.game || null,
    activity: null, // Will be updated by voice/session hooks
  }), [userId, username, avatarUrl, availability, customStatus, gameStatus])

  // Track presence
  const trackPresence = useCallback(async () => {
    if (!channelRef.current || !userId) return
    try {
      await channelRef.current.track({
        ...getPresencePayload(),
        onlineAt: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('[GlobalPresence] Track failed:', err)
    }
  }, [userId, getPresencePayload])

  // Connect to global presence channel
  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = new Map<string, GlobalPresenceUser>()

        Object.values(state).forEach((presences) => {
          (presences as unknown as GlobalPresenceUser[]).forEach((p) => {
            if (p.userId) {
              users.set(p.userId, p)
            }
          })
        })

        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const current = useGlobalPresenceStore.getState().onlineUsers
        const updated = new Map(current)
        ;(newPresences as unknown as GlobalPresenceUser[]).forEach((p) => {
          if (p.userId) updated.set(p.userId, p)
        })
        setOnlineUsers(updated)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const current = useGlobalPresenceStore.getState().onlineUsers
        const updated = new Map(current)
        ;(leftPresences as unknown as GlobalPresenceUser[]).forEach((p) => {
          if (p.userId) updated.delete(p.userId)
        })
        setOnlineUsers(updated)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          await channel.track({
            ...getPresencePayload(),
            onlineAt: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel
    setChannel(channel)

    // Update last_seen_at every 60s
    lastSeenTimerRef.current = setInterval(async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', userId)
      } catch { /* silent */ }
    }, 60_000)

    // Initial last_seen_at update
    supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (lastSeenTimerRef.current) {
        clearInterval(lastSeenTimerRef.current)
      }
      setChannel(null)
      setConnected(false)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-track when status changes
  useEffect(() => {
    trackPresence()
  }, [trackPresence])

  return {
    onlineUsers: useGlobalPresenceStore(s => s.onlineUsers),
    isConnected: useGlobalPresenceStore(s => s.isConnected),
  }
}

/**
 * Update the activity field in presence (called by voice/session hooks)
 */
export async function updatePresenceActivity(activity: 'party' | 'session' | 'call' | null) {
  const { channel } = useGlobalPresenceStore.getState()
  if (!channel) return

  const statusStore = useUserStatusStore.getState()
  try {
    await channel.track({
      userId: '', // will be overridden by key
      username: '',
      avatarUrl: null,
      availability: statusStore.availability,
      customEmoji: statusStore.customStatus?.emoji || null,
      customText: statusStore.customStatus?.text || null,
      gameStatus: statusStore.gameStatus?.game || null,
      activity,
      onlineAt: new Date().toISOString(),
    })
  } catch { /* silent */ }
}
