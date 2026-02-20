import { create } from 'zustand'
import { supabase, isSupabaseReady } from '../lib/supabaseMinimal'
import { trackChallengeProgress } from '../lib/challengeTracker'
import { notifySquadMessage } from '../lib/notifyOnMessage'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { showError } from '../lib/toast'
import { optimisticId } from '../utils/optimisticUpdate'
import type { MessageWithSender, Conversation } from './useMessageActions'
import {
  createRealtimeSubscription,
  markMessagesAsRead,
  markMessagesAsReadFallback,
} from './useMessageActions'

interface MessagesState {
  messages: MessageWithSender[]
  conversations: Conversation[]
  activeConversation: Conversation | null
  isLoading: boolean
  realtimeChannel: RealtimeChannel | null
  fetchConversations: () => Promise<void>
  fetchConversationsFallback: () => Promise<void>
  fetchMessages: (squadId: string, sessionId?: string) => Promise<void>
  sendMessage: (
    content: string,
    squadId: string,
    sessionId?: string,
    replyToId?: string
  ) => Promise<{ error: Error | null }>
  retryMessage: (optimisticMsgId: string) => Promise<void>
  dismissFailedMessage: (optimisticMsgId: string) => void
  editMessage: (messageId: string, newContent: string) => Promise<{ error: Error | null }>
  deleteMessage: (messageId: string) => Promise<{ error: Error | null }>
  pinMessage: (messageId: string, isPinned: boolean) => Promise<{ error: Error | null }>
  setActiveConversation: (conversation: Conversation | null) => void
  subscribeToMessages: (squadId: string, sessionId?: string) => void
  unsubscribe: () => void
  markAsRead: (squadId: string, sessionId?: string) => Promise<void>
  markAsReadFallback: (squadId: string, sessionId?: string) => Promise<void>
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  conversations: [],
  activeConversation: null,
  isLoading: false,
  realtimeChannel: null,
  // BUG-4: Track current fetch to abort on rapid conversation switching
  _fetchController: null as AbortController | null,

  fetchConversations: async () => {
    if (!isSupabaseReady()) return
    try {
      set({ isLoading: true })
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('get_conversations_with_stats', {
        p_user_id: user.id,
      })
      if (error) {
        console.warn('RPC not available, using fallback:', error.message)
        await get().fetchConversationsFallback()
        return
      }

      interface ConversationRow {
        conversation_id: string
        conversation_type: string
        squad_id: string
        session_id?: string
        name: string
        last_message_id?: string
        last_message_content?: string
        last_message_created_at?: string
        last_message_sender_id?: string
        last_message_sender_username?: string
        last_message_sender_avatar?: string
        unread_count?: number
      }
      const conversations: Conversation[] = (data || []).map((row: ConversationRow) => ({
        id: row.conversation_id,
        type: row.conversation_type as 'squad' | 'session',
        squad_id: row.squad_id,
        session_id: row.session_id || undefined,
        name: row.name,
        last_message: row.last_message_id
          ? ({
              id: row.last_message_id,
              content: row.last_message_content || '',
              created_at: row.last_message_created_at || '',
              sender_id: row.last_message_sender_id || '',
              squad_id: row.squad_id,
              sender: {
                username: row.last_message_sender_username || undefined,
                avatar_url: row.last_message_sender_avatar || undefined,
              },
            } as MessageWithSender)
          : undefined,
        unread_count: row.unread_count || 0,
      }))
      set({ conversations, isLoading: false })
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.warn('[Messages] Error fetching conversations:', error)
      set({ isLoading: false })
    }
  },

