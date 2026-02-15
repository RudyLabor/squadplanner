import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const {
  mockGetSession,
  mockSignUp,
  mockSignInWithPassword,
  mockSignInWithOAuth,
  mockSignOut,
  mockOnAuthStateChange,
  mockFrom,
  mockInitSupabase,
  mockSupabase,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockSignUp = vi.fn()
  const mockSignInWithPassword = vi.fn()
  const mockSignInWithOAuth = vi.fn()
  const mockSignOut = vi.fn()
  const mockOnAuthStateChange = vi
    .fn()
    .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  const mockFrom = vi.fn()
  const mockInitSupabase = vi.fn().mockResolvedValue(undefined)
  const mockSupabase = {
    auth: {
      getSession: mockGetSession,
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }
  return {
    mockGetSession,
    mockSignUp,
    mockSignInWithPassword,
    mockSignInWithOAuth,
    mockSignOut,
    mockOnAuthStateChange,
    mockFrom,
    mockInitSupabase,
    mockSupabase,
  }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: mockInitSupabase,
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../../lib/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}))

vi.mock('../useVoiceChat', () => ({
  forceLeaveVoiceParty: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../useSquads', () => ({
  useSquadsStore: { getState: () => ({ reset: vi.fn() }) },
}))

import { useAuthStore } from '../useAuth'

// Helper: builds a mock chain for supabase.from(table).select().eq().single()
function buildFromSelectSingleMock(resolvedData: any) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: resolvedData }),
      }),
    }),
  }
}

