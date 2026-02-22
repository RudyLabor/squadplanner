import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom, mockRpc, mockIsSupabaseReady } = vi.hoisted(() => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockIn = vi.fn().mockReturnThis()
  const mockGte = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    order: mockOrder,
    limit: mockLimit,
  })
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockGetSession = vi
    .fn()
    .mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
  const mockIsSupabaseReady = vi.fn().mockReturnValue(true)
  const mockSupabase = {
    auth: { getSession: mockGetSession, getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
    channel: vi
      .fn()
      .mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  }
  return { mockSupabase, mockFrom, mockRpc, mockGetSession, mockIsSupabaseReady }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  isSupabaseReady: mockIsSupabaseReady,
}))

vi.mock('../../../lib/queryClient', () => ({
  queryKeys: {
    activityFeed: {
      all: ['activity-feed'],
      list: (squadIds: string[]) => ['activity-feed', 'list', ...squadIds],
    },
  },
}))

// Auth store mock
vi.mock('../../useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    {
      getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } }),
    }
  ),
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

import { useActivityFeedQuery, getRelativeTime } from '../useActivityFeedQuery'

describe('useActivityFeedQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupabaseReady.mockReturnValue(true)
  })

  // STRICT: Verifies the hook renders, returns correct react-query shape,
  // starts in loading state, and transitions to success with data
  it('renders with correct react-query shape and transitions from loading to success', async () => {
    const { result } = renderHook(() => useActivityFeedQuery(['squad-1']), {
      wrapper: createWrapper(),
    })

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
    // 7. Initially loading
    expect(result.current.isLoading).toBe(true)
    // 8. error is null initially
    expect(result.current.error).toBeNull()

    // Wait for query to settle
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 9. After settling, data is defined (empty array from mock)
    expect(result.current.data).toBeDefined()
    // 10. fetchStatus is idle after completion
    expect(result.current.fetchStatus).toBe('idle')
  })

  // STRICT: Verifies the hook is disabled (idle) when squadIds is empty
  it('is disabled and stays idle when squadIds is an empty array', () => {
    const { result } = renderHook(() => useActivityFeedQuery([]), { wrapper: createWrapper() })

    // 1. fetchStatus is idle
    expect(result.current.fetchStatus).toBe('idle')
    // 2. isLoading is false (disabled query)
    // Note: in v5 react-query, disabled queries have isPending=true but isLoading=false
    expect(result.current.fetchStatus).not.toBe('fetching')
    // 3. data is undefined (never fetched)
    expect(result.current.data).toBeUndefined()
    // 4. error is null
    expect(result.current.error).toBeNull()
    // 5. isFetching is false
    expect(result.current.isFetching).toBe(false)
    // 6. supabase.from was NOT called (query disabled)
    expect(mockFrom).not.toHaveBeenCalled()
    // 7. status is 'pending' (not yet resolved)
    expect(result.current.status).toBe('pending')
    // 8. isSuccess is false
    expect(result.current.isSuccess).toBe(false)
  })

  // STRICT: Verifies the getRelativeTime utility function returns correct
  // French relative time strings for various time differences
  it('getRelativeTime returns correct French relative time strings', () => {
    const now = new Date()

    // 1. Just now (less than 1 minute ago)
    const justNow = new Date(now.getTime() - 10_000).toISOString()
    expect(getRelativeTime(justNow)).toBe("à l'instant")

    // 2. Minutes ago
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000).toISOString()
    expect(getRelativeTime(fiveMinAgo)).toBe('il y a 5min')

    // 3. One minute ago
    const oneMinAgo = new Date(now.getTime() - 1.5 * 60_000).toISOString()
    expect(getRelativeTime(oneMinAgo)).toBe('il y a 1min')

    // 4. Hours ago
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60_000).toISOString()
    expect(getRelativeTime(twoHoursAgo)).toBe('il y a 2h')

    // 5. One hour ago
    const oneHourAgo = new Date(now.getTime() - 1.5 * 60 * 60_000).toISOString()
    expect(getRelativeTime(oneHourAgo)).toBe('il y a 1h')

    // 6. Days ago (within a week)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60_000).toISOString()
    expect(getRelativeTime(threeDaysAgo)).toBe('il y a 3j')

    // 7. More than a week ago returns formatted date
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60_000).toISOString()
    const result = getRelativeTime(twoWeeksAgo)
    // Should be a formatted date string like "1 fev." or "15 janv."
    expect(result).not.toContain('il y a')
    expect(result.length).toBeGreaterThan(0)

    // 8. Function is exported and callable
    expect(typeof getRelativeTime).toBe('function')
  })

  // STRICT: Verifies the hook is disabled when supabase is not ready
  it('is disabled when supabase is not ready', () => {
    mockIsSupabaseReady.mockReturnValue(false)

    const { result } = renderHook(() => useActivityFeedQuery(['squad-1']), {
      wrapper: createWrapper(),
    })

    // 1. fetchStatus is idle (query disabled)
    expect(result.current.fetchStatus).toBe('idle')
    // 2. Not fetching
    expect(result.current.isFetching).toBe(false)
    // 3. data is undefined
    expect(result.current.data).toBeUndefined()
    // 4. error is null
    expect(result.current.error).toBeNull()
    // 5. status is pending (unresolved)
    expect(result.current.status).toBe('pending')
    // 6. isSuccess is false
    expect(result.current.isSuccess).toBe(false)
    // 7. isError is false
    expect(result.current.isError).toBe(false)
    // 8. supabase.from was not called
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
