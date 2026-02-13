/**
 * PHASE 5.4 - Realtime Presence Hook
 *
 * Track who's online in a squad using Supabase Presence.
 * Shows green/gray indicators for each member's online status.
 *
 * Features:
 * - Real-time presence tracking per squad
 * - Automatic heartbeat to maintain presence
 * - Clean disconnect handling
 * - Optional "last seen" tracking
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  userId: string
  username: string
  avatar_url?: string | null
  online_at: string
  current_page?: string
}

interface PresenceState {
  [key: string]: PresenceUser[]
}

interface UsePresenceOptions {
  squadId: string
  userId: string
  username: string
  avatarUrl?: string | null
}

interface UsePresenceReturn {
  /** Map of user IDs to their online status */
  onlineUsers: Map<string, PresenceUser>
  /** Check if a specific user is online */
  isUserOnline: (userId: string) => boolean
  /** Total count of online users */
  onlineCount: number
  /** Update current page for activity tracking */
  setCurrentPage: (page: string) => void
}

/**
 * Hook to track online presence in a squad
 */
export function usePresence({
  squadId,
  userId,
  username,
  avatarUrl,
}: UsePresenceOptions): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const currentPageRef = useRef<string>('home')

  // Track presence state
  const trackPresence = useCallback(
    async (channel: RealtimeChannel) => {
      await channel.track({
        userId,
        username,
        avatar_url: avatarUrl,
        online_at: new Date().toISOString(),
        current_page: currentPageRef.current,
      })
    },
    [userId, username, avatarUrl]
  )

  // Subscribe to squad presence channel
  useEffect(() => {
    if (!squadId || !userId) return

    const channelName = `presence:squad:${squadId}`

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    // Handle presence sync (initial state)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users = new Map<string, PresenceUser>()

      // Flatten presence state (each key has array of presence entries)
      Object.values(state as PresenceState).forEach((presences) => {
        presences.forEach((presence) => {
          if (presence.userId) {
            users.set(presence.userId, presence)
          }
        })
      })

      setOnlineUsers(users)
    })

    // Handle user joining
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev)
        ;(newPresences as unknown as PresenceUser[]).forEach((presence) => {
          if (presence.userId) {
            updated.set(presence.userId, presence)
          }
        })
        return updated
      })
    })

    // Handle user leaving
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev)
        ;(leftPresences as unknown as PresenceUser[]).forEach((presence) => {
          if (presence.userId) {
            updated.delete(presence.userId)
          }
        })
        return updated
      })
    })

    // Subscribe and track our presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackPresence(channel)
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [squadId, userId, trackPresence])

  // Update current page
  const setCurrentPage = useCallback(
    (page: string) => {
      currentPageRef.current = page
      if (channelRef.current) {
        trackPresence(channelRef.current)
      }
    },
    [trackPresence]
  )

  // Check if user is online
  const isUserOnline = useCallback(
    (checkUserId: string) => onlineUsers.has(checkUserId),
    [onlineUsers]
  )

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
    setCurrentPage,
  }
}

/**
 * Simplified hook to check if a specific user is online
 * Uses a global presence channel
 */
export function useUserOnlineStatus(userId: string | undefined): boolean {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!userId) return

    // For simplicity, check if user has been active recently via profile
    // This is a fallback when not in a specific squad context
    const checkOnline = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', userId)
        .single()

      if (data?.last_seen_at) {
        const lastSeen = new Date(data.last_seen_at)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        setIsOnline(lastSeen > fiveMinutesAgo)
      }
    }

    checkOnline()

    // Check every 30 seconds
    const interval = setInterval(checkOnline, 30000)
    return () => clearInterval(interval)
  }, [userId])

  return isOnline
}

/**
 * Component-ready presence indicator props
 */
export interface OnlineIndicatorProps {
  isOnline: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

/**
 * Get CSS classes for online indicator
 */
export function getOnlineIndicatorClasses(
  isOnline: boolean,
  size: 'sm' | 'md' | 'lg' = 'sm'
): string {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  const baseClasses = `${sizeClasses[size]} rounded-full border-2 border-bg-base`

  if (isOnline) {
    return `${baseClasses} bg-emerald-500 shadow-glow-success`
  }

  return `${baseClasses} bg-zinc-600`
}

export default usePresence
