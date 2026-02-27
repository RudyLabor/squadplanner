import { create } from 'zustand'
import { supabase, initSupabase } from '../lib/supabaseMinimal'
import { queryClient } from '../lib/queryClient'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types/database'
import { updateDailyStreak } from './useAuthStreak'
import { usePremiumStore } from './usePremium'
import { useGamificationStore } from '../stores/useGamificationStore'
import { showSuccess } from '../lib/toast'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  initialize: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

// Track the auth subscription to prevent memory leaks
let _authSubscription: { unsubscribe: () => void } | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      await initSupabase()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError) {
        // Invalid or expired refresh token — clear local session and continue as logged-out
        console.warn('Auth session error (invalid/expired token):', sessionError.message)
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
        set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true })
      } else if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        const updatedProfile = await updateDailyStreak(session.user.id, profile)
        // BUG-10: Await premium status fetch to prevent badge flickering on login
        await usePremiumStore
          .getState()
          .fetchPremiumStatus()
          .catch(() => {})
        // Sync gamification store with DB profile data (xp, level)
        if (updatedProfile) {
          useGamificationStore.getState().syncFromDB(updatedProfile)
        }
        set({
          user: session.user,
          session,
          profile: updatedProfile,
          isLoading: false,
          isInitialized: true,
        })
      } else {
        set({ isLoading: false, isInitialized: true })
      }

      // Clean up previous subscription if initialize is called again
      _authSubscription?.unsubscribe()

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          const updatedProfile = await updateDailyStreak(session.user.id, profile)
          set({ user: session.user, session, profile: updatedProfile })
          // Sync gamification store with DB profile data
          if (updatedProfile) {
            useGamificationStore.getState().syncFromDB(updatedProfile)
          }
          // Refresh premium status on every sign-in
          usePremiumStore.getState().fetchPremiumStatus()
          // Show welcome toast for OAuth sign-in (Google redirect)
          if (session.user.app_metadata?.provider === 'google') {
            const isNewUser =
              profile?.created_at && Date.now() - new Date(profile.created_at).getTime() < 60000
            showSuccess(
              isNewUser ? 'Compte créé avec succès ! Bienvenue !' : 'Content de te revoir !'
            )
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null })
          usePremiumStore.getState().reset()
        }
      })
      _authSubscription = subscription
    } catch (error) {
      console.warn('Auth initialization error:', error)
      set({ isLoading: false, isInitialized: true })
    }
  },

  signUp: async (email, password, username) => {
    try {
      set({ isLoading: true })
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (authError) throw authError
      if (!data.user) throw new Error('No user returned')

      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      let profile = existingProfile
      if (profileError || !profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        if (createError)
          throw new Error('Impossible de créer le profil. Réessaie dans quelques instants.')
        profile = newProfile
      }

      if (!profile) throw new Error('Profil non créé. Réessaie dans quelques instants.')

      set({ user: data.user, session: data.session, profile, isLoading: false })
      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      set({ user: data.user, session: data.session, profile, isLoading: false })
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
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      set({ isLoading: false })
      return { error: error as Error }
    }
  },

  signOut: async () => {
    try {
      // 1. Clear React Query cache first to prevent stale data restoring the session
      queryClient.clear()

      // 2. Reset Zustand state immediately
      set({ user: null, session: null, profile: null, isLoading: true })

      // 3. Leave voice party (non-blocking)
      try {
        const { forceLeaveVoiceParty } = await import('./useVoiceChat')
        await forceLeaveVoiceParty()
      } catch {
        /* voice module may not be loaded */
      }

      // 4. Reset squads store
      try {
        const { useSquadsStore } = await import('./useSquads')
        useSquadsStore.getState().reset()
      } catch {
        /* squads module may not be loaded */
      }

      // 5. Clear offline mutation queue to prevent cross-user replay
      // SEC: Queued mutations contain auth tokens from the previous user
      try {
        const { clearMutationQueue } = await import('../lib/offlineMutationQueue')
        await clearMutationQueue()
      } catch {
        /* offline mutation module may not be loaded */
      }

      // 6. Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) console.warn('Sign out error:', error)

      // 7. Clear all auth-related storage
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')
      )
      keysToRemove.forEach((key) => localStorage.removeItem(key))
      const sessionKeysToRemove = Object.keys(sessionStorage).filter(
        (key) => key.startsWith('sb-') || key.includes('supabase')
      )
      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))

      // 8. Final state update and redirect
      set({ isLoading: false })
      window.location.replace('/')
    } catch (error) {
      console.warn('Sign out error:', error)
      queryClient.clear()
      set({ user: null, session: null, profile: null, isLoading: false })
      window.location.replace('/')
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) throw error
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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
      set({ profile })
      // Keep gamification store in sync with DB
      useGamificationStore.getState().syncFromDB(profile)
    }
  },
}))