// Helper: builds a mock chain for profiles that supports both select and update calls
function buildProfileMock(profileData: any) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profileData }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: profileData }),
        }),
      }),
    }),
  }
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useAuthStore.setState({
        user: null,
        profile: null,
        session: null,
        isLoading: true,
        isInitialized: false,
      })
    })
  })

  // ===== INITIALIZE =====

  describe('initialize', () => {
    it('calls initSupabase, getSession, and sets up auth listener', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      // STRICT: initSupabase was called exactly once
      expect(mockInitSupabase).toHaveBeenCalledTimes(1)
      // STRICT: getSession was called to check existing session
      expect(mockGetSession).toHaveBeenCalledTimes(1)
      // STRICT: auth listener was set up
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
      // STRICT: callback function was passed to onAuthStateChange
      expect(typeof mockOnAuthStateChange.mock.calls[0][0]).toBe('function')
    })

    it('sets isInitialized=true and isLoading=false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      // STRICT: loading ended
      expect(state.isLoading).toBe(false)
      // STRICT: initialization completed
      expect(state.isInitialized).toBe(true)
      // STRICT: no user was set (no session)
      expect(state.user).toBeNull()
      // STRICT: no profile was set
      expect(state.profile).toBeNull()
    })

    it('fetches profile and sets user/session/profile when session exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const mockSession = { user: mockUser, access_token: 'tok-abc' }
      const mockProfile = {
        id: 'user-1',
        username: 'testuser',
        streak_days: 5,
        streak_last_date: new Date().toISOString().split('T')[0],
        xp: 100,
        level: 2,
      }

      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      mockFrom.mockReturnValue(buildProfileMock(mockProfile))
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      // STRICT: user was set with correct id
      expect(state.user?.id).toBe('user-1')
      // STRICT: user email matches
      expect(state.user?.email).toBe('test@test.com')
      // STRICT: session was stored
      expect(state.session?.access_token).toBe('tok-abc')
      // STRICT: profile was fetched from correct table
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      // STRICT: loading completed
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('clears session and logs out when getSession returns error (expired token)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token expired' },
      })
      mockSignOut.mockResolvedValue({ error: null })
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      // STRICT: signOut was called with local scope to clear the expired session
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
      // STRICT: state was reset to logged-out
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.profile).toBeNull()
      // STRICT: initialization completed despite error
      expect(state.isInitialized).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('handles initialization crash gracefully (network down)', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      // STRICT: app still initializes even when network is down
      expect(state.isInitialized).toBe(true)
      expect(state.isLoading).toBe(false)
      // STRICT: user remains null on error
      expect(state.user).toBeNull()
    })

    it('unsubscribes previous listener when re-initialized', async () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockOnAuthStateChange
        .mockReturnValueOnce({ data: { subscription: { unsubscribe: unsubscribe1 } } })
        .mockReturnValueOnce({ data: { subscription: { unsubscribe: unsubscribe2 } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })
      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      // STRICT: first subscription was cleaned up to prevent memory leak
      expect(unsubscribe1).toHaveBeenCalledTimes(1)
    })
  })

  // ===== SIGN IN =====

  describe('signIn', () => {
    it('calls signInWithPassword with correct email/password and sets full state', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const mockSession = { user: mockUser, access_token: 'session-token' }
      const mockProfile = { id: 'user-1', username: 'testuser', xp: 50 }

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      mockFrom.mockReturnValue(buildFromSelectSingleMock(mockProfile))

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signIn('test@test.com', 'mypass123')
      })

      // STRICT: signIn called Supabase with exact credentials
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'mypass123',
      })
      // STRICT: result is success
      expect(result.error).toBeNull()
      // STRICT: profile was fetched from 'profiles' table using user id
      expect(mockFrom).toHaveBeenCalledWith('profiles')

      const state = useAuthStore.getState()
      // STRICT: user was stored with correct id
      expect(state.user?.id).toBe('user-1')
      // STRICT: session has correct token
      expect(state.session?.access_token).toBe('session-token')
      // STRICT: profile username was set
      expect(state.profile?.username).toBe('testuser')
      // STRICT: loading finished
      expect(state.isLoading).toBe(false)
    })

    it('propagates error message from invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signIn('test@test.com', 'wrong')
      })

      // STRICT: error message is exactly what Supabase returned
      expect(result.error?.message).toBe('Invalid login credentials')
      // STRICT: loading was reset after failure
      expect(useAuthStore.getState().isLoading).toBe(false)
      // STRICT: no user was set on failure
      expect(useAuthStore.getState().user).toBeNull()
      // STRICT: signInWithPassword was still called with the wrong password
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'wrong',
      })
    })

    it('sets isLoading=true while sign-in is in progress', async () => {
      let capturedLoading = false
      mockSignInWithPassword.mockImplementation(async () => {
        // Capture loading state mid-flight
        capturedLoading = useAuthStore.getState().isLoading
        return {
          data: { user: { id: 'u1' }, session: { user: { id: 'u1' } } },
          error: null,
        }
      })
      mockFrom.mockReturnValue(buildFromSelectSingleMock({ id: 'u1', username: 'test' }))

      await act(async () => {
        await useAuthStore.getState().signIn('a@b.com', 'pass')
      })

      // STRICT: isLoading was true while the async call was in flight
      expect(capturedLoading).toBe(true)
    })
  })

  // ===== SIGN UP =====

  describe('signUp', () => {
    it('creates user with signUp and passes username in metadata', async () => {
      const mockUser = { id: 'user-2', email: 'new@test.com' }
      const mockSession = { user: mockUser, access_token: 'new-token' }
      const mockProfile = { id: 'user-2', username: 'newuser' }

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      mockFrom.mockReturnValue(buildFromSelectSingleMock(mockProfile))

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('new@test.com', 'securepass', 'newuser')
      })

      // STRICT: signUp was called with email, password, and username in options.data
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'securepass',
        options: { data: { username: 'newuser' } },
      })
      // STRICT: result is success
      expect(result.error).toBeNull()

      const state = useAuthStore.getState()
      // STRICT: user.id matches the returned user
      expect(state.user?.id).toBe('user-2')
      // STRICT: session was stored
      expect(state.session?.access_token).toBe('new-token')
      // STRICT: loading finished
      expect(state.isLoading).toBe(false)
    })

    it('creates profile via insert when existing profile not found', async () => {
      const mockUser = { id: 'user-3', email: 'fresh@test.com' }
      const mockInsertedProfile = { id: 'user-3', username: 'freshuser' }

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser, access_token: 't' } },
        error: null,
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertedProfile, error: null }),
        }),
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
        insert: mockInsert,
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('fresh@test.com', 'pass', 'freshuser')
      })

      // STRICT: profile insert was called because existing profile check returned null
      expect(mockInsert).toHaveBeenCalled()
      // STRICT: insert payload contains user id and username
      const insertArg = mockInsert.mock.calls[0][0]
      expect(insertArg.id).toBe('user-3')
      expect(insertArg.username).toBe('freshuser')
      // STRICT: no error returned
      expect(result.error).toBeNull()
    })

    it('returns error when signUp returns no user (email confirmation required)', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('new@test.com', 'password', 'user')
      })

      // STRICT: error message is exactly the custom error from the hook
      expect(result.error?.message).toBe('No user returned')
      // STRICT: loading was reset
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('returns error when auth provider rejects (email already taken)', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('User already registered'),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('dupe@test.com', 'pass', 'user')
      })

      // STRICT: the exact Supabase auth error is propagated
      expect(result.error?.message).toBe('User already registered')
    })
  })

  // ===== SIGN IN WITH GOOGLE =====

  describe('signInWithGoogle', () => {
    it('calls signInWithOAuth with google provider and correct redirectTo', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signInWithGoogle()
      })

      // STRICT: OAuth was called with google provider
      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1)
      const callArgs = mockSignInWithOAuth.mock.calls[0][0]
      expect(callArgs.provider).toBe('google')
      // STRICT: redirectTo uses window.location.origin + '/'
      expect(callArgs.options.redirectTo).toContain('/')
      // STRICT: no error on success
      expect(result.error).toBeNull()
    })

    it('returns OAuth error and resets loading', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        error: new Error('OAuth provider unavailable'),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signInWithGoogle()
      })

      // STRICT: exact error message propagated
      expect(result.error?.message).toBe('OAuth provider unavailable')
      // STRICT: isLoading reset after failure
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  // ===== SIGN OUT =====

  describe('signOut', () => {
    it('clears state, calls signOut with global scope, and redirects', async () => {
      // Set up authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1' } as any,
          session: { access_token: 'tok' } as any,
          profile: { id: 'user-1', username: 'test' } as any,
          isLoading: false,
        })
      })

      mockSignOut.mockResolvedValue({ error: null })
      const originalReplace = window.location.replace
      const mockReplace = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { ...window.location, replace: mockReplace, origin: 'http://localhost:3000' },
        writable: true,
      })

      await act(async () => {
        await useAuthStore.getState().signOut()
      })

      const state = useAuthStore.getState()
      // STRICT: user was cleared
      expect(state.user).toBeNull()
      // STRICT: session was cleared
      expect(state.session).toBeNull()
      // STRICT: profile was cleared
      expect(state.profile).toBeNull()
      // STRICT: signOut was called with global scope
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' })
      // STRICT: redirect to home page
      expect(mockReplace).toHaveBeenCalledWith('/')

      // Restore
      Object.defineProperty(window, 'location', { value: { ...window.location, replace: originalReplace }, writable: true })
    })
  })

  // ===== UPDATE PROFILE =====

  describe('updateProfile', () => {
    it('calls update on profiles table with correct user id and returns null error', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const updatedProfile = { id: 'user-1', username: 'updated', bio: 'Hello world' }

      act(() => {
        useAuthStore.setState({ user: mockUser as any })
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockReturnValue({
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedProfile }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().updateProfile({ bio: 'Hello world' } as any)
      })

      // STRICT: result is success
      expect(result.error).toBeNull()
      // STRICT: update was called on 'profiles' table
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      // STRICT: update was called with the partial update data
      expect(mockUpdate).toHaveBeenCalledWith({ bio: 'Hello world' })
      // STRICT: profile in store was refreshed
      expect(useAuthStore.getState().profile).toEqual(updatedProfile)
    })

    it('returns "Not authenticated" error when user is null', async () => {
      act(() => {
        useAuthStore.setState({ user: null })
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().updateProfile({ bio: 'test' } as any)
      })

      // STRICT: exact error message for unauthenticated update
      expect(result.error?.message).toBe('Not authenticated')
      // STRICT: no Supabase calls were made
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns error when Supabase update fails', async () => {
      act(() => {
        useAuthStore.setState({ user: { id: 'user-1' } as any })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Row level security violation') }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().updateProfile({ username: 'hacker' } as any)
      })

      // STRICT: Supabase error is propagated
      expect(result.error?.message).toBe('Row level security violation')
    })
  })

  // ===== REFRESH PROFILE =====

  describe('refreshProfile', () => {
    it('fetches profile from Supabase and updates store', async () => {
      const mockUser = { id: 'user-1' }
      const freshProfile = { id: 'user-1', username: 'refreshed', xp: 999 }

      act(() => {
        useAuthStore.setState({
          user: mockUser as any,
          profile: { id: 'user-1', username: 'stale', xp: 0 } as any,
        })
      })

      mockFrom.mockReturnValue(buildFromSelectSingleMock(freshProfile))

      await act(async () => {
        await useAuthStore.getState().refreshProfile()
      })

      // STRICT: profile was updated with fresh data
      expect(useAuthStore.getState().profile?.username).toBe('refreshed')
      expect((useAuthStore.getState().profile as any)?.xp).toBe(999)
      // STRICT: fetched from profiles table
      expect(mockFrom).toHaveBeenCalledWith('profiles')
    })

    it('does nothing and makes no Supabase calls when user is null', async () => {
      act(() => {
        useAuthStore.setState({ user: null, profile: null })
      })

      await act(async () => {
        await useAuthStore.getState().refreshProfile()
      })

      // STRICT: no Supabase calls at all when unauthenticated
      expect(mockFrom).not.toHaveBeenCalled()
      // STRICT: profile remains null
      expect(useAuthStore.getState().profile).toBeNull()
    })

    it('keeps existing profile when Supabase returns null', async () => {
      const existingProfile = { id: 'user-1', username: 'existing' } as any
      act(() => {
        useAuthStore.setState({ user: { id: 'user-1' } as any, profile: existingProfile })
      })

      mockFrom.mockReturnValue(buildFromSelectSingleMock(null))

      await act(async () => {
        await useAuthStore.getState().refreshProfile()
      })

      // STRICT: profile not overwritten with null (the hook checks `if (profile)`)
      expect(useAuthStore.getState().profile).toEqual(existingProfile)
    })
  })
})
