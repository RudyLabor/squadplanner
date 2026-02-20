import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export interface RecurringSession {
  id: string
  squad_id: string
  created_by: string
  title: string
  game: string | null
  recurrence_rule: string // format: 'weekly:0,2,4:21:00'
  duration_minutes: number
  min_players: number
  max_players: number
  is_active: boolean
  next_occurrence: string | null
  created_at: string
}

export interface RecurringSessionsStore {
  recurringSessions: RecurringSession[]
  isLoading: boolean
  error: string | null

  fetchRecurringSessions: (squadId: string) => Promise<void>
  createRecurringSession: (
    session: Omit<RecurringSession, 'id' | 'created_at'>
  ) => Promise<RecurringSession | null>
  updateRecurringSession: (
    id: string,
    updates: Partial<RecurringSession>
  ) => Promise<void>
  deleteRecurringSession: (id: string) => Promise<void>
  toggleActive: (id: string) => Promise<void>
}

// Helper types
interface ParsedRecurrenceRule {
  days: number[]
  hour: number
  minute: number
}

// Parse recurrence rule from format 'weekly:0,2,4:21:00'
export function parseRecurrenceRule(rule: string): ParsedRecurrenceRule {
  const parts = rule.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid recurrence rule format')
  }

  const days = parts[1]
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6)

  const timeParts = parts[2].split(':')
  const hour = parseInt(timeParts[0], 10)
  const minute = parseInt(timeParts[1], 10)

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Invalid time in recurrence rule')
  }

  return { days, hour, minute }
}

// Format recurrence rule to 'weekly:0,2,4:21:00'
export function formatRecurrenceRule(
  days: number[],
  hour: number,
  minute: number
): string {
  const sortedDays = [...new Set(days)].sort((a, b) => a - b)
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return `weekly:${sortedDays.join(',')}:${timeStr}`
}

// Get next occurrence date from recurrence rule
export function getNextOccurrence(rule: string): Date {
  const parsed = parseRecurrenceRule(rule)
  const now = new Date()
  const target = new Date()

  // Set target to the specified time
  target.setHours(parsed.hour, parsed.minute, 0, 0)

  // If today's time has passed, move to next day
  if (target < now) {
    target.setDate(target.getDate() + 1)
  }

  // Find the next occurrence on one of the specified days (0 = Sunday, 6 = Saturday)
  let daysToAdd = 0
  const maxDaysToCheck = 7

  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = new Date(target)
    checkDate.setDate(checkDate.getDate() + i)
    const dayOfWeek = checkDate.getDay()

    if (parsed.days.includes(dayOfWeek)) {
      checkDate.setHours(parsed.hour, parsed.minute, 0, 0)
      if (checkDate > now) {
        return checkDate
      }
    }
  }

  // Fallback: return target date if no match found
  return target
}

// Format recurrence rule to human-readable French string
// Example: "Mar, Jeu à 21h00"
export function formatRecurrenceDisplay(rule: string): string {
  const parsed = parseRecurrenceRule(rule)
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayLabels = parsed.days.map((d) => dayNames[d])
  const timeStr = `${String(parsed.hour).padStart(2, '0')}h${String(parsed.minute).padStart(2, '0')}`

  return `${dayLabels.join(', ')} à ${timeStr}`
}

// Create the Zustand store
export const useRecurringSessions = create<RecurringSessionsStore>((set) => ({
  recurringSessions: [],
  isLoading: false,
  error: null,

  fetchRecurringSessions: async (squadId: string) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('recurring_sessions')
        .select('*')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({
        recurringSessions: (data as RecurringSession[]) || [],
        isLoading: false,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recurring sessions'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  createRecurringSession: async (session) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('recurring_sessions')
        .insert([session])
        .select()
        .single()

      if (error) throw error

      const newSession = data as RecurringSession

      set((state) => ({
        recurringSessions: [newSession, ...state.recurringSessions],
        isLoading: false,
      }))

      return newSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recurring session'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  updateRecurringSession: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const { error } = await supabase
        .from('recurring_sessions')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        recurringSessions: state.recurringSessions.map((session) =>
          session.id === id ? { ...session, ...updates } : session
        ),
        isLoading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recurring session'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  deleteRecurringSession: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const { error } = await supabase
        .from('recurring_sessions')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        recurringSessions: state.recurringSessions.filter(
          (session) => session.id !== id
        ),
        isLoading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recurring session'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  toggleActive: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const session = useRecurringSessions.getState().recurringSessions.find(
        (s) => s.id === id
      )

      if (!session) throw new Error('Session not found')

      const { error } = await supabase
        .from('recurring_sessions')
        .update({ is_active: !session.is_active })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        recurringSessions: state.recurringSessions.map((session) =>
          session.id === id
            ? { ...session, is_active: !session.is_active }
            : session
        ),
        isLoading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle recurring session status'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },
}))
