import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { playNotificationSound } from './useRingtone'
import { useUnreadCountStore } from './useUnreadCount'

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: {
    username?: string
    avatar_url?: string | null
  }
}

interface DMConversation {
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}

interface DirectMessagesState {
  messages: DirectMessage[]
  conversations: DMConversation[]
  activeConversation: DMConversation | null
  isLoading: boolean
  realtimeChannel: RealtimeChannel | null

  // Actions
  fetchConversations: () => Promise<void>
  fetchMessages: (otherUserId: string) => Promise<void>
  sendMessage: (content: string, receiverId: string) => Promise<{ error: Error | null }>
  setActiveConversation: (conversation: DMConversation | null) => void
  subscribeToMessages: (otherUserId: string) => void
  unsubscribe: () => void
  markAsRead: (otherUserId: string) => Promise<void>
  startConversation: (userId: string) => Promise<DMConversation | null>
  getTotalUnread: () => number
}

export const useDirectMessagesStore = create<DirectMessagesState>((set, get) => ({
  messages: [],
  conversations: [],
  activeConversation: null,
  isLoading: false,
  realtimeChannel: null,

  // OPTIMIZED: Uses single RPC call instead of multiple queries
  fetchConversations: async () => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      // Try optimized RPC first
      const { data, error } = await supabase.rpc('get_dm_conversations_with_stats', {
        p_user_id: user.id
      })

      if (error) {
        // Fallback to old RPC if new one doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .rpc('get_dm_conversations', { user_id: user.id })

        if (fallbackError) {
          console.warn('DM conversations RPC not available:', fallbackError.message)
          set({ conversations: [], isLoading: false })
          return
        }

        set({ conversations: fallbackData || [], isLoading: false })
        return
      }

      // Transform the optimized RPC response
      const conversations: DMConversation[] = (data || []).map((row: {
        other_user_id: string
        other_username: string
        other_avatar_url: string | null
        last_message_id: string | null
        last_message_content: string | null
        last_message_created_at: string | null
        last_message_sender_id: string | null
        unread_count: number
      }) => ({
        other_user_id: row.other_user_id,
        other_user_username: row.other_username || 'Utilisateur',
        other_user_avatar_url: row.other_avatar_url,
        last_message_content: row.last_message_content,
        last_message_at: row.last_message_created_at,
        last_message_sender_id: row.last_message_sender_id,
        unread_count: row.unread_count || 0,
      }))

      set({ conversations, isLoading: false })
    } catch (error) {
      console.warn('[DM] Error fetching conversations:', error)
      set({ conversations: [], isLoading: false })
    }
  },

  fetchMessages: async (otherUserId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      set({ messages: (data || []) as DirectMessage[], isLoading: false })
    } catch (error) {
      console.warn('[DM] Error fetching messages:', error)
      set({ messages: [], isLoading: false })
    }
  },

  sendMessage: async (content: string, receiverId: string) => {
    if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          receiver_id: receiverId,
        })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.warn('[DM] Error sending message:', error)
      return { error: error as Error }
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation })
    if (conversation) {
      get().fetchMessages(conversation.other_user_id)
      get().subscribeToMessages(conversation.other_user_id)
      get().markAsRead(conversation.other_user_id)
    }
  },

  subscribeToMessages: (otherUserId: string) => {
    if (!isSupabaseReady()) return
    get().unsubscribe()

    const currentSession = supabase.auth.getSession()
    currentSession.then(({ data: { session } }) => {
      const user = session?.user
      if (!user) return

      const channelName = `dm:${[user.id, otherUserId].sort().join(':')}`

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          async (payload) => {
            const newMsg = payload.new as DirectMessage

            // Check if message belongs to this conversation
            const isRelevant =
              (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
              (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)

            if (!isRelevant) return

            // OPTIMIZED: Only fetch sender info, not the full message
            const { data: sender } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.sender_id)
              .single()

            const fullMessage: DirectMessage = {
              ...newMsg,
              sender: sender || undefined
            }

            // Play sound for messages from others
            if (newMsg.sender_id === otherUserId) {
              playNotificationSound()
            }

            set(state => ({
              messages: [...state.messages, fullMessage]
            }))

            // Mark as read if received
            if (newMsg.sender_id === otherUserId) {
              get().markAsRead(otherUserId)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'direct_messages',
          },
          (payload) => {
            const updatedMsg = payload.new as DirectMessage

            const isRelevant =
              (updatedMsg.sender_id === user.id && updatedMsg.receiver_id === otherUserId) ||
              (updatedMsg.sender_id === otherUserId && updatedMsg.receiver_id === user.id)

            if (!isRelevant) return

            set(state => ({
              messages: state.messages.map(msg =>
                msg.id === updatedMsg.id
                  ? { ...msg, read_at: updatedMsg.read_at }
                  : msg
              )
            }))
          }
        )
        .subscribe()

      set({ realtimeChannel: channel })
    })
  },

  unsubscribe: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  // OPTIMIZED: Uses batch RPC instead of single update
  markAsRead: async (otherUserId: string) => {
    if (!isSupabaseReady()) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // Try batch RPC first
      const { error } = await supabase.rpc('batch_mark_dms_read', {
        p_user_id: user.id,
        p_other_user_id: otherUserId
      })

      if (error) {
        // Fallback to direct update if RPC doesn't exist
        await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', user.id)
          .is('read_at', null)
      }

      // Update local state
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv.other_user_id === otherUserId) {
            return { ...conv, unread_count: 0 }
          }
          return conv
        })
      }))

      // Update global unread count
      await useUnreadCountStore.getState().fetchCounts()
    } catch (error) {
      console.warn('[DM] Error marking as read:', error)
    }
  },

  startConversation: async (userId: string) => {
    if (!isSupabaseReady()) return null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { conversations } = get()
      const existing = conversations.find(c => c.other_user_id === userId)
      if (existing) return existing

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single()

      if (error || !profile) throw new Error('User not found')

      const newConv: DMConversation = {
        other_user_id: profile.id,
        other_user_username: profile.username || 'Utilisateur',
        other_user_avatar_url: profile.avatar_url,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }

      set(state => ({
        conversations: [newConv, ...state.conversations]
      }))

      return newConv
    } catch (error) {
      console.warn('[DM] Error starting conversation:', error)
      return null
    }
  },

  getTotalUnread: () => {
    const { conversations } = get()
    return conversations.reduce((sum, c) => sum + c.unread_count, 0)
  },
}))
