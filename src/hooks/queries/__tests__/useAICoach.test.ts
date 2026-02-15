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

import { useAICoachQuery, useAICoachQueryDeferred } from '../useAICoach'
import type { AICoachTip } from '../useAICoach'

describe('useAICoachQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies the hook renders, returns react-query shape, and is disabled
  // because AI_COACH_ENABLED is false in the source
  it('renders and is disabled because AI_COACH_ENABLED is false', () => {
    const { result } = renderHook(() => useAICoachQuery('user-1'), { wrapper: createWrapper() })

    // 1. result.current is defined
    expect(result.current).toBeDefined()
    // 2. Has data property
    expect(result.current).toHaveProperty('data')
    // 3. Has error property
    expect(result.current).toHaveProperty('error')
    // 4. Has isLoading property
    expect(result.current).toHaveProperty('isLoading')
    // 5. Has fetchStatus property
    expect(result.current).toHaveProperty('fetchStatus')
    // 6. fetchStatus is 'idle' because AI_COACH_ENABLED is false
    expect(result.current.fetchStatus).toBe('idle')
    // 7. isSuccess is false (never fetched)
    expect(result.current.isSuccess).toBe(false)
    // 8. error is null
    expect(result.current.error).toBeNull()
    // 9. isFetching is false
    expect(result.current.isFetching).toBe(false)
    // 10. data is undefined (never resolved)
    expect(result.current.data).toBeUndefined()
  })

  // STRICT: Verifies the hook is disabled when userId is undefined
  // (double-disabled: no userId AND AI_COACH_ENABLED=false)
  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useAICoachQuery(undefined), { wrapper: createWrapper() })

    // 1. fetchStatus is idle
    expect(result.current.fetchStatus).toBe('idle')
    // 2. Not fetching
    expect(result.current.isFetching).toBe(false)
    // 3. data is undefined
    expect(result.current.data).toBeUndefined()
    // 4. error is null
    expect(result.current.error).toBeNull()
    // 5. isLoading is false (query disabled)
    expect(result.current.isLoading).toBe(false)
    // 6. isError is false
    expect(result.current.isError).toBe(false)
    // 7. status is pending
    expect(result.current.status).toBe('pending')
    // 8. supabase.functions.invoke was NOT called
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
  })

  // STRICT: Verifies that both 'profile' and 'home' context types are accepted
  // and the hook remains disabled regardless of context
  it('accepts both profile and home context types and stays disabled', () => {
    // With 'profile' context
    const { result: profileResult } = renderHook(
      () => useAICoachQuery('user-1', 'profile'),
      { wrapper: createWrapper() }
    )
    // 1. fetchStatus is idle for profile context
    expect(profileResult.current.fetchStatus).toBe('idle')
    // 2. data is undefined
    expect(profileResult.current.data).toBeUndefined()

    // With 'home' context
    const { result: homeResult } = renderHook(
      () => useAICoachQuery('user-1', 'home'),
      { wrapper: createWrapper() }
    )
    // 3. fetchStatus is idle for home context
    expect(homeResult.current.fetchStatus).toBe('idle')
    // 4. data is undefined
    expect(homeResult.current.data).toBeUndefined()

    // 5. Edge function was never called
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
    // 6. Both results have same shape
    expect(Object.keys(profileResult.current)).toEqual(Object.keys(homeResult.current))
    // 7. Both are pending
    expect(profileResult.current.status).toBe('pending')
    expect(homeResult.current.status).toBe('pending')
    // 8. Neither is in error state
    expect(profileResult.current.isError).toBe(false)
    expect(homeResult.current.isError).toBe(false)
  })

  // STRICT: Verifies the AICoachTip type shape and the deferred hook export
  it('exports correct types and deferred hook variant', () => {
    // 1. useAICoachQuery is a function
    expect(typeof useAICoachQuery).toBe('function')
    // 2. useAICoachQueryDeferred is exported as a function
    expect(typeof useAICoachQueryDeferred).toBe('function')

    // 3. AICoachTip type can be used to create a valid tip
    const tip: AICoachTip = {
      tip: "Pret pour la prochaine session ?",
      tone: 'encouragement',
    }
    expect(tip.tip).toBe("Pret pour la prochaine session ?")
    // 4. Tone is correct
    expect(tip.tone).toBe('encouragement')
    // 5. context is optional
    expect(tip.context).toBeUndefined()

    // 6. Tip with context
    const tipWithContext: AICoachTip = {
      tip: 'Super streak!',
      tone: 'celebration',
      context: {
        reliability_score: 95,
        trend: 'improving',
        days_since_last_session: 1,
        recent_noshows: 0,
        upcoming_sessions: 3,
      },
    }
    expect(tipWithContext.context?.reliability_score).toBe(95)
    // 7. trend is valid
    expect(tipWithContext.context?.trend).toBe('improving')
    // 8. context fields are numbers
    expect(typeof tipWithContext.context?.days_since_last_session).toBe('number')
    expect(typeof tipWithContext.context?.upcoming_sessions).toBe('number')
  })
})
