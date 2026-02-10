import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('../useVoiceCall', () => ({
  useVoiceCallStore: {
    getState: () => ({
      status: 'idle',
      currentCallId: null,
      acceptCall: vi.fn(),
      rejectCall: vi.fn(),
    }),
  },
}))

import { usePushNotificationStore } from '../usePushNotifications'

describe('usePushNotificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      usePushNotificationStore.setState({
        isSupported: true,
        isServiceWorkerRegistered: false,
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscription: null,
        registration: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = usePushNotificationStore.getState()
    expect(state.isServiceWorkerRegistered).toBe(false)
    expect(state.isSubscribed).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.subscription).toBeNull()
    expect(state.registration).toBeNull()
  })

  describe('registerServiceWorker', () => {
    it('returns null when not supported', async () => {
      act(() => {
        usePushNotificationStore.setState({ isSupported: false })
      })

      let result: ServiceWorkerRegistration | null = null
      await act(async () => {
        result = await usePushNotificationStore.getState().registerServiceWorker()
      })

      expect(result).toBeNull()
      expect(usePushNotificationStore.getState().error).toBeTruthy()
    })
  })

  describe('subscribeToPush', () => {
    it('returns false when not supported', async () => {
      act(() => {
        usePushNotificationStore.setState({ isSupported: false })
      })

      let result = false
      await act(async () => {
        result = await usePushNotificationStore.getState().subscribeToPush('user-1')
      })

      expect(result).toBe(false)
    })
  })

  describe('unsubscribeFromPush', () => {
    it('clears subscription state', async () => {
      act(() => {
        usePushNotificationStore.setState({
          isSubscribed: true,
          subscription: null, // Already null (no active subscription)
        })
      })

      await act(async () => {
        await usePushNotificationStore.getState().unsubscribeFromPush('user-1')
      })

      const state = usePushNotificationStore.getState()
      expect(state.isSubscribed).toBe(false)
      expect(state.subscription).toBeNull()
    })
  })

  describe('checkSubscription', () => {
    it('returns false when no registration', async () => {
      act(() => {
        usePushNotificationStore.setState({ registration: null })
      })

      let result = false
      await act(async () => {
        result = await usePushNotificationStore.getState().checkSubscription('user-1')
      })

      expect(result).toBe(false)
    })
  })

  describe('sendTestNotification', () => {
    it('does nothing without registration', async () => {
      act(() => {
        usePushNotificationStore.setState({ registration: null })
      })

      // Should not throw
      await act(async () => {
        await usePushNotificationStore.getState().sendTestNotification()
      })
    })

    it('sends test notification with registration', async () => {
      const mockShowNotification = vi.fn().mockResolvedValue(undefined)
      act(() => {
        usePushNotificationStore.setState({
          registration: { showNotification: mockShowNotification } as any,
        })
      })

      await act(async () => {
        await usePushNotificationStore.getState().sendTestNotification()
      })

      expect(mockShowNotification).toHaveBeenCalledWith('Test SquadPlanner', expect.objectContaining({
        body: expect.any(String),
        tag: 'test-notification',
      }))
    })
  })
})
