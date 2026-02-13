import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

const { mockGetSession, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }
  return { mockGetSession, mockFrom, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

import { useCallHistoryStore, formatDuration, formatRelativeTime } from '../useCallHistory'

describe('useCallHistoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useCallHistoryStore.setState({
        calls: [],
        isLoading: false,
        error: null,
        filter: 'all',
      })
    })
  })

  it('has correct initial state', () => {
    const state = useCallHistoryStore.getState()
    expect(state.calls).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.filter).toBe('all')
  })

  describe('setFilter', () => {
    it('sets filter to incoming', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('incoming')
      })
      expect(useCallHistoryStore.getState().filter).toBe('incoming')
    })

    it('sets filter to outgoing', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('outgoing')
      })
      expect(useCallHistoryStore.getState().filter).toBe('outgoing')
    })

    it('sets filter to missed', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('missed')
      })
      expect(useCallHistoryStore.getState().filter).toBe('missed')
    })

    it('sets filter to all', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('missed')
      })
      act(() => {
        useCallHistoryStore.getState().setFilter('all')
      })
      expect(useCallHistoryStore.getState().filter).toBe('all')
    })
  })

  describe('clearError', () => {
    it('clears error', () => {
      act(() => {
        useCallHistoryStore.setState({ error: 'Some error' })
      })

      act(() => {
        useCallHistoryStore.getState().clearError()
      })

      expect(useCallHistoryStore.getState().error).toBeNull()
    })
  })

  describe('getFilteredCalls', () => {
    const mockCalls = [
      {
        id: '1',
        type: 'incoming' as const,
        status: 'answered' as const,
        contactId: 'u1',
        contactName: 'A',
        contactAvatar: null,
        durationSeconds: 60,
        createdAt: new Date(),
      },
      {
        id: '2',
        type: 'outgoing' as const,
        status: 'missed' as const,
        contactId: 'u2',
        contactName: 'B',
        contactAvatar: null,
        durationSeconds: null,
        createdAt: new Date(),
      },
      {
        id: '3',
        type: 'incoming' as const,
        status: 'missed' as const,
        contactId: 'u3',
        contactName: 'C',
        contactAvatar: null,
        durationSeconds: null,
        createdAt: new Date(),
      },
      {
        id: '4',
        type: 'outgoing' as const,
        status: 'answered' as const,
        contactId: 'u4',
        contactName: 'D',
        contactAvatar: null,
        durationSeconds: 120,
        createdAt: new Date(),
      },
    ]

    beforeEach(() => {
      act(() => {
        useCallHistoryStore.setState({ calls: mockCalls })
      })
    })

    it('returns all calls with "all" filter', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('all')
      })
      expect(useCallHistoryStore.getState().getFilteredCalls()).toHaveLength(4)
    })

    it('filters incoming calls', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('incoming')
      })
      const filtered = useCallHistoryStore.getState().getFilteredCalls()
      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.type === 'incoming')).toBe(true)
    })

    it('filters outgoing calls', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('outgoing')
      })
      const filtered = useCallHistoryStore.getState().getFilteredCalls()
      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.type === 'outgoing')).toBe(true)
    })

    it('filters missed calls', () => {
      act(() => {
        useCallHistoryStore.getState().setFilter('missed')
      })
      const filtered = useCallHistoryStore.getState().getFilteredCalls()
      expect(filtered).toHaveLength(2)
      expect(filtered.every((c) => c.status === 'missed')).toBe(true)
    })
  })

  describe('fetchCallHistory', () => {
    it('sets error when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await act(async () => {
        await useCallHistoryStore.getState().fetchCallHistory()
      })

      const state = useCallHistoryStore.getState()
      expect(state.error).toBe('Utilisateur non connect\u00e9')
      expect(state.isLoading).toBe(false)
    })

    it('shows empty state when table does not exist', async () => {
      const mockUser = { id: 'user-1' }
      mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42P01', message: 'relation does not exist' },
              }),
            }),
          }),
        }),
      })

      await act(async () => {
        await useCallHistoryStore.getState().fetchCallHistory()
      })

      const state = useCallHistoryStore.getState()
      expect(state.calls).toEqual([])
      expect(state.error).toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })
})

describe('formatDuration', () => {
  it('returns empty string for null', () => {
    expect(formatDuration(null)).toBe('')
  })

  it('returns empty string for 0', () => {
    expect(formatDuration(0)).toBe('')
  })

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2 min 05s')
  })

  it('formats exact minutes', () => {
    expect(formatDuration(60)).toBe('1 min 00s')
  })
})

describe('formatRelativeTime', () => {
  it('shows "Aujourd\'hui" for today', () => {
    const now = new Date()
    const result = formatRelativeTime(now)
    expect(result).toContain("Aujourd'hui")
  })

  it('shows "Hier" for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatRelativeTime(yesterday)
    expect(result).toContain('Hier')
  })
})
