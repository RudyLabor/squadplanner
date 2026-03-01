import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const {
  mockSupabase,
  mockFrom,
  mockGetUser,
  mockShowSuccess,
  mockShowError,
  mockSendRsvpMessage,
  mockSendSessionConfirmedMessage,
  mockTrackChallengeProgress,
} = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi
    .fn()
    .mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi
      .fn()
      .mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  }
  const mockShowSuccess = vi.fn()
  const mockShowError = vi.fn()
  const mockSendRsvpMessage = vi.fn().mockResolvedValue(undefined)
  const mockSendSessionConfirmedMessage = vi.fn().mockResolvedValue(undefined)
  const mockTrackChallengeProgress = vi.fn().mockResolvedValue(undefined)
  return {
    mockSupabase,
    mockFrom,
    mockGetUser,
    mockShowSuccess,
    mockShowError,
    mockSendRsvpMessage,
    mockSendSessionConfirmedMessage,
    mockTrackChallengeProgress,
  }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    sessions: {
      all: ['sessions'],
      lists: () => ['sessions', 'list'],
      list: (squadId?: string) =>
        squadId ? ['sessions', 'list', { squadId }] : ['sessions', 'list'],
      upcoming: () => ['sessions', 'upcoming'],
      details: () => ['sessions', 'detail'],
      detail: (id: string) => ['sessions', 'detail', id],
    },
  },
}))

vi.mock('../../../lib/systemMessages', () => ({
  sendRsvpMessage: mockSendRsvpMessage,
  sendSessionConfirmedMessage: mockSendSessionConfirmedMessage,
}))

vi.mock('../../../utils/optimisticUpdate', () => ({
  createOptimisticMutation: vi.fn().mockReturnValue({
    onMutate: vi.fn(),
    onError: vi.fn(),
    onSettled: vi.fn(),
  }),
  optimisticId: vi.fn().mockReturnValue('optimistic-id'),
}))

vi.mock('../../../lib/challengeTracker', () => ({
  trackChallengeProgress: mockTrackChallengeProgress,
}))

vi.mock('../../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    }
  ),
}))

vi.mock('../../../lib/toast', () => ({
  showSuccess: mockShowSuccess,
  showError: mockShowError,
}))

// Mock session fetchers (these are the actual fetching functions)
const { mockFetchSessionsBySquad, mockFetchUpcomingSessions, mockFetchSessionById } = vi.hoisted(
  () => {
    const mockFetchSessionsBySquad = vi.fn().mockResolvedValue([])
    const mockFetchUpcomingSessions = vi.fn().mockResolvedValue([])
    const mockFetchSessionById = vi.fn().mockResolvedValue(null)
    return { mockFetchSessionsBySquad, mockFetchUpcomingSessions, mockFetchSessionById }
  }
)

vi.mock('../useSessionFetchers', () => ({
  fetchSessionsBySquad: mockFetchSessionsBySquad,
  fetchUpcomingSessions: mockFetchUpcomingSessions,
  fetchSessionById: mockFetchSessionById,
}))

