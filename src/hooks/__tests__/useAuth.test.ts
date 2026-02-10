import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const {
  mockGetSession, mockSignUp, mockSignInWithPassword, mockSignInWithOAuth,
  mockSignOut, mockOnAuthStateChange, mockFrom, mockInitSupabase,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  mockFrom: vi.fn(),
  mockInitSupabase: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
  initSupabase: mockInitSupabase,
}))

vi.mock('../useVoiceChat', () => ({
  forceLeaveVoiceParty: vi.fn().mockResolvedValue(undefined),
}))

import { useAuthStore } from '../useAuth'

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

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.session).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isInitialized).toBe(false)
  })

  describe('initialize', () => {
    it('sets isInitialized when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
      expect(state.user).toBeNull()
    })

    it('fetches profile when session exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      const mockProfile = {
        id: 'user-1',
        username: 'testuser',
        streak_days: 0,
        streak_last_date: null,
        xp: 0,
        level: 1,
      }

      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProfile }),
            }),
          }),
        }),
      })
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
    })

    it('handles initialization error gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await useAuthStore.getState().initialize()
      })

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.isInitialized).toBe(true)
    })
  })

  describe('signIn', () => {
    it('signs in with email and password', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      const mockProfile = { id: 'user-1', username: 'testuser' }

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signIn('test@test.com', 'password')
      })

      expect(result.error).toBeNull()
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.profile).toEqual(mockProfile)
      expect(state.isLoading).toBe(false)
    })

    it('returns error on sign in failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials'),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signIn('test@test.com', 'wrong')
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid credentials')
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('signUp', () => {
    it('creates user and profile', async () => {
      const mockUser = { id: 'user-2', email: 'new@test.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      const mockProfile = { id: 'user-2', username: 'newuser' }

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('new@test.com', 'password', 'newuser')
      })

      expect(result.error).toBeNull()
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isLoading).toBe(false)
    })

    it('returns error when no user returned', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('new@test.com', 'password', 'newuser')
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('No user returned')
    })

    it('returns error on auth failure', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Email already taken'),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signUp('existing@test.com', 'password', 'user')
      })

      expect(result.error?.message).toBe('Email already taken')
    })
  })

  describe('signInWithGoogle', () => {
    it('initiates Google OAuth', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signInWithGoogle()
      })

      expect(result.error).toBeNull()
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.stringContaining('/') },
      })
    })

    it('returns error on OAuth failure', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: new Error('OAuth error') })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().signInWithGoogle()
      })

      expect(result.error?.message).toBe('OAuth error')
    })
  })

  describe('updateProfile', () => {
    it('updates profile when authenticated', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' }
      const updatedProfile = { id: 'user-1', username: 'updated', bio: 'new bio' }

      act(() => {
        useAuthStore.setState({ user: mockUser as any })
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedProfile }),
          }),
        }),
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().updateProfile({ bio: 'new bio' } as any)
      })

      expect(result.error).toBeNull()
    })

    it('returns error when not authenticated', async () => {
      act(() => {
        useAuthStore.setState({ user: null })
      })

      let result: { error: Error | null } = { error: null }
      await act(async () => {
        result = await useAuthStore.getState().updateProfile({ bio: 'test' } as any)
      })

      expect(result.error?.message).toBe('Not authenticated')
    })
  })

  describe('refreshProfile', () => {
    it('refreshes profile when user exists', async () => {
      const mockUser = { id: 'user-1' }
      const updatedProfile = { id: 'user-1', username: 'refreshed' }

      act(() => {
        useAuthStore.setState({ user: mockUser as any })
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedProfile }),
          }),
        }),
      })

      await act(async () => {
        await useAuthStore.getState().refreshProfile()
      })

      expect(useAuthStore.getState().profile).toEqual(updatedProfile)
    })

    it('does nothing when no user', async () => {
      act(() => {
        useAuthStore.setState({ user: null })
      })

      await act(async () => {
        await useAuthStore.getState().refreshProfile()
      })

      expect(mockFrom).not.toHaveBeenCalled()
    })
  })
})
