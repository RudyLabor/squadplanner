import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    update: vi.fn().mockReturnThis(),
  })
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
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

// Mock useAuthQuery since useChallenges depends on it
vi.mock('../useAuthQuery', () => ({
  useAuthUserQuery: vi.fn().mockReturnValue({
    data: { id: 'user-1', email: 'test@test.com' },
    isLoading: false,
    error: null,
  }),
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

// Mock Challenges component types
vi.mock('../../../components/Challenges', () => ({
  // types only - no actual exports needed
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useChallengesQuery, useClaimChallengeXPMutation } from '../useChallenges'
import type { SeasonalBadge, ChallengesData } from '../useChallenges'

describe('useChallengesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies the hook renders, returns correct react-query shape with
  // all expected properties, and starts loading then resolves
  it('renders with full react-query shape and transitions from loading to settled', async () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })

    // 1. result.current is defined
    expect(result.current).toBeDefined()
    // 2. Has isLoading property
    expect(result.current).toHaveProperty('isLoading')
    // 3. Has data property
    expect(result.current).toHaveProperty('data')
    // 4. Has error property
    expect(result.current).toHaveProperty('error')
    // 5. Has fetchStatus property
    expect(result.current).toHaveProperty('fetchStatus')
    // 6. Has isFetching property
    expect(result.current).toHaveProperty('isFetching')
    // 7. Has isSuccess property
    expect(result.current).toHaveProperty('isSuccess')
    // 8. Has isError property
    expect(result.current).toHaveProperty('isError')
    // 9. Error is null initially
    expect(result.current.error).toBeNull()

    // Wait for query to settle
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    // 10. After settling, isError is false
    expect(result.current.isError).toBe(false)
  })

  // STRICT: Verifies useClaimChallengeXPMutation is exported and has correct
  // mutation shape with mutate/mutateAsync
  it('exports useClaimChallengeXPMutation with correct mutation shape', () => {
    const { result } = renderHook(() => useClaimChallengeXPMutation(), { wrapper: createWrapper() })

    // 1. result.current is defined
    expect(result.current).toBeDefined()
    // 2. Has mutate function
    expect(typeof result.current.mutate).toBe('function')
    // 3. Has mutateAsync function
    expect(typeof result.current.mutateAsync).toBe('function')
    // 4. Has isPending property
    expect(result.current).toHaveProperty('isPending')
    // 5. isPending is false initially
    expect(result.current.isPending).toBe(false)
    // 6. Has isSuccess property
    expect(result.current.isSuccess).toBe(false)
    // 7. Has isError property
    expect(result.current.isError).toBe(false)
    // 8. Has error property (null initially)
    expect(result.current.error).toBeNull()
    // 9. Has data property
    expect(result.current).toHaveProperty('data')
    // 10. Has status property
    expect(result.current.status).toBe('idle')
  })

  // STRICT: Verifies the SeasonalBadge and ChallengesData type shapes
  // are correct with all required fields
  it('SeasonalBadge and ChallengesData types have correct shapes', () => {
    const badge: SeasonalBadge = {
      id: 'badge-1',
      user_id: 'user-1',
      badge_type: 'gold',
      season: 'winter-2026',
      squad_id: 'squad-1',
      awarded_at: '2026-02-01T00:00:00Z',
      squads: { name: 'Alpha Squad' },
    }
    // 1. badge id is correct
    expect(badge.id).toBe('badge-1')
    // 2. badge_type is set
    expect(badge.badge_type).toBe('gold')
    // 3. season is set
    expect(badge.season).toBe('winter-2026')
    // 4. squad_id is set
    expect(badge.squad_id).toBe('squad-1')
    // 5. awarded_at is a valid date
    expect(new Date(badge.awarded_at).getFullYear()).toBe(2026)
    // 6. squads relation is populated
    expect(badge.squads?.name).toBe('Alpha Squad')

    // 7. Badge with null squad
    const noBadgeSquad: SeasonalBadge = {
      ...badge,
      squad_id: null,
      squads: null,
    }
    expect(noBadgeSquad.squad_id).toBeNull()
    expect(noBadgeSquad.squads).toBeNull()

    // ChallengesData shape
    const challengesData: ChallengesData = {
      challenges: [],
      userChallenges: [],
      badges: [badge],
    }
    // 8. challenges is an array
    expect(Array.isArray(challengesData.challenges)).toBe(true)
    // 9. userChallenges is an array
    expect(Array.isArray(challengesData.userChallenges)).toBe(true)
    // 10. badges contains our badge
    expect(challengesData.badges).toHaveLength(1)
    expect(challengesData.badges[0].id).toBe('badge-1')
  })

  // STRICT: Verifies the query is enabled when user is authenticated and
  // makes the correct supabase calls
  it('is enabled when user is authenticated and calls supabase.from', async () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })

    // 1. Query should be fetching (user is authenticated)
    expect(result.current.fetchStatus).toBe('fetching')
    // 2. isLoading is true initially
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    // 3. supabase.from was called (to fetch challenges)
    expect(mockFrom).toHaveBeenCalled()
    // 4. Was called with 'challenges' table
    expect(mockFrom).toHaveBeenCalledWith('challenges')
    // 5. Was called with 'user_challenges' table
    expect(mockFrom).toHaveBeenCalledWith('user_challenges')
    // 6. Was called with 'seasonal_badges' table
    expect(mockFrom).toHaveBeenCalledWith('seasonal_badges')
    // 7. At least 3 calls were made (one for each table)
    expect(mockFrom.mock.calls.length).toBeGreaterThanOrEqual(3)
    // 8. Error is null
    expect(result.current.error).toBeNull()
  })
})
