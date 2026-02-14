import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { tip: 'Test tip', tone: 'encouragement' }, error: null }),
    },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  }
  return { mockSupabase, mockFrom, mockRpc, mockGetSession }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Auth store mock
vi.mock('../../useAuth', () => ({
  useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }), {
    getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
  }),
}))

// Toast mock
vi.mock('../../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useAICoachQuery } from '../useAICoach'

describe('useAICoachQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useAICoachQuery('user-1'), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns data property', () => {
    const { result } = renderHook(() => useAICoachQuery('user-1'), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useAICoachQuery(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled because AI_COACH_ENABLED is false', () => {
    // AI Coach is currently disabled in the source, so the query should not fetch
    const { result } = renderHook(() => useAICoachQuery('user-1', 'home'), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
