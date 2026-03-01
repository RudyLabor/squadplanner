import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// Hoist all mocks
const {
  mockGetUser,
  mockFrom,
  mockSupabase,
  mockResetQuality,
  mockSendCallPushNotification,
  mockInitializeNativeWebRTC,
  mockSubscribeToIncomingCalls,
  mockDisconnectWebRTC,
  mockToggleWebRTCMute,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockFunctions = { invoke: vi.fn() }
  const mockChannel = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })
  const mockRemoveChannel = vi.fn()
  const mockSupabase = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
    functions: mockFunctions,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }
  const mockResetQuality = vi.fn()
  const mockSendCallPushNotification = vi.fn().mockResolvedValue(undefined)
  const mockInitializeNativeWebRTC = vi.fn().mockResolvedValue(undefined)
  const mockSubscribeToIncomingCalls = vi.fn().mockReturnValue(vi.fn())
  const mockDisconnectWebRTC = vi.fn()
  const mockToggleWebRTCMute = vi.fn().mockReturnValue(false)
  return {
    mockGetUser,
    mockFrom,
    mockSupabase,
    mockResetQuality,
    mockSendCallPushNotification,
    mockInitializeNativeWebRTC,
    mockSubscribeToIncomingCalls,
    mockDisconnectWebRTC,
    mockToggleWebRTCMute,
  }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

