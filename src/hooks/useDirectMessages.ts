import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

  fetchConversations: async () => {
    try {
      set({ isLoading: true })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Utiliser la fonction SQL pour obtenir les conversations
      const { data, error } = await supabase
        .rpc('get_dm_conversations', { user_id: user.id })

      if (error) {
        // Si la fonction n'existe pas encore, retourner un tableau vide
        console.warn('get_dm_conversations not available:', error.message)
        set({ conversations: [], isLoading: false })
        return
      }

      set({ conversations: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching DM conversations:', error)
      set({ conversations: [], isLoading: false })
    }
  },

  fetchMessages: async (otherUserId: string) => {
    try {
      set({ isLoading: true })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Récupérer les messages entre les deux utilisateurs
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      set({ messages: (data || []) as DirectMessage[], isLoading: false })
    } catch (error) {
      console.error('Error fetching DM messages:', error)
      set({ messages: [], isLoading: false })
    }
  },

  sendMessage: async (content: string, receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
      console.error('Error sending DM:', error)
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
    get().unsubscribe()

    const currentUser = supabase.auth.getUser()
    currentUser.then(({ data: { user } }) => {
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

            // Vérifier que le message appartient à cette conversation
            const isRelevant =
              (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
              (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)

            if (!isRelevant) return

            // Récupérer le message complet avec les infos du sender
            const { data: fullMessage } = await supabase
              .from('direct_messages')
              .select('*, sender:profiles!sender_id(username, avatar_url)')
              .eq('id', newMsg.id)
              .single()

            if (fullMessage) {
              set(state => ({
                messages: [...state.messages, fullMessage as DirectMessage]
              }))

              // Si c'est un message reçu, le marquer comme lu
              if (newMsg.sender_id === otherUserId) {
                get().markAsRead(otherUserId)
              }
            }
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Marquer tous les messages non lus de cet utilisateur comme lus
      const { error } = await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .is('read_at', null)

      if (error) throw error

      // Mettre à jour le compteur local
      set(state => ({
        conversations: state.conversations.map(conv => {
          if (conv.other_user_id === otherUserId) {
            return { ...conv, unread_count: 0 }
          }
          return conv
        })
      }))
    } catch (error) {
      console.error('Error marking DMs as read:', error)
    }
  },

  startConversation: async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Vérifier si la conversation existe déjà
      const { conversations } = get()
      const existing = conversations.find(c => c.other_user_id === userId)
      if (existing) return existing

      // Récupérer les infos de l'utilisateur
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single()

      if (error || !profile) throw new Error('User not found')

      // Créer une nouvelle conversation (virtuelle, pas de table conversations)
      const newConv: DMConversation = {
        other_user_id: profile.id,
        other_user_username: profile.username || 'Utilisateur',
        other_user_avatar_url: profile.avatar_url,
        last_message_content: null,
        last_message_at: null,
        last_message_sender_id: null,
        unread_count: 0,
      }

      // Ajouter à la liste des conversations
      set(state => ({
        conversations: [newConv, ...state.conversations]
      }))

      return newConv
    } catch (error) {
      console.error('Error starting conversation:', error)
      return null
    }
  },

  getTotalUnread: () => {
    const { conversations } = get()
    return conversations.reduce((sum, c) => sum + c.unread_count, 0)
  },
}))
