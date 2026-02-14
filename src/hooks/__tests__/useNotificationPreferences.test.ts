import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const { mockSupabase, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    rpc: vi.fn(),
    from: mockFrom,
    storage: { from: vi.fn() },
    functions: { invoke: vi.fn() },
  }
  return { mockSupabase, mockFrom, mockGetSession, mockGetUser }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    }
  ),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

import { useNotificationPreferences, NOTIFICATION_CATEGORIES } from '../useNotificationPreferences'
import { useAuthStore } from '../useAuth'
import { showSuccess, showError } from '../../lib/toast'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('NOTIFICATION_CATEGORIES', () => {
  it('has 7 categories', () => {
    expect(NOTIFICATION_CATEGORIES).toHaveLength(7)
    const keys = NOTIFICATION_CATEGORIES.map((c) => c.key)
    expect(keys).toContain('sessions')
    expect(keys).toContain('squad')
    expect(keys).toContain('messages')
    expect(keys).toContain('voice')
    expect(keys).toContain('social')
    expect(keys).toContain('gamification')
    expect(keys).toContain('ai')
  })

  it('sessions category has 10 settings', () => {
    const sessions = NOTIFICATION_CATEGORIES.find((c) => c.key === 'sessions')
    expect(sessions).toBeDefined()
    expect(sessions!.settings).toHaveLength(10)
  })

  it('messages category includes dm_received', () => {
    const messages = NOTIFICATION_CATEGORIES.find((c) => c.key === 'messages')
    expect(messages).toBeDefined()
    const settingKeys = messages!.settings.map((s) => s.key)
    expect(settingKeys).toContain('dm_received')
  })
})

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches preferences from supabase', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const mockPrefs = {
      user_id: 'user-1',
      sound_enabled: true,
      vibration_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: mockPrefs, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toEqual(mockPrefs)
    })

    expect(mockFrom).toHaveBeenCalledWith('notification_preferences')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('creates default prefs when none exist (PGRST116 error)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const defaultPrefs = { user_id: 'user-1', sound_enabled: true, vibration_enabled: true }

    // First call: select returns PGRST116
    // Second call (insert): returns created defaults
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // select().eq().single() returns PGRST116
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            }),
          }),
        }
      }
      // insert().select().single() returns created default
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: defaultPrefs,
              error: null,
            }),
          }),
        }),
      }
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toEqual(defaultPrefs)
    })
  })

  it('updatePreference calls supabase update with correct key-value', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    // Initial fetch
    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1', sound_enabled: true },
      error: null,
    })
    const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq })

    // Update mock
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toBeTruthy()
    })

    act(() => {
      result.current.updatePreference('session_created', false)
    })

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ session_created: false })
      expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'user-1')
    })
  })

  it('updateQuietHours updates quiet_hours_start and quiet_hours_end', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1' },
      error: null,
    })
    const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toBeTruthy()
    })

    act(() => {
      result.current.updateQuietHours('22:00', '08:00')
    })

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      })
    })
  })

  it('toggleSound updates sound_enabled', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1', sound_enabled: true },
      error: null,
    })
    const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toBeTruthy()
    })

    act(() => {
      result.current.toggleSound(false)
    })

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ sound_enabled: false })
    })
  })

  it('toggleCategory updates all settings in a category', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1' },
      error: null,
    })
    const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toBeTruthy()
    })

    act(() => {
      result.current.toggleCategory('messages', false)
    })

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        message_received: false,
        message_mention: false,
        message_reaction: false,
        message_thread_reply: false,
        dm_received: false,
      })
    })
  })

  it('toggleVibration updates vibration_enabled', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' }, profile: null } as any)

    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1', vibration_enabled: true },
      error: null,
    })
    const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq })

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.preferences).toBeTruthy()
    })

    act(() => {
      result.current.toggleVibration(false)
    })

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ vibration_enabled: false })
    })
  })
})
