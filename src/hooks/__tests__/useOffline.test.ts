import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOffline, useOfflineStore } from '../useOffline'

describe('useOfflineStore', () => {
  beforeEach(() => {
    useOfflineStore.getState().setOnline()
  })

  it('starts as online', () => {
    expect(useOfflineStore.getState().isOnline).toBe(true)
  })

  it('sets offline', () => {
    act(() => {
      useOfflineStore.getState().setOffline()
    })
    expect(useOfflineStore.getState().isOffline).toBe(true)
    expect(useOfflineStore.getState().wasOffline).toBe(true)
  })

  it('sets online from offline', () => {
    act(() => {
      useOfflineStore.getState().setOffline()
      useOfflineStore.getState().setOnline()
    })
    expect(useOfflineStore.getState().isOnline).toBe(true)
    expect(useOfflineStore.getState().lastOnlineAt).toBeInstanceOf(Date)
  })

  it('resets wasOffline', () => {
    act(() => {
      useOfflineStore.getState().setOffline()
      useOfflineStore.getState().resetWasOffline()
    })
    expect(useOfflineStore.getState().wasOffline).toBe(false)
  })
})

describe('useOffline', () => {
  beforeEach(() => {
    useOfflineStore.getState().setOnline()
  })

  it('returns isOnline true when online', () => {
    const { result } = renderHook(() => useOffline())
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it('detects offline event', () => {
    const { result } = renderHook(() => useOffline())
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.isOffline).toBe(true)
  })

  it('detects online event', () => {
    const { result } = renderHook(() => useOffline())
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.isOnline).toBe(true)
  })
})
