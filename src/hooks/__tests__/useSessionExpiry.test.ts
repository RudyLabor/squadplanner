import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockGetSession, mockOnAuthStateChange, mockUnsubscribe } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

// Mock the Toast module used in warning timer
vi.mock('../../components/ui/Toast', () => ({
  toast: vi.fn(),
}))

import { useSessionExpiry } from '../useSessionExpiry'

describe('useSessionExpiry', () => {
  // Store the auth callback captured from onAuthStateChange
  let authCallback: (event: string, session: any) => void

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    authCallback = () => {}
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    // Pre-load the mocked supabase module so dynamic import() in the hook resolves correctly
    await import('../../lib/supabase')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper to flush the dynamic import promise chain inside the hook's useEffect
  async function flushDynamicImport() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  it('initial state: isSessionExpired false, showModal false', async () => {
    const { result } = renderHook(() => useSessionExpiry())

    await flushDynamicImport()

    expect(result.current.isSessionExpired).toBe(false)
    expect(result.current.showModal).toBe(false)
  })

  it('dismissModal sets showModal to false', async () => {
    const { result } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    // Trigger SIGNED_OUT to set showModal to true
    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.showModal).toBe(true)

    // Now dismiss modal
    act(() => {
      result.current.dismissModal()
    })

    expect(result.current.showModal).toBe(false)
  })

  it('sets isSessionExpired true when session expires_at is in the past', async () => {
    // Session that expired 10 seconds ago (expires_at is in seconds)
    const pastExpiresAt = Math.floor(Date.now() / 1000) - 10

    const { result } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    act(() => {
      authCallback('SIGNED_IN', { expires_at: pastExpiresAt })
    })

    expect(result.current.isSessionExpired).toBe(true)
    expect(result.current.showModal).toBe(true)
  })

  it('does not show expired when session is valid (far future)', async () => {
    // Session that expires in 1 hour
    const futureExpiresAt = Math.floor(Date.now() / 1000) + 3600

    const { result } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    act(() => {
      authCallback('SIGNED_IN', { expires_at: futureExpiresAt })
    })

    expect(result.current.isSessionExpired).toBe(false)
    expect(result.current.showModal).toBe(false)
  })

  it('SIGNED_OUT event sets isSessionExpired true and showModal true', async () => {
    const { result } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.isSessionExpired).toBe(true)
    expect(result.current.showModal).toBe(true)
  })

  it('SIGNED_IN event resets isSessionExpired to false', async () => {
    const futureExpiresAt = Math.floor(Date.now() / 1000) + 3600

    const { result } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    // First trigger SIGNED_OUT to expire session
    act(() => {
      authCallback('SIGNED_OUT', null)
    })

    expect(result.current.isSessionExpired).toBe(true)

    // Then trigger SIGNED_IN to reset
    act(() => {
      authCallback('SIGNED_IN', { expires_at: futureExpiresAt })
    })

    expect(result.current.isSessionExpired).toBe(false)
    expect(result.current.showModal).toBe(false)
  })

  it('cleanup unsubscribes and clears timers', async () => {
    const futureExpiresAt = Math.floor(Date.now() / 1000) + 3600

    const { unmount } = renderHook(() => useSessionExpiry())
    await flushDynamicImport()

    // Set up timers by triggering a SIGNED_IN with future expiry
    act(() => {
      authCallback('SIGNED_IN', { expires_at: futureExpiresAt })
    })

    // Unmount should trigger cleanup
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