vi.mock('../useNetworkQuality', () => ({
  useNetworkQualityStore: {
    getState: () => ({ resetQuality: mockResetQuality }),
  },
  setupNetworkQualityListener: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('../useCallState', () => ({
  RING_TIMEOUT: 500, // Short for tests
  MAX_RECONNECT_ATTEMPTS: 3,
  formatCallDuration: (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
  generateChannelName: vi.fn((a: string, b: string) => `call_${a}_${b}`),
}))

vi.mock('../useCallActions', () => ({
  sendCallPushNotification: mockSendCallPushNotification,
  initializeNativeWebRTC: mockInitializeNativeWebRTC,
  subscribeToIncomingCalls: mockSubscribeToIncomingCalls,
  disconnectWebRTC: mockDisconnectWebRTC,
  toggleWebRTCMute: mockToggleWebRTCMute,
}))

import { useVoiceCallStore, formatCallDuration, subscribeToIncomingCalls } from '../useVoiceCall'

function resetStore() {
  useVoiceCallStore.setState({
    status: 'idle',
    isMuted: false,
    isSpeakerOn: true,
    callStartTime: null,
    callDuration: 0,
    error: null,
    isReconnecting: false,
    reconnectAttempts: 0,
    networkQualityChanged: null,
    caller: null,
    receiver: null,
    isIncoming: false,
    currentCallId: null,
    room: null,
    durationInterval: null,
    ringTimeout: null,
  })
}

describe('useVoiceCallStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    act(() => {
      resetStore()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ===== INITIAL STATE =====
  it('has correct initial state', () => {
    const state = useVoiceCallStore.getState()
    expect(state.status).toBe('idle')
    expect(state.isMuted).toBe(false)
    expect(state.isSpeakerOn).toBe(true)
    expect(state.callStartTime).toBeNull()
    expect(state.callDuration).toBe(0)
    expect(state.error).toBeNull()
    expect(state.isReconnecting).toBe(false)
    expect(state.reconnectAttempts).toBe(0)
    expect(state.networkQualityChanged).toBeNull()
    expect(state.caller).toBeNull()
    expect(state.receiver).toBeNull()
    expect(state.isIncoming).toBe(false)
    expect(state.currentCallId).toBeNull()
    expect(state.room).toBeNull()
    expect(state.durationInterval).toBeNull()
    expect(state.ringTimeout).toBeNull()
  })

  // ===== clearError =====
  describe('clearError', () => {
    it('clears error state', () => {
      act(() => {
        useVoiceCallStore.setState({ error: 'Some error' })
      })
      act(() => {
        useVoiceCallStore.getState().clearError()
      })
      expect(useVoiceCallStore.getState().error).toBeNull()
    })

    it('does nothing when error is already null', () => {
      act(() => {
        useVoiceCallStore.getState().clearError()
      })
      expect(useVoiceCallStore.getState().error).toBeNull()
    })
  })

  // ===== clearNetworkQualityNotification =====
  describe('clearNetworkQualityNotification', () => {
    it('clears network quality notification', () => {
      act(() => {
        useVoiceCallStore.setState({ networkQualityChanged: 'poor' as any })
      })
      act(() => {
        useVoiceCallStore.getState().clearNetworkQualityNotification()
      })
      expect(useVoiceCallStore.getState().networkQualityChanged).toBeNull()
    })
  })

  // ===== resetCall =====
  describe('resetCall', () => {
    it('resets all call state to defaults', () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'connected',
          isMuted: true,
          isSpeakerOn: false,
          callStartTime: Date.now(),
          callDuration: 120,
          error: 'some error',
          isReconnecting: true,
          reconnectAttempts: 2,
          networkQualityChanged: 'good' as any,
          caller: { id: 'caller-1', username: 'Test' },
          receiver: { id: 'recv-1', username: 'Recv' },
          isIncoming: true,
          currentCallId: 'call-1',
        })
      })

      act(() => {
        useVoiceCallStore.getState().resetCall()
      })

      const state = useVoiceCallStore.getState()
      expect(state.status).toBe('idle')
      expect(state.isMuted).toBe(false)
      expect(state.isSpeakerOn).toBe(true)
      expect(state.callStartTime).toBeNull()
      expect(state.callDuration).toBe(0)
      expect(state.error).toBeNull()
      expect(state.isReconnecting).toBe(false)
      expect(state.reconnectAttempts).toBe(0)
      expect(state.networkQualityChanged).toBeNull()
      expect(state.caller).toBeNull()
      expect(state.receiver).toBeNull()
      expect(state.isIncoming).toBe(false)
      expect(state.currentCallId).toBeNull()
      expect(state.room).toBeNull()
      expect(state.durationInterval).toBeNull()
      expect(state.ringTimeout).toBeNull()
    })

    it('clears durationInterval if set', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      const intervalId = setInterval(() => {}, 1000)
      act(() => {
        useVoiceCallStore.setState({ durationInterval: intervalId })
      })
      act(() => {
        useVoiceCallStore.getState().resetCall()
      })
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId)
    })

    it('clears ringTimeout if set', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const timeoutId = setTimeout(() => {}, 5000)
      act(() => {
        useVoiceCallStore.setState({ ringTimeout: timeoutId })
      })
      act(() => {
        useVoiceCallStore.getState().resetCall()
      })
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('calls resetQuality on network quality store', () => {
      act(() => {
        useVoiceCallStore.getState().resetCall()
      })
      expect(mockResetQuality).toHaveBeenCalled()
    })

    it('calls disconnectWebRTC on reset', () => {
      act(() => {
        useVoiceCallStore.getState().resetCall()
      })
      expect(mockDisconnectWebRTC).toHaveBeenCalled()
    })
  })

  // ===== startCall =====
  describe('startCall', () => {
    it('does nothing when status is not idle', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'connected' })
      })
      await act(async () => {
        await useVoiceCallStore.getState().startCall('user-2', 'User 2')
      })
      expect(useVoiceCallStore.getState().status).toBe('connected')
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it('sets error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await act(async () => {
        await useVoiceCallStore.getState().startCall('user-2', 'User 2')
      })
      expect(useVoiceCallStore.getState().error).toBe('Utilisateur non connecté')
    })

    it('starts call successfully with all data', async () => {
      const mockUser = { id: 'user-1' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      // Profile fetch for caller
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { username: 'CallerName', avatar_url: 'caller-avatar.png' },
                }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'call-record-1' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'RecvName', 'recv-avatar.png')
      })

      const state = useVoiceCallStore.getState()
      expect(state.status).toBe('calling')
      expect(state.caller).toEqual({
        id: 'user-1',
        username: 'CallerName',
        avatar_url: 'caller-avatar.png',
      })
      expect(state.receiver).toEqual({
        id: 'recv-1',
        username: 'RecvName',
        avatar_url: 'recv-avatar.png',
      })
      expect(state.isIncoming).toBe(false)
      expect(state.currentCallId).toBe('call-record-1')
      expect(state.error).toBeNull()

      // Push notification should have been sent
      expect(mockSendCallPushNotification).toHaveBeenCalledWith(
        'recv-1',
        expect.objectContaining({ id: 'user-1', username: 'CallerName' }),
        'call-record-1'
      )

      // WebRTC should have been initialized (currentUserId, otherUserId, storeRef, isOffer=true)
      expect(mockInitializeNativeWebRTC).toHaveBeenCalledWith(
        'user-1',
        'recv-1',
        expect.anything(),
        true
      )
    })

    it('uses default username when profile is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'Recv')
      })

      expect(useVoiceCallStore.getState().caller?.username).toBe('Utilisateur')
    })

    it('handles call record creation error gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'Test', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'DB error' },
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'Recv')
      })

      // Call should still proceed even if DB insert fails
      expect(useVoiceCallStore.getState().status).toBe('calling')
      expect(useVoiceCallStore.getState().currentCallId).toBeNull()
      // Push notification should NOT be sent because callRecord is null
      expect(mockSendCallPushNotification).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('sets ringTimeout that triggers endCall when status is still calling', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'T', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'R')
      })

      expect(useVoiceCallStore.getState().status).toBe('calling')
      expect(useVoiceCallStore.getState().ringTimeout).not.toBeNull()

      // Advance past RING_TIMEOUT (500ms in our mock)
      await act(async () => {
        vi.advanceTimersByTime(600)
      })

      // endCall should have been triggered, setting status to 'ended', then resetCall after 2s
      expect(useVoiceCallStore.getState().status).toBe('ended')
    })

    it('handles startCall error and resets to idle', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'T', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      mockInitializeNativeWebRTC.mockRejectedValueOnce(new Error('WebRTC failed'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'R')
      })

      expect(useVoiceCallStore.getState().status).toBe('idle')
      expect(useVoiceCallStore.getState().error).toBe('WebRTC failed')
      warnSpy.mockRestore()
    })

    it('handles non-Error throw in startCall', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'T', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      mockInitializeNativeWebRTC.mockRejectedValueOnce('string error')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await useVoiceCallStore.getState().startCall('recv-1', 'R')
      })

      expect(useVoiceCallStore.getState().error).toBe("Erreur lors du démarrage de l'appel")
      warnSpy.mockRestore()
    })
  })

  // ===== setIncomingCall =====
  describe('setIncomingCall', () => {
    it('sets incoming call when idle', () => {
      const caller = { id: 'caller-1', username: 'Caller', avatar_url: null }
      act(() => {
        useVoiceCallStore.getState().setIncomingCall(caller, 'call-123')
      })

      const state = useVoiceCallStore.getState()
      expect(state.status).toBe('ringing')
      expect(state.caller).toEqual(caller)
      expect(state.isIncoming).toBe(true)
      expect(state.currentCallId).toBe('call-123')
      expect(state.ringTimeout).not.toBeNull()
    })

    it('ignores incoming call when already in a call (connected)', () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'connected' })
      })
      const caller = { id: 'caller-2', username: 'Caller2' }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      act(() => {
        useVoiceCallStore.getState().setIncomingCall(caller, 'call-456')
      })
      expect(useVoiceCallStore.getState().status).toBe('connected')
      expect(useVoiceCallStore.getState().caller).toBeNull()
      warnSpy.mockRestore()
    })

    it('ignores incoming call when calling', () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'calling' })
      })
      const caller = { id: 'c', username: 'C' }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      act(() => {
        useVoiceCallStore.getState().setIncomingCall(caller, 'call')
      })
      expect(useVoiceCallStore.getState().status).toBe('calling')
      warnSpy.mockRestore()
    })

    it('ring timeout sets status to missed after RING_TIMEOUT', () => {
      const caller = { id: 'c1', username: 'C1' }
      act(() => {
        useVoiceCallStore.getState().setIncomingCall(caller, 'call-1')
      })
      expect(useVoiceCallStore.getState().status).toBe('ringing')

      act(() => {
        vi.advanceTimersByTime(600)
      }) // > RING_TIMEOUT (500ms)
      expect(useVoiceCallStore.getState().status).toBe('missed')

      // After 2 more seconds, resetCall should fire
      act(() => {
        vi.advanceTimersByTime(2100)
      })
      expect(useVoiceCallStore.getState().status).toBe('idle')
    })
  })

  // ===== acceptCall =====
  describe('acceptCall', () => {
    it('does nothing when not ringing', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'idle' })
      })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().status).toBe('idle')
      warnSpy.mockRestore()
    })

    it('does nothing when ringing but no caller', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'ringing', caller: null })
      })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().status).toBe('ringing')
      warnSpy.mockRestore()
    })

    it('accepts call successfully and starts duration tracking', async () => {
      const caller = { id: 'caller-1', username: 'CallerName', avatar_url: null }
      const timeoutId = setTimeout(() => {}, 30000)
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller,
          isIncoming: true,
          currentCallId: 'call-1',
          ringTimeout: timeoutId,
        })
      })

      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-recv' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { username: 'ReceiverName', avatar_url: 'recv-avatar.png' },
                }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { select: vi.fn().mockResolvedValue({ data: null, error: null }) }
      })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })

      const state = useVoiceCallStore.getState()
      // acceptCall sets status to 'calling' (WebRTC onConnectionStateChange callback sets it to 'connected')
      expect(state.status).toBe('calling')
      expect(state.receiver).toEqual({
        id: 'user-recv',
        username: 'ReceiverName',
        avatar_url: 'recv-avatar.png',
      })
      expect(state.ringTimeout).toBeNull()
    })

    it('clears ring timeout on accept', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const timeoutId = setTimeout(() => {}, 30000)
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
          ringTimeout: timeoutId,
        })
      })

      mockGetUser.mockResolvedValue({ data: { user: { id: 'u' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'U', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId)
    })

    it('sets error when user is not authenticated on accept', async () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
        })
      })
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().error).toBe('Utilisateur non connecté')
    })

    it('uses default username when receiver profile is null', async () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
          currentCallId: null,
        })
      })
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }
        }
        return {}
      })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().receiver?.username).toBe('Utilisateur')
    })

    it('handles accept call error gracefully', async () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
        })
      })
      mockGetUser.mockRejectedValue(new Error('Network error'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().error).toBe('Network error')
      warnSpy.mockRestore()
    })

    it('handles non-Error throw on accept', async () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
        })
      })
      mockGetUser.mockRejectedValue('some string error')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(useVoiceCallStore.getState().error).toBe("Erreur lors de l'acceptation de l'appel")
      warnSpy.mockRestore()
    })

    it('updates call record to answered if currentCallId exists', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          caller: { id: 'c', username: 'C' },
          currentCallId: 'call-42',
        })
      })
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u' } } })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { username: 'U', avatar_url: null } }),
              }),
            }),
          }
        }
        if (table === 'calls') {
          return { update: updateMock }
        }
        return {}
      })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })
      expect(updateMock).toHaveBeenCalledWith({ status: 'answered' })
    })
  })

  // ===== rejectCall =====
  describe('rejectCall', () => {
    it('does nothing when not ringing', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'idle' })
      })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await act(async () => {
        await useVoiceCallStore.getState().rejectCall()
      })
      expect(useVoiceCallStore.getState().status).toBe('idle')
      warnSpy.mockRestore()
    })

    it('rejects call, clears timeout, updates DB, and resets after delay', async () => {
      const timeoutId = setTimeout(() => {}, 30000)
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          currentCallId: 'call-rej',
          ringTimeout: timeoutId,
        })
      })

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'calls') {
          return { update: updateMock }
        }
        return {}
      })

      await act(async () => {
        await useVoiceCallStore.getState().rejectCall()
      })
      expect(updateMock).toHaveBeenCalledWith({ status: 'rejected' })
      expect(useVoiceCallStore.getState().status).toBe('rejected')

      // After 1 second, resetCall fires
      act(() => {
        vi.advanceTimersByTime(1100)
      })
      expect(useVoiceCallStore.getState().status).toBe('idle')
    })

    it('rejects without DB update when no currentCallId', async () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'ringing',
          currentCallId: null,
          ringTimeout: null,
        })
      })

      await act(async () => {
        await useVoiceCallStore.getState().rejectCall()
      })
      expect(mockFrom).not.toHaveBeenCalled()
      expect(useVoiceCallStore.getState().status).toBe('rejected')
    })
  })

  // ===== endCall =====
  describe('endCall', () => {
    it('sets status to ended and triggers resetCall after 2s', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'idle' })
      })
      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(useVoiceCallStore.getState().status).toBe('ended')

      act(() => {
        vi.advanceTimersByTime(2100)
      })
      expect(useVoiceCallStore.getState().status).toBe('idle')
    })

    it('clears durationInterval and ringTimeout', async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const intervalId = setInterval(() => {}, 1000)
      const timeoutId = setTimeout(() => {}, 5000)

      act(() => {
        useVoiceCallStore.setState({
          durationInterval: intervalId,
          ringTimeout: timeoutId,
        })
      })

      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId)
    })

    it('calculates duration for connected calls', async () => {
      const startTime = Date.now() - 5000
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      mockFrom.mockReturnValue({ update: updateMock })

      act(() => {
        useVoiceCallStore.setState({
          status: 'connected',
          callStartTime: startTime,
          currentCallId: 'call-end',
        })
      })

      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String),
          duration_seconds: expect.any(Number),
        })
      )
    })

    it('updates call as missed when status is calling', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })
      mockFrom.mockReturnValue({ update: updateMock })

      act(() => {
        useVoiceCallStore.setState({
          status: 'calling',
          currentCallId: 'call-miss',
        })
      })

      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String),
          status: 'missed',
        })
      )
    })

    it('does not update DB when no currentCallId', async () => {
      act(() => {
        useVoiceCallStore.setState({ currentCallId: null })
      })
      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('calls disconnectWebRTC during endCall', async () => {
      mockDisconnectWebRTC.mockClear()
      await act(async () => {
        await useVoiceCallStore.getState().endCall()
      })
      expect(mockDisconnectWebRTC).toHaveBeenCalled()
      expect(useVoiceCallStore.getState().status).toBe('ended')
    })
  })

  // ===== toggleMute =====
  describe('toggleMute', () => {
    it('calls toggleWebRTCMute and sets isMuted to its return value', async () => {
      mockToggleWebRTCMute.mockReturnValue(true)
      await act(async () => {
        await useVoiceCallStore.getState().toggleMute()
      })
      expect(mockToggleWebRTCMute).toHaveBeenCalled()
      expect(useVoiceCallStore.getState().isMuted).toBe(true)
    })

    it('sets isMuted to false when toggleWebRTCMute returns false', async () => {
      act(() => {
        useVoiceCallStore.setState({ isMuted: true })
      })
      mockToggleWebRTCMute.mockReturnValue(false)
      await act(async () => {
        await useVoiceCallStore.getState().toggleMute()
      })
      expect(useVoiceCallStore.getState().isMuted).toBe(false)
    })
  })

  // ===== toggleSpeaker =====
  describe('toggleSpeaker', () => {
    it('toggles speaker on/off', () => {
      expect(useVoiceCallStore.getState().isSpeakerOn).toBe(true)
      act(() => {
        useVoiceCallStore.getState().toggleSpeaker()
      })
      expect(useVoiceCallStore.getState().isSpeakerOn).toBe(false)
      act(() => {
        useVoiceCallStore.getState().toggleSpeaker()
      })
      expect(useVoiceCallStore.getState().isSpeakerOn).toBe(true)
    })
  })
})

// ===== formatCallDuration =====
describe('formatCallDuration', () => {
  it('formats zero seconds', () => {
    expect(formatCallDuration(0)).toBe('00:00')
  })

  it('formats seconds under a minute', () => {
    expect(formatCallDuration(45)).toBe('00:45')
  })

  it('formats exact minute', () => {
    expect(formatCallDuration(60)).toBe('01:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatCallDuration(125)).toBe('02:05')
  })

  it('formats large durations', () => {
    expect(formatCallDuration(3661)).toBe('61:01')
  })
})

// ===== subscribeToIncomingCalls =====
describe('subscribeToIncomingCalls', () => {
  it('delegates to useCallActions subscribeToIncomingCalls with correct args', () => {
    const result = subscribeToIncomingCalls('user-1')
    expect(mockSubscribeToIncomingCalls).toHaveBeenCalledWith('user-1', expect.anything())
    expect(typeof result).toBe('function') // returns cleanup function
  })
})
