import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuth'
import { showError } from '../lib/toast'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ThreadMessage {
  id: string
  content: string
  sender_id: string
  sender_username: string
  sender_avatar: string | null
  created_at: string
  edited_at: string | null
  reply_to_id: string | null
  is_system_message: boolean
}

interface ThreadParent {
  id: string
  content: string
  sender_id: string
  sender_username: string
  sender_avatar: string | null
  thread_reply_count: number
  thread_last_reply_at: string | null
  squad_id: string
}

export function useThreads(threadId: string | null) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  // Fetch thread messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) return []

      // Try RPC first
      const { data, error } = await supabase.rpc('get_thread_messages', {
        p_thread_id: threadId,
        p_limit: 50,
      })

      if (!error && data) return data as ThreadMessage[]

      // Fallback to direct query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, edited_at, reply_to_id, is_system_message, sender:profiles!sender_id(username, avatar_url)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (fallbackError) throw fallbackError

      return (fallbackData || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        content: m.content as string,
        sender_id: m.sender_id as string,
        sender_username: (m.sender as Record<string, unknown>)?.username as string || 'Utilisateur',
        sender_avatar: (m.sender as Record<string, unknown>)?.avatar_url as string | null,
        created_at: m.created_at as string,
        edited_at: m.edited_at as string | null,
        reply_to_id: m.reply_to_id as string | null,
        is_system_message: m.is_system_message as boolean,
      }))
    },
    enabled: !!threadId,
    staleTime: 10_000,
  })

  // Subscribe to realtime thread updates
  useEffect(() => {
    if (!threadId) return

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['thread-messages', threadId] })
      })
      .subscribe()

    setRealtimeChannel(channel)

    return () => {
      supabase.removeChannel(channel)
      setRealtimeChannel(null)
    }
  }, [threadId, queryClient])

  // Send reply to thread
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!threadId || !user?.id) throw new Error('Non connecté')

      // Get parent message to know the squad_id
      const { data: parent } = await supabase
        .from('messages')
        .select('squad_id, session_id')
        .eq('id', threadId)
        .single()

      if (!parent) throw new Error('Thread parent not found')

      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          squad_id: parent.squad_id,
          session_id: parent.session_id,
          thread_id: threadId,
          read_by: [user.id],
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-messages', threadId] })
    },
    onError: () => showError('Erreur lors de l\'envoi'),
  })

  const sendReply = useCallback((content: string) => {
    replyMutation.mutate(content)
  }, [replyMutation])

  return {
    messages,
    isLoading,
    sendReply,
    isSending: replyMutation.isPending,
    realtimeChannel,
  }
}

// Hook to get thread info for a parent message
export function useThreadInfo(messageId: string | undefined) {
  return useQuery({
    queryKey: ['thread-info', messageId],
    queryFn: async () => {
      if (!messageId) return null

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, thread_reply_count, thread_last_reply_at, squad_id, sender:profiles!sender_id(username, avatar_url)')
        .eq('id', messageId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        content: data.content,
        sender_id: data.sender_id,
        sender_username: (data.sender as Record<string, unknown>)?.username as string || 'Utilisateur',
        sender_avatar: (data.sender as Record<string, unknown>)?.avatar_url as string | null,
        thread_reply_count: data.thread_reply_count || 0,
        thread_last_reply_at: data.thread_last_reply_at,
        squad_id: data.squad_id,
      } as ThreadParent
    },
    enabled: !!messageId,
    staleTime: 30_000,
  })
}