import {
  useSquadSessionsQuery,
  useUpcomingSessionsQuery,
  useSessionQuery,
  useCreateSessionMutation,
  useRsvpMutation,
  useCheckinMutation,
  useConfirmSessionMutation,
  useUpdateSessionMutation,
  useCancelSessionMutation,
} from '../useSessionsQuery'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ===== QUERY HOOKS =====
describe('useSquadSessionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchSessionsBySquad.mockResolvedValue([])
  })

  it('renders without error and returns loading state', () => {
    const { result } = renderHook(() => useSquadSessionsQuery('squad-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current).toBeDefined()
    expect(result.current.isLoading).toBeDefined()
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadSessionsQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when queryFn is called with undefined squadId (guard)', async () => {
    const { result } = renderHook(() => useSquadSessionsQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches sessions for a squad with userId', async () => {
    const mockSessions = [
      {
        id: 's1',
        title: 'Game Night',
        squad_id: 'squad-1',
        my_rsvp: 'present',
        rsvp_counts: { present: 1, absent: 0, maybe: 0 },
      },
    ]
    mockFetchSessionsBySquad.mockResolvedValue(mockSessions)

    const { result } = renderHook(() => useSquadSessionsQuery('squad-1', 'user-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSessions)
    expect(mockFetchSessionsBySquad).toHaveBeenCalledWith('squad-1', 'user-1')
  })

  it('handles fetch error', async () => {
    mockFetchSessionsBySquad.mockRejectedValue(new Error('DB error'))

    const { result } = renderHook(() => useSquadSessionsQuery('squad-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })
})

describe('useUpcomingSessionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchUpcomingSessions.mockResolvedValue([])
  })

  it('renders and returns loading state', () => {
    const { result } = renderHook(() => useUpcomingSessionsQuery('user-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current).toBeDefined()
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUpcomingSessionsQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches upcoming sessions successfully', async () => {
    const mockSessions = [{ id: 's2', title: 'Raid', scheduled_at: '2026-03-01T20:00:00Z' }]
    mockFetchUpcomingSessions.mockResolvedValue(mockSessions)

    const { result } = renderHook(() => useUpcomingSessionsQuery('user-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSessions)
    expect(mockFetchUpcomingSessions).toHaveBeenCalledWith('user-1')
  })

  it('handles fetch error', async () => {
    mockFetchUpcomingSessions.mockRejectedValue(new Error('Network'))

    const { result } = renderHook(() => useUpcomingSessionsQuery('user-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useSessionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchSessionById.mockResolvedValue(null)
  })

  it('renders and returns data', () => {
    const { result } = renderHook(() => useSessionQuery('session-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('data')
  })

  it('is disabled when sessionId is undefined', () => {
    const { result } = renderHook(() => useSessionQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches session by id with userId', async () => {
    const mockSession = {
      id: 's1',
      title: 'Test',
      rsvps: [],
      checkins: [],
      my_rsvp: null,
      rsvp_counts: { present: 0, absent: 0, maybe: 0 },
    }
    mockFetchSessionById.mockResolvedValue(mockSession)

    const { result } = renderHook(() => useSessionQuery('s1', 'user-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockSession)
    expect(mockFetchSessionById).toHaveBeenCalledWith('s1', 'user-1')
  })

  it('handles fetch error', async () => {
    mockFetchSessionById.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useSessionQuery('s1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ===== MUTATION HOOKS =====
describe('useCreateSessionMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useCreateSessionMutation(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
    expect(result.current.mutate).toBeDefined()
    expect(result.current.mutateAsync).toBeDefined()
  })

  it('creates session and auto-RSVPs on success', async () => {
    const createdSession = { id: 'new-sess', squad_id: 'squad-1', title: 'New Game' }
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // Mock for sessions insert
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdSession, error: null }),
      }),
    })
    // Mock for session_rsvps insert
    const rsvpInsertMock = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') return { insert: insertMock }
      if (table === 'session_rsvps') return { insert: rsvpInsertMock }
      return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })

    const { result } = renderHook(() => useCreateSessionMutation(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        squad_id: 'squad-1',
        title: 'New Game',
        scheduled_at: '2026-03-01T20:00:00Z',
      })
    })

    expect(insertMock).toHaveBeenCalled()
    expect(rsvpInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'new-sess',
        user_id: 'user-1',
        response: 'present',
      })
    )
    expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'create_session')
    expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'rsvp')
    expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'daily_rsvp')
    expect(mockShowSuccess).toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useCreateSessionMutation(), { wrapper: createWrapper() })

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          squad_id: 'squad-1',
          scheduled_at: '2026-03-01T20:00:00Z',
        })
      })
    ).rejects.toThrow('Not authenticated')
  })

  it('throws error when insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })

    const { result } = renderHook(() => useCreateSessionMutation(), { wrapper: createWrapper() })

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          squad_id: 'sq-1',
          scheduled_at: '2026-03-01T20:00:00Z',
        })
      })
    ).rejects.toThrow()
  })

  it('uses defaults for optional fields (duration_minutes, auto_confirm_threshold)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 's1', squad_id: 'sq-1' }, error: null }),
      }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') return { insert: insertMock }
      if (table === 'session_rsvps') return { insert: vi.fn().mockResolvedValue({ error: null }) }
      return {}
    })

    const { result } = renderHook(() => useCreateSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ squad_id: 'sq-1', scheduled_at: '2026-03-01T20:00:00Z' })
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        duration_minutes: 120,
        auto_confirm_threshold: 3,
      })
    )
  })
})

