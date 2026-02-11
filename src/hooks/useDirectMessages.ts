import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { DirectMessagesState, DMConversation } from './useDMTypes'
import { createDMActions } from './useDMActions'

export type { DirectMessage, DMConversation, DirectMessagesState } from './useDMTypes'

export const useDirectMessagesStore = create<DirectMessagesState>((set, get) => ({
  messages: [],
  conversations: [],
  activeConversation: null,
  isLoading: false,
  realtimeChannel: null,

  fetchConversations: async () => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('get_dm_conversations_with_stats', {
        p_user_id: user.id
      })

      if (error) {
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

      set({ messages: (data || []) as any[], isLoading: false })
    } catch (error) {
      console.warn('[DM] Error fetching messages:', error)
      set({ messages: [], isLoading: false })
    }
  },

  ...createDMActions(set, get),
}))
