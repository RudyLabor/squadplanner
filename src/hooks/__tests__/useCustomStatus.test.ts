import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const { mockSupabase, mockRpc, mockFrom } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    rpc: mockRpc,
    from: mockFrom,
    storage: { from: vi.fn() },
    functions: { invoke: vi.fn() },
  }
  return { mockSupabase, mockRpc, mockFrom, mockGetSession, mockGetUser }
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
    vi.fn().mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
    }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: null }),
    }
  ),
}))

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

import { useCustomStatus, STATUS_PRESETS, STATUS_DURATIONS } from '../useCustomStatus'
import { useAuthStore } from '../useAuth'
import { showSuccess, showError } from '../../lib/toast'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('STATUS_PRESETS', () => {
  it('has 8 presets with emoji and text', () => {
    expect(STATUS_PRESETS).toHaveLength(8)
    STATUS_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('emoji')
      expect(preset).toHaveProperty('text')
      expect(preset.emoji.length).toBeGreaterThan(0)
      expect(preset.text.length).toBeGreaterThan(0)
    })
  })
})

describe('STATUS_DURATIONS', () => {
  it('has 5 durations including permanent (null minutes)', () => {
    expect(STATUS_DURATIONS).toHaveLength(5)
    const permanent = STATUS_DURATIONS.find((d) => d.label === 'Permanent')
    expect(permanent).toBeDefined()
    expect(permanent!.minutes).toBeNull()

    STATUS_DURATIONS.forEach((duration) => {
      expect(duration).toHaveProperty('label')
      expect(duration).toHaveProperty('minutes')
    })
  })
})

describe('useCustomStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null currentStatus when no profile', () => {
    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })
    expect(result.current.currentStatus).toBeNull()
  })

  it('returns active status when profile has non-expired status', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        status_text: 'En jeu',
        status_emoji: '🎮',
        status_expires_at: null,
      },
    } as any)

    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })
    expect(result.current.currentStatus).not.toBeNull()
    expect(result.current.currentStatus!.text).toBe('En jeu')
    expect(result.current.currentStatus!.emoji).toBe('🎮')
    expect(result.current.currentStatus!.isActive).toBe(true)
  })

  it('returns inactive status when expired', () => {
    const pastDate = new Date(Date.now() - 60000).toISOString()
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        status_text: 'En jeu',
        status_emoji: '🎮',
        status_expires_at: pastDate,
      },
    } as any)

    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })
    expect(result.current.currentStatus).not.toBeNull()
    expect(result.current.currentStatus!.isActive).toBe(false)
  })

  it('setStatus calls supabase.rpc with correct params', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
    } as any)

    mockRpc.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })

    act(() => {
      result.current.setStatus({ statusText: 'En jeu', statusEmoji: '🎮', durationMinutes: 30 })
    })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('update_user_status', {
        p_user_id: 'user-1',
        p_status_text: 'En jeu',
        p_status_emoji: '🎮',
        p_duration_minutes: 30,
      })
    })
  })

  it('setStatus falls back to direct update when RPC fails', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
    } as any)

    mockRpc.mockResolvedValue({ error: { message: 'function not found' } })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })

    act(() => {
      result.current.setStatus({ statusText: 'En jeu', statusEmoji: '🎮', durationMinutes: null })
    })

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status_text: 'En jeu',
          status_emoji: '🎮',
          status_expires_at: null,
        })
      )
    })
  })

  it('clearStatus calls mutation with null values', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
    } as any)

    mockRpc.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useCustomStatus(), { wrapper: createWrapper() })

    act(() => {
      result.current.clearStatus()
    })

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('update_user_status', {
        p_user_id: 'user-1',
        p_status_text: null,
        p_status_emoji: null,
        p_duration_minutes: null,
      })
    })
  })
})
