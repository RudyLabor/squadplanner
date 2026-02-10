import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}))

import { useNotificationStore } from '../useNotifications'

// Mock Notification API
const mockNotification = vi.fn()
const mockNotificationClose = vi.fn()

describe('useNotificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Reset store state
    act(() => {
      useNotificationStore.setState({
        isSupported: true,
        isPermissionGranted: false,
        isLoading: false,
        error: null,
      })
    })

    // Mock Notification constructor
    vi.stubGlobal('Notification', Object.assign(
      mockNotification.mockImplementation(function (this: any) {
        this.close = mockNotificationClose
        this.onclick = null
        return this
      }),
      {
        permission: 'default',
        requestPermission: vi.fn(),
      }
    ))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('has correct initial state', () => {
    const state = useNotificationStore.getState()
    expect(state.isSupported).toBe(true)
    expect(state.isPermissionGranted).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  describe('requestPermission', () => {
    it('grants permission when user allows', async () => {
      ;(Notification.requestPermission as any).mockResolvedValue('granted')

      let result = false
      await act(async () => {
        result = await useNotificationStore.getState().requestPermission()
      })

      expect(result).toBe(true)
      expect(useNotificationStore.getState().isPermissionGranted).toBe(true)
      expect(useNotificationStore.getState().isLoading).toBe(false)
    })

    it('denies permission and sets error', async () => {
      ;(Notification.requestPermission as any).mockResolvedValue('denied')

      let result = false
      await act(async () => {
        result = await useNotificationStore.getState().requestPermission()
      })

      expect(result).toBe(false)
      expect(useNotificationStore.getState().isPermissionGranted).toBe(false)
      expect(useNotificationStore.getState().error).toBeTruthy()
    })

    it('returns false when not supported', async () => {
      act(() => {
        useNotificationStore.setState({ isSupported: false })
      })

      let result = false
      await act(async () => {
        result = await useNotificationStore.getState().requestPermission()
      })

      expect(result).toBe(false)
      expect(useNotificationStore.getState().error).toBeTruthy()
    })

    it('handles permission request error', async () => {
      ;(Notification.requestPermission as any).mockRejectedValue(new Error('Permission error'))

      let result = false
      await act(async () => {
        result = await useNotificationStore.getState().requestPermission()
      })

      expect(result).toBe(false)
      expect(useNotificationStore.getState().error).toBeTruthy()
      expect(useNotificationStore.getState().isLoading).toBe(false)
    })
  })

  describe('sendNotification', () => {
    it('sends notification when supported and granted', () => {
      act(() => {
        useNotificationStore.setState({ isSupported: true, isPermissionGranted: true })
      })

      act(() => {
        useNotificationStore.getState().sendNotification('Test Title', { body: 'Test body' })
      })

      expect(mockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({
        body: 'Test body',
        icon: '/favicon.ico',
      }))
    })

    it('does not send when not supported', () => {
      act(() => {
        useNotificationStore.setState({ isSupported: false, isPermissionGranted: true })
      })

      act(() => {
        useNotificationStore.getState().sendNotification('Test', {})
      })

      expect(mockNotification).not.toHaveBeenCalled()
    })

    it('does not send when permission not granted', () => {
      act(() => {
        useNotificationStore.setState({ isSupported: true, isPermissionGranted: false })
      })

      act(() => {
        useNotificationStore.getState().sendNotification('Test', {})
      })

      expect(mockNotification).not.toHaveBeenCalled()
    })

    it('auto-closes notification after 5 seconds', () => {
      act(() => {
        useNotificationStore.setState({ isSupported: true, isPermissionGranted: true })
      })

      act(() => {
        useNotificationStore.getState().sendNotification('Test', {})
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(mockNotificationClose).toHaveBeenCalled()
    })
  })
})
