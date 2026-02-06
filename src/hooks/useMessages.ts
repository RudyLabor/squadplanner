import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Message } from '../types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface MessageWithSender extends Message {
  sender?: {
    username?: string
    avatar_url?: string | null
  }
}

interface Conversation {
  id: string
  type: 'squad' | 'session'
  squad_id: string
  session_id?: string
  name: string
  last_message?: MessageWithSender
  unread_count: number
}

interface MessagesState {
  messages: MessageWithSender[]
  conversations: Conversation[]
  activeConversation: Conversation | null
  isLoading: boolean
  realtimeChannel: RealtimeChannel | null

  // Actions
  fetchConversations: () => Promise<void>
  fetchMessages: (squadId: string, sessionId?: string) => Promise<void>
  sendMessage: (content: string, squadId: string, sessionId?: string) => Promise<{ error: Error | null }>
  editMessage: (messageId: string, newContent: string) => Promise<{ error: Error | null }>
  deleteMessage: (messageId: string) => Promise<{ error: Error | null }>
  pinMessage: (messageId: string, isPinned: boolean) => Promise<{ error: Error | null }>
  setActiveConversation: (conversation: Conversation | null) => void
  subscribeToMessages: (squadId: string, sessionId?: string) => void
  unsubscribe: () => void
  markAsRead: (squadId: string, sessionId?: string) => Promise<void>
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  conversations: [],
  activeConversation: null,
  isLoading: false,
  realtimeChannel: null,

  fetchConversations: async () => {
    try {
      set({ isLoading: true })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's squads
      const { data: memberships } = await supabase
        .from('squad_members')
        .select('squad_id')

      if (!memberships || memberships.length === 0) {
        set({ conversations: [], isLoading: false })
        return
      }

      const squadIds = memberships.map(m => m.squad_id)

      // Fetch squads
      const { data: squads } = await supabase
        .from('squads')
        .select('id, name')
        .in('id', squadIds)

      // Get last message for each squad
      const conversations: Conversation[] = []

      for (const squad of squads || []) {
        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(username, avatar_url)')
          .eq('squad_id', squad.id)
          .is('session_id', null)
          .order('created_at', { ascending: false })
          .limit(1)

        // Count unread (messages not in read_by array)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('squad_id', squad.id)
          .is('session_id', null)
          .not('read_by', 'cs', `{${user.id}}`)

        conversations.push({
          id: `squad-${squad.id}`,
          type: 'squad',
          squad_id: squad.id,
          name: squad.name,
          last_message: lastMessages?.[0] as MessageWithSender | undefined,
          unread_count: unreadCount || 0,
        })
      }

      // Sort by last message date
      conversations.sort((a, b) => {
        const dateA = a.last_message?.created_at || '1970-01-01'
        const dateB = b.last_message?.created_at || '1970-01-01'
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })

      set({ conversations, isLoading: false })
    } catch (error) {
      console.error('Error fetching conversations:', error)
      set({ isLoading: false })
    }
  },

  fetchMessages: async (squadId: string, sessionId?: string) => {
    try {
      set({ isLoading: true })

      let query = supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      } else {
        query = query.is('session_id', null)
      }

      const { data, error } = await query

      if (error) throw error

      set({ messages: (data || []) as MessageWithSender[], isLoading: false })
    } catch (error) {
      console.error('Error fetching messages:', error)
      set({ isLoading: false })
    }
  },

  sendMessage: async (content: string, squadId: string, sessionId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const messageData: {
        content: string
        squad_id: string
        sender_id: string
        session_id?: string
        read_by: string[]
      } = {
        content: content.trim(),
        squad_id: squadId,
        sender_id: user.id,
        read_by: [user.id], // Sender has already read the message
      }

      if (sessionId) {
        messageData.session_id = sessionId
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  editMessage: async (messageId: string, newContent: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify ownership
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (!message || message.sender_id !== user.id) {
        throw new Error('Cannot edit message: not the sender')
      }

      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent.trim(), edited_at: new Date().toISOString() }
            : msg
        )
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify ownership
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (!message || message.sender_id !== user.id) {
        throw new Error('Cannot delete message: not the sender')
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      set(state => ({
        messages: state.messages.filter(msg => msg.id !== messageId)
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  pinMessage: async (messageId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, is_pinned: isPinned }
            : msg
        )
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation })
    if (conversation) {
      get().fetchMessages(conversation.squad_id, conversation.session_id)
      get().subscribeToMessages(conversation.squad_id, conversation.session_id)
    }
  },

  subscribeToMessages: (squadId: string, sessionId?: string) => {
    // Unsubscribe from previous channel
    get().unsubscribe()

    const channelName = sessionId
      ? `messages:session:${sessionId}`
      : `messages:squad:${squadId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: sessionId
            ? `session_id=eq.${sessionId}`
            : `squad_id=eq.${squadId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data: newMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(username, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            set(state => ({
              messages: [...state.messages, newMessage as MessageWithSender]
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: sessionId
            ? `session_id=eq.${sessionId}`
            : `squad_id=eq.${squadId}`,
        },
        async (payload) => {
          // Mettre à jour le message (read receipts, content, edited_at, is_pinned)
          const updatedMsg = payload.new as MessageWithSender
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === updatedMsg.id
                ? {
                    ...msg,
                    content: updatedMsg.content,
                    read_by: updatedMsg.read_by,
                    edited_at: updatedMsg.edited_at,
                    is_pinned: updatedMsg.is_pinned
                  }
                : msg
            )
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: sessionId
            ? `session_id=eq.${sessionId}`
            : `squad_id=eq.${squadId}`,
        },
        async (payload) => {
          // Remove deleted message from state
          const deletedId = payload.old.id as string
          set(state => ({
            messages: state.messages.filter(msg => msg.id !== deletedId)
          }))
        }
      )
      .subscribe()

    set({ realtimeChannel: channel })
  },

  unsubscribe: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  markAsRead: async (squadId: string, sessionId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get unread messages
      let query = supabase
        .from('messages')
        .select('id, read_by')
        .eq('squad_id', squadId)
        .not('read_by', 'cs', `{${user.id}}`)

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      } else {
        query = query.is('session_id', null)
      }

      const { data: unreadMessages } = await query

      // Mark each as read
      for (const msg of unreadMessages || []) {
        const currentReadBy = msg.read_by || []
        await supabase
          .from('messages')
          .update({ read_by: [...currentReadBy, user.id] })
          .eq('id', msg.id)
      }

      // Update conversation unread count
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv.squad_id === squadId && conv.session_id === sessionId) {
            return { ...conv, unread_count: 0 }
          }
          return conv
        })
      }))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  },
}))
