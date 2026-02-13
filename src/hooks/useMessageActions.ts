import { supabase, isSupabaseReady } from '../lib/supabaseMinimal'
import type { Message } from '../types/database'
import { playNotificationSound } from './useRingtone'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useUnreadCountStore } from './useUnreadCount'

export interface MessageWithSender extends Message {
  sender?: {
    username?: string
    avatar_url?: string | null
  }
  _sendFailed?: boolean
  _optimisticId?: string
}

export interface Conversation {
  id: string
  type: 'squad' | 'session'
  squad_id: string
  session_id?: string
  name: string
  last_message?: MessageWithSender
  unread_count: number
}

export function createRealtimeSubscription(
  squadId: string,
  sessionId: string | undefined,
  setState: (
    fn: (state: { messages: MessageWithSender[] }) => Partial<{ messages: MessageWithSender[] }>
  ) => void
): RealtimeChannel {
  const channelName = sessionId ? `messages:session:${sessionId}` : `messages:squad:${squadId}`

  const filter = sessionId ? `session_id=eq.${sessionId}` : `squad_id=eq.${squadId}`

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter },
      async (payload) => {
        try {
          const newMsg = payload.new as Message
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          const newMessage: MessageWithSender = { ...newMsg, sender: sender || undefined }
          const {
            data: { session },
          } = await supabase.auth.getSession()
          const user = session?.user
          const isOwnMessage = user && newMessage.sender_id === user.id

          if (!isOwnMessage) playNotificationSound()

          setState((state) => ({
            messages: [
              ...state.messages.filter(
                (m) =>
                  !(
                    m._optimisticId &&
                    m.sender_id === newMessage.sender_id &&
                    m.content === newMessage.content
                  )
              ),
              newMessage,
            ],
          }))
        } catch (err: any) {
          if (err?.name === 'AbortError') return
          console.warn('[Messages] Error in INSERT handler:', err)
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter },
      (payload) => {
        const updatedMsg = payload.new as MessageWithSender
        setState((state) => {
          const existing = state.messages.find((m) => m.id === updatedMsg.id)
          if (!existing) return state

          // Skip update if only read_by changed (most common realtime update)
          // This prevents re-renders that cause emoji reactions to blink
          const contentChanged = existing.content !== updatedMsg.content
          const editChanged = existing.edited_at !== updatedMsg.edited_at
          const pinChanged = existing.is_pinned !== updatedMsg.is_pinned
          const readByLengthChanged =
            (existing.read_by?.length ?? 0) !== (updatedMsg.read_by?.length ?? 0)

          if (!contentChanged && !editChanged && !pinChanged && !readByLengthChanged) {
            return state // No visible change, skip update entirely
          }

          return {
            messages: state.messages.map((msg) =>
              msg.id === updatedMsg.id
                ? {
                    ...msg,
                    content: updatedMsg.content,
                    read_by: updatedMsg.read_by,
                    edited_at: updatedMsg.edited_at,
                    is_pinned: updatedMsg.is_pinned,
                  }
                : msg
            ),
          }
        })
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages', filter },
      (payload) => {
        const deletedId = payload.old.id as string
        setState((state) => ({
          messages: state.messages.filter((msg) => msg.id !== deletedId),
        }))
      }
    )
    .subscribe()
}

export async function markMessagesAsRead(
  squadId: string,
  sessionId: string | undefined,
  setConversations: (
    fn: (state: { conversations: Conversation[] }) => Partial<{ conversations: Conversation[] }>
  ) => void
) {
  if (!isSupabaseReady()) return
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { error } = await supabase.rpc('batch_mark_messages_read', {
      p_user_id: user.id,
      p_squad_id: squadId,
      p_session_id: sessionId || null,
    })

    if (error) {
      console.warn('batch_mark_messages_read RPC not available, using fallback')
      await markMessagesAsReadFallback(squadId, sessionId, setConversations)
      return
    }

    setConversations((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.squad_id === squadId && conv.session_id === sessionId
          ? { ...conv, unread_count: 0 }
          : conv
      ),
    }))
    await useUnreadCountStore.getState().fetchCounts()
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    console.warn('[Messages] Error marking as read:', err)
  }
}

export async function markMessagesAsReadFallback(
  squadId: string,
  sessionId: string | undefined,
  setConversations: (
    fn: (state: { conversations: Conversation[] }) => Partial<{ conversations: Conversation[] }>
  ) => void
) {
  if (!isSupabaseReady()) return
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    let query = supabase
      .from('messages')
      .select('id, read_by')
      .eq('squad_id', squadId)
      .not('read_by', 'cs', `{${user.id}}`)
    if (sessionId) query = query.eq('session_id', sessionId)
    else query = query.is('session_id', null)

    const { data: unreadMessages } = await query
    for (const msg of unreadMessages || []) {
      const currentReadBy = msg.read_by || []
      await supabase
        .from('messages')
        .update({ read_by: [...currentReadBy, user.id] })
        .eq('id', msg.id)
    }

    setConversations((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.squad_id === squadId && conv.session_id === sessionId
          ? { ...conv, unread_count: 0 }
          : conv
      ),
    }))
    await useUnreadCountStore.getState().fetchCounts()
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    console.warn('[Messages] Error marking as read (fallback):', err)
  }
}
