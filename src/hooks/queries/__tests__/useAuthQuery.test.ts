import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// --- Supabase mock ---
const { mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
  }
  return { mockSupabase }
})

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

import { useAuthUserQuery } from '../useAuthQuery'

describe('useAuthUserQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the authenticated user on success', async () => {
    const mockUser = {
      id: 'user-abc-123',
      email: 'alice@example.com',
      app_metadata: {},
      user_metadata: { username: 'Alice' },
      aud: 'authenticated',
      created_at: '2025-01-01T00:00:00Z',
    }
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: data matches the mock user exactly
    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.id).toBe('user-abc-123')
    expect(result.current.data!.email).toBe('alice@example.com')
    expect(result.current.data!.user_metadata.username).toBe('Alice')

    // STRICT: auth.getUser was called exactly once
    expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('returns null when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: data is null when no user is logged in
    expect(result.current.data).toBeNull()
  })

  it('returns null and does not throw when auth returns an error', async () => {
    // The hook catches errors and returns null (see source: console.warn + return null)
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired', status: 401 },
    })

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: error is swallowed, data is null (not undefined), query is still successful
    expect(result.current.data).toBeNull()
    expect(result.current.isError).toBe(false)
  })

  it('does not retry on failure (retry: false)', async () => {
    // First call rejects, triggering the query to fail
    mockSupabase.auth.getUser.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // STRICT: getUser was called only once because retry is false
    expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)

    // STRICT: error propagated to the query
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toBe('Network error')
  })

  it('returns a different user when a different user is logged in', async () => {
    const mockUser = {
      id: 'user-xyz-789',
      email: 'bob@example.com',
      app_metadata: { provider: 'google' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-15T12:00:00Z',
    }
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // STRICT: returned user matches new mock, not a stale value
    expect(result.current.data!.id).toBe('user-xyz-789')
    expect(result.current.data!.email).toBe('bob@example.com')
    expect(result.current.data!.app_metadata.provider).toBe('google')
  })

  it('starts in loading state before getUser resolves', () => {
    // Never resolve so the query stays loading
    mockSupabase.auth.getUser.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAuthUserQuery(), { wrapper: createWrapper() })

    // STRICT: isLoading is true AND data is undefined (not yet fetched)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.isSuccess).toBe(false)
  })
})
