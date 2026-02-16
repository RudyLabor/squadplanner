import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from './useAuth'
import type { MessageSearchResult, DMSearchResult } from '../types/database'

interface UseMessageSearchOptions {
  squadId?: string
  otherUserId?: string
  limit?: number
}

/**
 * Debounced message search across squad channels and direct messages.
 * Uses `search_messages` RPC with fallback to ILIKE query when RPC is unavailable.
 * Returns combined results from both squad messages and DMs.
 */
export function useMessageSearch(options: UseMessageSearchOptions = {}) {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Search squad messages
  const { data: squadResults = [], isLoading: squadLoading } = useQuery({
    queryKey: ['message-search', 'squad', debouncedQuery, options.squadId],
    queryFn: async () => {
      if (!user?.id || !debouncedQuery.trim()) return []
      setIsSearching(true)

      try {
        // Try RPC first
        const { data, error } = await supabase.rpc('search_messages', {
          p_user_id: user.id,
          p_query: debouncedQuery.trim(),
          p_squad_id: options.squadId || null,
          p_limit: options.limit || 30,
          p_offset: 0,
        })

        if (!error && data) return data as MessageSearchResult[]

        // Fallback: ILIKE search
        let q = supabase
          .from('messages')
          .select(
            'id, content, sender_id, squad_id, channel_id, created_at, sender:profiles!sender_id(username, avatar_url), squad:squads!squad_id(name)'
          )
          .ilike('content', `%${debouncedQuery.trim()}%`)
          .eq('is_system_message', false)
          .order('created_at', { ascending: false })
          .limit(options.limit || 30)

        if (options.squadId) {
          q = q.eq('squad_id', options.squadId)
        }

        const { data: fallbackData, error: fallbackError } = await q

        if (fallbackError) throw fallbackError

        return (fallbackData || []).map((m: Record<string, unknown>) => ({
          message_id: m.id as string,
          content: m.content as string,
          sender_id: m.sender_id as string,
          sender_username:
            ((m.sender as Record<string, unknown>)?.username as string) || 'Utilisateur',
          sender_avatar: (m.sender as Record<string, unknown>)?.avatar_url as string | null,
          squad_id: m.squad_id as string,
          squad_name: ((m.squad as Record<string, unknown>)?.name as string) || 'Squad',
          channel_id: m.channel_id as string | null,
          created_at: m.created_at as string,
          relevance: 1,
        })) as MessageSearchResult[]
      } finally {
        setIsSearching(false)
      }
    },
    enabled: !!user?.id && !!debouncedQuery.trim() && debouncedQuery.trim().length >= 2,
    staleTime: 10_000,
  })

  // Search DMs
  const { data: dmResults = [], isLoading: dmLoading } = useQuery({
    queryKey: ['message-search', 'dm', debouncedQuery, options.otherUserId],
    queryFn: async () => {
      if (!user?.id || !debouncedQuery.trim()) return []

      try {
        // Try RPC first
        const { data, error } = await supabase.rpc('search_direct_messages', {
          p_user_id: user.id,
          p_query: debouncedQuery.trim(),
          p_other_user_id: options.otherUserId || null,
          p_limit: options.limit || 30,
          p_offset: 0,
        })

        if (!error && data) return data as DMSearchResult[]

        // Fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('direct_messages')
          .select(
            'id, content, sender_id, receiver_id, created_at, sender:profiles!sender_id(username, avatar_url)'
          )
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .ilike('content', `%${debouncedQuery.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(options.limit || 30)

        if (fallbackError) throw fallbackError

        return (fallbackData || []).map((m: Record<string, unknown>) => ({
          message_id: m.id as string,
          content: m.content as string,
          sender_id: m.sender_id as string,
          sender_username:
            ((m.sender as Record<string, unknown>)?.username as string) || 'Utilisateur',
          sender_avatar: (m.sender as Record<string, unknown>)?.avatar_url as string | null,
          other_user_id:
            m.sender_id === user.id ? (m.receiver_id as string) : (m.sender_id as string),
          other_username: 'Utilisateur',
          created_at: m.created_at as string,
          relevance: 1,
        })) as DMSearchResult[]
      } catch {
        return []
      }
    },
    enabled: !!user?.id && !!debouncedQuery.trim() && debouncedQuery.trim().length >= 2,
    staleTime: 10_000,
  })

  const totalResults = squadResults.length + dmResults.length
  const isLoading = squadLoading || dmLoading || isSearching

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  return {
    query,
    setQuery,
    squadResults,
    dmResults,
    totalResults,
    isLoading,
    clearSearch,
    hasResults: totalResults > 0,
  }
}

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