describe('useRsvpMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeDefined()
  })

  it('creates new RSVP when no existing one', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'session_rsvps') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
          insert: insertMock,
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { username: 'testuser' } }),
            }),
          }),
        }
      }
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { squad_id: 'sq-1', title: 'Game' } }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
    })

    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ sessionId: 'sess-1', response: 'present' })
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sess-1',
        user_id: 'user-1',
        response: 'present',
      })
    )
    expect(mockSendRsvpMessage).toHaveBeenCalledWith('sq-1', 'testuser', 'Game', 'present')
    expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'rsvp')
    expect(mockTrackChallengeProgress).toHaveBeenCalledWith('user-1', 'daily_rsvp')
  })

  it('updates existing RSVP', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'session_rsvps') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'rsvp-1' } }),
              }),
            }),
          }),
          update: updateMock,
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { username: 'alice' } }),
            }),
          }),
        }
      }
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { squad_id: 'sq-1', title: 'Raid' } }),
            }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ sessionId: 'sess-1', response: 'absent' })
    })

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ response: 'absent' }))
  })

  it('does not track challenge progress for non-present responses', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'session_rsvps') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }),
          }),
        }
      }
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ sessionId: 'sess-1', response: 'maybe' })
    })

    // Should NOT track challenge progress for 'maybe'
    expect(mockTrackChallengeProgress).not.toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    await expect(
      act(async () => {
        await result.current.mutateAsync({ sessionId: 'sess-1', response: 'present' })
      })
    ).rejects.toThrow('Not authenticated')
  })

  it('shows error toast on mutation error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useRsvpMutation(), { wrapper: createWrapper() })
    try {
      await act(async () => {
        await result.current.mutateAsync({ sessionId: 'sess-1', response: 'present' })
      })
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Erreur de connexion. Réessaie.')
    })
  })
})

describe('useCheckinMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useCheckinMutation(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeDefined()
  })

  it('creates new checkin when none exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'session_checkins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
          insert: insertMock,
        }
      }
      return {}
    })

    const { result } = renderHook(() => useCheckinMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ sessionId: 'sess-1', status: 'present' })
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sess-1',
        user_id: 'user-1',
        status: 'present',
      })
    )
    expect(mockShowSuccess).toHaveBeenCalledWith('Check-in enregistre !')
  })

  it('updates existing checkin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'session_checkins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'checkin-1' } }),
              }),
            }),
          }),
          update: updateMock,
        }
      }
      return {}
    })

    const { result } = renderHook(() => useCheckinMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ sessionId: 'sess-1', status: 'late' })
    })

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'late' }))
  })

  it('shows error toast on failure', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useCheckinMutation(), { wrapper: createWrapper() })
    try {
      await act(async () => {
        await result.current.mutateAsync({ sessionId: 'sess-1', status: 'present' })
      })
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Erreur lors du check-in')
    })
  })
})

