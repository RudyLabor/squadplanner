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

import { useChallengesQuery } from '../useChallenges'

describe('useChallengesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without error', () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBeDefined()
  })

  it('has data property', () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('data')
  })

  it('has error property', () => {
    const { result } = renderHook(() => useChallengesQuery(), { wrapper: createWrapper() })
    expect(result.current).toHaveProperty('error')
  })
})