  fetchConversationsFallback: async () => {
    if (!isSupabaseReady()) {
      set({ conversations: [], isLoading: false })
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      set({ conversations: [], isLoading: false })
      return
    }

    const { data: memberships } = await supabase.from('squad_members').select('squad_id')
    if (!memberships || memberships.length === 0) {
      set({ conversations: [], isLoading: false })
      return
    }

    const squadIds = memberships.map((m) => m.squad_id)
    const { data: squads } = await supabase.from('squads').select('id, name').in('id', squadIds)
    const conversations: Conversation[] = []

    for (const squad of squads || []) {
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .eq('squad_id', squad.id)
        .is('session_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
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

    conversations.sort((a, b) => {
      const dateA = a.last_message?.created_at || '1970-01-01'
      const dateB = b.last_message?.created_at || '1970-01-01'
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    set({ conversations, isLoading: false })
  },

  fetchMessages: async (squadId: string, sessionId?: string) => {
    if (!isSupabaseReady()) return
    // BUG-4: Cancel any in-flight fetch to prevent race conditions on rapid switching
    const prev = (get() as any)._fetchController
    if (prev) prev.abort()
    const controller = new AbortController()
    set({ isLoading: true, _fetchController: controller } as any)
    try {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(username, avatar_url)')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: true })
        .limit(100)
        .abortSignal(controller.signal)
      if (sessionId) query = query.eq('session_id', sessionId)
      else query = query.is('session_id', null)
      const { data, error } = await query
      if (error) throw error
      // Only apply results if this fetch wasn't cancelled
      if (!controller.signal.aborted) {
        set({ messages: (data || []) as MessageWithSender[], isLoading: false })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.warn('[Messages] Error fetching messages:', error)
      if (!controller.signal.aborted) set({ isLoading: false })
    }
  },

  sendMessage: async (content: string, squadId: string, sessionId?: string, replyToId?: string) => {
    if (!isSupabaseReady()) return { error: new Error('Supabase not ready') }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return { error: new Error('Not authenticated') }

    const tempId = optimisticId()
    const now = new Date().toISOString()
    const optimisticMsg: MessageWithSender = {
      id: tempId,
      content: content.trim(),
      squad_id: squadId,
      session_id: sessionId || null,
      sender_id: user.id,
      is_ai_suggestion: false,
      is_system_message: false,
      is_pinned: false,
      read_by: [user.id],
      edited_at: null,
      channel_id: null,
      thread_id: null,
      thread_reply_count: 0,
      thread_last_reply_at: null,
      voice_url: null,
      voice_duration_seconds: null,
      message_type: 'text' as const,
      reply_to_id: replyToId || null,
      created_at: now,
      updated_at: now,
      sender: undefined,
      _optimisticId: tempId,
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    // BUG-6: Fallback if profile.username is null
    if (profile)
      optimisticMsg.sender = { username: profile.username || 'Utilisateur', avatar_url: profile.avatar_url }
    set((state) => ({ messages: [...state.messages, optimisticMsg] }))

    try {
      const messageData: Record<string, unknown> = {
        content: content.trim(),
        squad_id: squadId,
        sender_id: user.id,
        read_by: [user.id],
      }
      if (sessionId) messageData.session_id = sessionId
      if (replyToId) messageData.reply_to_id = replyToId
      const { error } = await supabase.from('messages').insert(messageData)
      if (error) throw error
      set((state) => ({ messages: state.messages.filter((m) => m._optimisticId !== tempId) }))
      // Track challenge progress for sending messages
      trackChallengeProgress(user.id, 'messages').catch(() => {})
      // Sound feedback: message sent
      import('./useSound').then(({ useSoundStore }) => {
        const { enabled, volume } = useSoundStore.getState()
        if (enabled && volume > 0) {
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(880, ctx.currentTime)
            gain.gain.setValueAtTime(0.15 * volume, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.1)
          } catch {}
        }
      })
      // Gamification: award XP for sending a message
      import('../stores/useGamificationStore').then(({ useGamificationStore }) => {
        const store = useGamificationStore.getState()
        store.addXP('message.send')
        store.incrementStat('messagesSent')
      })
      // Push notification to other squad members (fire-and-forget)
      const senderName = optimisticMsg.sender?.username || 'Joueur'
      notifySquadMessage(squadId, user.id, senderName, content.trim(), sessionId).catch(() => {})
      return { error: null }
    } catch (error) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._optimisticId === tempId ? { ...m, _sendFailed: true } : m
        ),
      }))
      showError('Message non envoye. Appuie pour reessayer.')
      return { error: error as Error }
    }
  },

  retryMessage: async (optimisticMsgId: string) => {
    const msg = get().messages.find((m) => m._optimisticId === optimisticMsgId)
    if (!msg) return
    set((state) => ({
      messages: state.messages.filter((m) => m._optimisticId !== optimisticMsgId),
    }))
    await get().sendMessage(msg.content, msg.squad_id, msg.session_id || undefined)
  },

  dismissFailedMessage: (optimisticMsgId: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._optimisticId !== optimisticMsgId),
    }))
  },

  editMessage: async (messageId: string, newContent: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()
      if (!message || message.sender_id !== user.id)
        throw new Error('Cannot edit message: not the sender')
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent.trim(), edited_at: new Date().toISOString() })
        .eq('id', messageId)
      if (error) throw error
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: newContent.trim(), edited_at: new Date().toISOString() }
            : msg
        ),
      }))
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')
      const { data: message } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()
      if (!message || message.sender_id !== user.id)
        throw new Error('Cannot delete message: not the sender')
      const { error } = await supabase.from('messages').delete().eq('id', messageId)
      if (error) throw error
      set((state) => ({ messages: state.messages.filter((msg) => msg.id !== messageId) }))
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
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, is_pinned: isPinned } : msg
        ),
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
    if (!isSupabaseReady()) return
    get().unsubscribe()
    const channel = createRealtimeSubscription(squadId, sessionId, set)
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
    await markMessagesAsRead(squadId, sessionId, set)
  },

  markAsReadFallback: async (squadId: string, sessionId?: string) => {
    await markMessagesAsReadFallback(squadId, sessionId, set)
  },
}))