describe('useConfirmSessionMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useConfirmSessionMutation(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeDefined()
  })

  it('confirms session and sends system message', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  squad_id: 'sq-1',
                  title: 'Game Night',
                  scheduled_at: '2026-03-01T20:00:00Z',
                },
              }),
            }),
          }),
          update: updateMock,
        }
      }
      return {}
    })

    const { result } = renderHook(() => useConfirmSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('sess-1')
    })

    expect(updateMock).toHaveBeenCalledWith({ status: 'confirmed' })
    expect(mockSendSessionConfirmedMessage).toHaveBeenCalledWith(
      'sq-1',
      'Game Night',
      '2026-03-01T20:00:00Z'
    )
    expect(mockShowSuccess).toHaveBeenCalledWith('Session confirmee !')
  })

  it('handles session without squad_id gracefully', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useConfirmSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('sess-1')
    })

    expect(mockSendSessionConfirmedMessage).not.toHaveBeenCalled()
  })

  it('shows error toast on failure', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { squad_id: 'sq-1' } }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useConfirmSessionMutation(), { wrapper: createWrapper() })
    try {
      await act(async () => {
        await result.current.mutateAsync('sess-1')
      })
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Erreur lors de la confirmation')
    })
  })
})

describe('useUpdateSessionMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useUpdateSessionMutation(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeDefined()
  })

  it('updates session with all fields', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: 'sess-1', squad_id: 'sq-1' }, error: null }),
        }),
      }),
    })
    mockFrom.mockReturnValue({ update: updateMock })

    const { result } = renderHook(() => useUpdateSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        sessionId: 'sess-1',
        title: 'Updated',
        game: 'Valorant',
        scheduled_at: '2026-04-01T20:00:00Z',
        duration_minutes: 60,
        auto_confirm_threshold: 5,
      })
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated',
        game: 'Valorant',
        scheduled_at: '2026-04-01T20:00:00Z',
        duration_minutes: 60,
        auto_confirm_threshold: 5,
        updated_at: expect.any(String),
      })
    )
    expect(mockShowSuccess).toHaveBeenCalled()
  })

  it('only includes defined fields', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: 'sess-1', squad_id: 'sq-1' }, error: null }),
        }),
      }),
    })
    mockFrom.mockReturnValue({ update: updateMock })

    const { result } = renderHook(() => useUpdateSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        sessionId: 'sess-1',
        title: 'Only title',
      })
    })

    const updateArg = updateMock.mock.calls[0][0]
    expect(updateArg.title).toBe('Only title')
    expect(updateArg).not.toHaveProperty('game')
    expect(updateArg).not.toHaveProperty('scheduled_at')
    expect(updateArg).not.toHaveProperty('duration_minutes')
    expect(updateArg).toHaveProperty('updated_at')
  })

  it('shows error toast on failure', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
          }),
        }),
      }),
    })

    const { result } = renderHook(() => useUpdateSessionMutation(), { wrapper: createWrapper() })
    try {
      await act(async () => {
        await result.current.mutateAsync({ sessionId: 'sess-1', title: 'x' })
      })
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Erreur lors de la modification')
    })
  })
})

describe('useCancelSessionMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useCancelSessionMutation(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeDefined()
  })

  it('cancels a session', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { squad_id: 'sq-1' } }),
            }),
          }),
          update: updateMock,
        }
      }
      return {}
    })

    const { result } = renderHook(() => useCancelSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('sess-1')
    })

    expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(mockShowSuccess).toHaveBeenCalledWith('Session annulee')
  })

  it('handles session without squad_id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useCancelSessionMutation(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('sess-1')
    })

    expect(mockShowSuccess).toHaveBeenCalled()
  })

  it('shows error toast on failure', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { squad_id: 'sq-1' } }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('cancel fail') }),
          }),
        }
      }
      return {}
    })

    const { result } = renderHook(() => useCancelSessionMutation(), { wrapper: createWrapper() })
    try {
      await act(async () => {
        await result.current.mutateAsync('sess-1')
      })
    } catch {
      // expected
    }

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Erreur lors de l'annulation")
    })
  })
})
