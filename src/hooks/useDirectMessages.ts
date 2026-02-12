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

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('get_dm_conversations_with_stats', {
        p_user_id: user.id,
      })

      if (error) {
        console.warn('DM conversations RPC not available, using fallback:', error.message)
        // Fallback: query direct_messages directly
        const { data: dmData } = await supabase
          .from('direct_messages')
          .select('id, sender_id, receiver_id, content, created_at')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(100)

        // Group by partner and take latest message
        const partnerMap = new Map<string, DMConversation>()
        for (const dm of dmData || []) {
          const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id
          if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, {
              other_user_id: partnerId,
              other_user_username: 'Utilisateur',
              other_user_avatar_url: null,
              last_message_content: dm.content,
              last_message_at: dm.created_at,
              last_message_sender_id: dm.sender_id,
              unread_count: 0,
            })
          }
        }

        // Fetch partner profiles
        const partnerIds = [...partnerMap.keys()]
        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', partnerIds)
          for (const p of profiles || []) {
            const conv = partnerMap.get(p.id)
            if (conv) {
              conv.other_user_username = p.username || 'Utilisateur'
              conv.other_user_avatar_url = p.avatar_url
            }
          }
        }

        set({ conversations: [...partnerMap.values()], isLoading: false })
        return
      }

      const conversations: DMConversation[] = (data || []).map(
        (row: {
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
        })
      )

      set({ conversations, isLoading: false })
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      console.warn('[DM] Error fetching conversations:', error)
      set({ conversations: [], isLoading: false })
    }
  },

  fetchMessages: async (otherUserId: string) => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      set({ messages: (data || []) as any[], isLoading: false })
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      console.warn('[DM] Error fetching messages:', error)
      set({ messages: [], isLoading: false })
    }
  },

  ...createDMActions(set, get),
}))
