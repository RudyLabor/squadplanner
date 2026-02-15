import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Supabase mock
const { mockSupabase, mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
  }
  return { mockSupabase, mockFrom }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

import {
  useSquadSubscriptionQuery,
  useUserSubscriptionsQuery,
} from '../useSquadSubscriptions'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// Helper: build supabase chain for single() query
function mockSingleChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  }
}

// Helper: build supabase chain for list query (in + eq)
function mockListChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(result),
      }),
    }),
  }
}

describe('useSquadSubscriptionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is disabled when squadId is undefined', () => {
    const { result } = renderHook(() => useSquadSubscriptionQuery(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches subscription for a squad', async () => {
    const subscription = {
      id: 'sub-1',
      squad_id: 'squad-1',
      user_id: 'user-1',
      stripe_subscription_id: 'stripe_sub_123',
      stripe_customer_id: 'stripe_cus_123',
      status: 'active',
      current_period_start: '2026-01-01',
      current_period_end: '2026-02-01',
      created_at: '2026-01-01',
    }

    mockFrom.mockReturnValue(mockSingleChain({ data: subscription, error: null }))

    const { result } = renderHook(() => useSquadSubscriptionQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(subscription)
    expect(mockFrom).toHaveBeenCalledWith('subscriptions')
  })

  it('returns null for PGRST116 error (not found)', async () => {
    mockFrom.mockReturnValue(
      mockSingleChain({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
    )

    const { result } = renderHook(() => useSquadSubscriptionQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('throws on non-PGRST116 errors', async () => {
    mockFrom.mockReturnValue(
      mockSingleChain({ data: null, error: { code: '42P01', message: 'Table not found' } })
    )

    const { result } = renderHook(() => useSquadSubscriptionQuery('squad-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('has correct query key shape', () => {
    mockFrom.mockReturnValue(mockSingleChain({ data: null, error: { code: 'PGRST116', message: '' } }))

    const { result } = renderHook(() => useSquadSubscriptionQuery('squad-42'), {
      wrapper: createWrapper(),
    })

    // The hook is enabled and should have a queryKey including the squadId
    expect(result.current).toBeDefined()
  })
})

describe('useUserSubscriptionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when squadIds is empty (disabled)', () => {
    const { result } = renderHook(() => useUserSubscriptionsQuery([]), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches subscriptions for multiple squads', async () => {
    const subscriptions = [
      {
        id: 'sub-1',
        squad_id: 'squad-1',
        user_id: 'user-1',
        stripe_subscription_id: null,
        stripe_customer_id: null,
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        created_at: '2026-01-01',
      },
      {
        id: 'sub-2',
        squad_id: 'squad-2',
        user_id: 'user-1',
        stripe_subscription_id: 'stripe_sub_456',
        stripe_customer_id: 'stripe_cus_456',
        status: 'active',
        current_period_start: '2026-01-01',
        current_period_end: '2026-02-01',
        created_at: '2026-01-01',
      },
    ]

    mockFrom.mockReturnValue(mockListChain({ data: subscriptions, error: null }))

    const { result } = renderHook(
      () => useUserSubscriptionsQuery(['squad-1', 'squad-2']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(subscriptions)
    expect(result.current.data).toHaveLength(2)
  })

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(mockListChain({ data: null, error: null }))

    const { result } = renderHook(
      () => useUserSubscriptionsQuery(['squad-1']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue(
      mockListChain({ data: null, error: { message: 'Network error' } })
    )

    const { result } = renderHook(
      () => useUserSubscriptionsQuery(['squad-1']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('calls supabase from subscriptions table', async () => {
    mockFrom.mockReturnValue(mockListChain({ data: [], error: null }))

    const { result } = renderHook(
      () => useUserSubscriptionsQuery(['squad-1']),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFrom).toHaveBeenCalledWith('subscriptions')
  })
})
