import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockGetSession, mockFrom, mockChannel, mockRemoveChannel, mockFunctionsInvoke, mockSupabase } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockFrom = vi.fn()
  const mockChannel = vi.fn()
  const mockRemoveChannel = vi.fn()
  const mockFunctionsInvoke = vi.fn()
  const mockSupabase = {
    auth: { getSession: mockGetSession },
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    functions: { invoke: mockFunctionsInvoke },
  }
  return { mockGetSession, mockFrom, mockChannel, mockRemoveChannel, mockFunctionsInvoke, mockSupabase }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
  initSupabase: vi.fn().mockResolvedValue(mockSupabase),
  isSupabaseReady: vi.fn().mockReturnValue(true),
  waitForSupabase: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('../useNetworkQuality', () => ({
  useNetworkQualityStore: {
    getState: vi.fn().mockReturnValue({
      updateQuality: vi.fn(),
    }),
  },
}))

vi.mock('../useCallState', () => ({
  generateChannelName: vi.fn((a: string, b: string) => `call_${a}_${b}`),
  MAX_RECONNECT_ATTEMPTS: 3,
}))

import { sendCallPushNotification, initializeNativeWebRTC, subscribeToIncomingCalls } from '../useCallActions'

describe('useCallActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('sendCallPushNotification', () => {
    const caller = { id: 'caller-1', username: 'TestCaller', avatar_url: 'https://example.com/avatar.png' }

    it('calls supabase.functions.invoke with correct body', async () => {
      await sendCallPushNotification('receiver-1', caller, 'call-record-1')

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('send-push', {
        body: {
          userId: 'receiver-1',
          title: 'Appel entrant',
          body: 'TestCaller vous appelle',
          icon: '/icon-192.svg',
          tag: 'incoming-call-call-record-1',
          data: {
            type: 'incoming_call',
            call_id: 'call-record-1',
            caller_id: 'caller-1',
            caller_name: 'TestCaller',
            caller_avatar: 'https://example.com/avatar.png',
          },
          actions: [
            { action: 'answer', title: 'Repondre' },
            { action: 'decline', title: 'Refuser' },
          ],
        },
      })
    })

    it('handles push notification failure gracefully', async () => {
      mockFunctionsInvoke.mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(sendCallPushNotification('receiver-1', caller, 'call-1')).resolves.toBeUndefined()
    })
  })

  describe('initializeNativeWebRTC', () => {
    it('resolves without error', async () => {
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({ status: 'calling', ringTimeout: null }),
        setState: vi.fn(),
      } as any

      await expect(initializeNativeWebRTC('user-1', 'user-2', mockStoreRef)).resolves.toBeUndefined()
    })

    it('updates store status to connected after timeout', async () => {
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({ status: 'calling', ringTimeout: null }),
        setState: vi.fn(),
      } as any

      await initializeNativeWebRTC('user-1', 'user-2', mockStoreRef)

      // Advance timer to trigger the setTimeout callback
      vi.advanceTimersByTime(1000)

      expect(mockStoreRef.setState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'connected',
        })
      )
    })
  })

  describe('subscribeToIncomingCalls', () => {
    let mockOn: ReturnType<typeof vi.fn>
    let mockSubscribe: ReturnType<typeof vi.fn>
    let mockChannelInstance: any

    beforeEach(() => {
      mockOn = vi.fn()

      // Build chainable .on().on().on().subscribe() pattern
      // subscribe() returns the channel instance itself (like Supabase does)
      mockChannelInstance = {
        on: mockOn,
        subscribe: vi.fn(),
      }
      mockChannelInstance.subscribe.mockReturnValue(mockChannelInstance)
      mockSubscribe = mockChannelInstance.subscribe
      mockOn.mockReturnValue(mockChannelInstance)
      mockChannel.mockReturnValue(mockChannelInstance)
    })

    it('creates channel and subscribes', () => {
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({ status: 'idle' }),
        setState: vi.fn(),
      } as any

      subscribeToIncomingCalls('user-1', mockStoreRef)

      expect(mockChannel).toHaveBeenCalledWith('calls:user-1')
      expect(mockOn).toHaveBeenCalledTimes(3) // INSERT, UPDATE receiver, UPDATE caller
      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('cleanup function removes channel', () => {
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({ status: 'idle' }),
        setState: vi.fn(),
      } as any

      const cleanup = subscribeToIncomingCalls('user-1', mockStoreRef)

      cleanup()

      expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannelInstance)
    })

    it('INSERT handler with status missed fetches caller profile', async () => {
      const mockSetIncomingCall = vi.fn()
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({
          status: 'idle',
          setIncomingCall: mockSetIncomingCall,
        }),
        setState: vi.fn(),
      } as any

      // Capture the INSERT handler callback
      let insertHandler: (payload: any) => Promise<void>
      mockOn.mockImplementation((_event: string, _config: any, callback: any) => {
        if (_config.event === 'INSERT') {
          insertHandler = callback
        }
        return mockChannelInstance
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { username: 'CallerUser', avatar_url: 'avatar.png' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      subscribeToIncomingCalls('user-1', mockStoreRef)

      // Invoke the INSERT handler with a missed call
      await insertHandler!({
        new: { id: 'call-1', caller_id: 'caller-1', status: 'missed' },
      })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockSetIncomingCall).toHaveBeenCalledWith(
        { id: 'caller-1', username: 'CallerUser', avatar_url: 'avatar.png' },
        'call-1'
      )
    })

    it('INSERT handler ignores calls when not idle', async () => {
      const mockStoreRef = {
        getState: vi.fn().mockReturnValue({
          status: 'connected', // Not idle
        }),
        setState: vi.fn(),
      } as any

      let insertHandler: (payload: any) => Promise<void>
      mockOn.mockImplementation((_event: string, _config: any, callback: any) => {
        if (_config.event === 'INSERT') {
          insertHandler = callback
        }
        return mockChannelInstance
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      subscribeToIncomingCalls('user-1', mockStoreRef)

      await insertHandler!({
        new: { id: 'call-1', caller_id: 'caller-1', status: 'missed' },
      })

      // When not idle, it should update the call to 'rejected' instead of setting incoming call
      expect(mockFrom).toHaveBeenCalledWith('calls')
    })
  })
})
