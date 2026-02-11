import { supabase, isSupabaseReady } from '../lib/supabase'
import { useUnreadCountStore } from './useUnreadCount'
import type { DirectMessage, DMConversation, DirectMessagesState } from './useDMTypes'
import type { StoreApi } from 'zustand'
import { playNotificationSound } from './useRingtone'

type SetState = StoreApi<DirectMessagesState>['setState']
type GetState = StoreApi<DirectMessagesState>['getState']

export function createDMActions(set: SetState, get: GetState) {
  return {
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

    setActiveConversation: (conversation: DMConversation | null) => {
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

              const isRelevant =
                (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
                (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)

              if (!isRelevant) return

              const { data: sender } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', newMsg.sender_id)
                .single()

              const fullMessage: DirectMessage = {
                ...newMsg,
                sender: sender || undefined
              }

              if (newMsg.sender_id === otherUserId) {
                playNotificationSound()
              }

              set(state => ({
                messages: [...state.messages, fullMessage]
              }))

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

    markAsRead: async (otherUserId: string) => {
      if (!isSupabaseReady()) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        const { error } = await supabase.rpc('batch_mark_dms_read', {
          p_user_id: user.id,
          p_other_user_id: otherUserId
        })

        if (error) {
          await supabase
            .from('direct_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .is('read_at', null)
        }

        set(state => ({
          conversations: state.conversations.map(conv => {
            if (conv.other_user_id === otherUserId) {
              return { ...conv, unread_count: 0 }
            }
            return conv
          })
        }))

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
  }
}
