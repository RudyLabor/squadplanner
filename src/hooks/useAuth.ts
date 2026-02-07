import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types/database'
import { forceLeaveVoiceParty } from './useVoiceChat'

/**
 * Update daily streak and award XP for daily login
 * Called on every successful auth/profile load
 */
async function updateDailyStreak(userId: string, profile: Profile | null): Promise<Profile | null> {
  if (!profile) return null

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const lastDate = profile.streak_last_date

  // Already checked in today
  if (lastDate === today) {
    return profile
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreakDays = 1
  let xpBonus = 10 // Base daily login XP

  if (lastDate === yesterdayStr) {
    // Streak continues!
    newStreakDays = (profile.streak_days || 0) + 1

    // Bonus XP for streak milestones
    if (newStreakDays === 7) xpBonus = 100
    else if (newStreakDays === 14) xpBonus = 200
    else if (newStreakDays === 30) xpBonus = 500
    else if (newStreakDays === 100) xpBonus = 1000
    else if (newStreakDays % 7 === 0) xpBonus = 50 // Every 7 days after
  }

  // Calculate new XP and level
  const newXP = (profile.xp || 0) + xpBonus
  const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000]
  let newLevel = 1
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (newXP >= levelThresholds[i]) {
      newLevel = i + 1
      break
    }
  }

  // Update profile with new streak and XP
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      streak_days: newStreakDays,
      streak_last_date: today,
      xp: newXP,
      level: newLevel,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update streak:', error)
    return profile
  }

  console.log(`Daily streak updated: Day ${newStreakDays}, +${xpBonus} XP`)
  return updatedProfile || profile
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        // Update daily streak and XP on login
        const updatedProfile = await updateDailyStreak(session.user.id, profile)

        set({
          user: session.user,
          session,
          profile: updatedProfile,
          isLoading: false,
          isInitialized: true
        })
      } else {
        set({ isLoading: false, isInitialized: true })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          // Update daily streak and XP on login
          const updatedProfile = await updateDailyStreak(session.user.id, profile)

          set({ user: session.user, session, profile: updatedProfile })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  signUp: async (email, password, username) => {
    try {
      set({ isLoading: true })

      // Create auth user with username in metadata
      // The database trigger 'handle_new_user' will create the profile automatically
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) throw authError
      if (!data.user) throw new Error('No user returned')

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500))

      // Fetch or create the profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      let profile = existingProfile

      // If profile doesn't exist (trigger didn't work), create it manually
      if (profileError || !profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Profile create error:', createError)
          // CRITICAL: Profile MUST exist, throw error if creation fails
          throw new Error('Impossible de créer le profil. Veuillez réessayer.')
        }
        profile = newProfile
      }

      // Final check: profile MUST exist
      if (!profile) {
        throw new Error('Profil non créé. Veuillez réessayer.')
      }

      set({
        user: data.user,
        session: data.session,
        profile,
        isLoading: false
      })

      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      set({
        user: data.user,
        session: data.session,
        profile,
        isLoading: false
      })

      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error

      // OAuth redirects, so we don't need to set state here
      // The onAuthStateChange listener will handle it
      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  signOut: async () => {
    try {
      // Leave voice party before signing out
      await forceLeaveVoiceParty()

      // Clear local state first
      set({ user: null, session: null, profile: null, isLoading: true })

      // Sign out from Supabase (with global scope to clear all sessions)
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        console.error('Sign out error:', error)
      }

      // Force clear ALL Supabase auth data from localStorage
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') ||
        key.includes('supabase') ||
        key.includes('auth-token')
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Also clear sessionStorage
      const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
        key.startsWith('sb-') ||
        key.includes('supabase')
      )
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

      set({ isLoading: false })

      // Hard redirect to landing page (clears React state completely)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      set({ user: null, session: null, profile: null, isLoading: false })
      window.location.href = '/'
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      set({ profile })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      set({ profile })
    }
  },
}))
