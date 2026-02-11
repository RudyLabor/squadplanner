import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Types
export type CallType = 'all' | 'incoming' | 'outgoing' | 'missed'

interface CallerReceiverProfile {
  id: string
  username: string
  avatar_url: string | null
}

export interface CallRecord {
  id: string
  caller_id: string
  receiver_id: string
  status: 'answered' | 'missed' | 'rejected'
  duration_seconds: number | null
  created_at: string
  ended_at: string | null
  // Joined data - Supabase returns arrays for relations
  caller: CallerReceiverProfile[] | CallerReceiverProfile | null
  receiver: CallerReceiverProfile[] | CallerReceiverProfile | null
}

export interface CallHistoryItem {
  id: string
  contactId: string
  contactName: string
  contactAvatar: string | null
  type: 'incoming' | 'outgoing'
  status: 'answered' | 'missed' | 'rejected'
  durationSeconds: number | null
  createdAt: Date
}

interface CallHistoryState {
  calls: CallHistoryItem[]
  isLoading: boolean
  error: string | null
  filter: CallType

  // Actions
  fetchCallHistory: () => Promise<void>
  setFilter: (filter: CallType) => void
  getFilteredCalls: () => CallHistoryItem[]
  clearError: () => void
}

export const useCallHistoryStore = create<CallHistoryState>((set, get) => ({
  calls: [],
  isLoading: false,
  error: null,
  filter: 'all',

  fetchCallHistory: async () => {
    set({ isLoading: true, error: null })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        set({ error: 'Utilisateur non connecté', isLoading: false })
        return
      }

      // Check if the calls table exists by trying a simple query
      // If table doesn't exist, we'll get an error and show empty state
      const { data: callsData, error: dbError } = await supabase
        .from('calls')
        .select(`
          id,
          caller_id,
          receiver_id,
          status,
          duration_seconds,
          created_at,
          ended_at,
          caller:profiles!calls_caller_id_fkey(id, username, avatar_url),
          receiver:profiles!calls_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (dbError) {
        console.warn('[CallHistory] Error fetching:', dbError)
        // If table doesn't exist or relation error, show empty state instead of error
        if (dbError.code === '42P01' || dbError.code === 'PGRST200' || dbError.message?.includes('relation')) {
          // Table doesn't exist - show empty state (feature not yet enabled)
          set({ calls: [], isLoading: false, error: null })
          return
        }
        set({ error: 'Erreur lors du chargement de l\'historique', isLoading: false })
        return
      }

      // Transform to CallHistoryItem
      const calls: CallHistoryItem[] = (callsData || []).map((call: CallRecord) => {
        const isOutgoing = call.caller_id === user.id
        // Supabase peut retourner un tableau ou un objet selon la relation
        const rawContact = isOutgoing ? call.receiver : call.caller
        const contact = Array.isArray(rawContact) ? rawContact[0] : rawContact

        return {
          id: call.id,
          contactId: contact?.id || '',
          contactName: contact?.username || 'Utilisateur inconnu',
          contactAvatar: contact?.avatar_url || null,
          type: isOutgoing ? 'outgoing' : 'incoming',
          status: call.status,
          durationSeconds: call.duration_seconds,
          createdAt: new Date(call.created_at),
        }
      })

      set({ calls, isLoading: false })
    } catch (error) {
      console.warn('[CallHistory] Error:', error)
      // For any unexpected error, show empty state rather than blocking the UI
      set({
        calls: [],
        error: null,
        isLoading: false
      })
    }
  },

  setFilter: (filter: CallType) => {
    set({ filter })
  },

  getFilteredCalls: () => {
    const { calls, filter } = get()

    switch (filter) {
      case 'incoming':
        return calls.filter(c => c.type === 'incoming')
      case 'outgoing':
        return calls.filter(c => c.type === 'outgoing')
      case 'missed':
        // Ne filtrer que les appels manqués (pas les rejets)
        return calls.filter(c => c.status === 'missed')
      default:
        return calls
    }
  },

  clearError: () => set({ error: null }),
}))

// Format call duration
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return ''

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins === 0) {
    return `${secs}s`
  }

  return `${mins} min ${secs.toString().padStart(2, '0')}s`
}

// Format relative time with date (Issue #19 - show dates in call history)
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  // Today - show "Aujourd'hui 16:53"
  if (diffDays === 0) {
    return `Aujourd'hui ${timeStr}`
  }

  // Yesterday - show "Hier 13:57"
  if (diffDays === 1) {
    return `Hier ${timeStr}`
  }

  // This week - show "Lun 3 fév. 13:32"
  if (diffDays < 7) {
    const dayMonth = date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
    return `${dayMonth} ${timeStr}`
  }

  // Older - show "3 fév. 13:32"
  const dayMonth = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
  return `${dayMonth} ${timeStr}`
}
