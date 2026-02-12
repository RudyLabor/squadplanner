import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../useNetworkQuality', () => ({
  useNetworkQualityStore: {
    getState: () => ({ resetQuality: vi.fn() }),
  },
  setupNetworkQualityListener: vi.fn().mockReturnValue(vi.fn()),
}))

import { useVoiceCallStore, formatCallDuration } from '../useVoiceCall'

describe('useVoiceCallStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
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
    })
  })

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
    expect(state.caller).toBeNull()
    expect(state.receiver).toBeNull()
    expect(state.isIncoming).toBe(false)
    expect(state.currentCallId).toBeNull()
  })

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
  })

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
    })

    it('ignores incoming call when already in a call', () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'connected' })
      })

      const caller = { id: 'caller-2', username: 'Caller2' }

      act(() => {
        useVoiceCallStore.getState().setIncomingCall(caller, 'call-456')
      })

      expect(useVoiceCallStore.getState().status).toBe('connected')
      expect(useVoiceCallStore.getState().caller).toBeNull()
    })
  })

  describe('rejectCall', () => {
    it('does nothing when not ringing', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'idle' })
      })

      await act(async () => {
        await useVoiceCallStore.getState().rejectCall()
      })

      expect(useVoiceCallStore.getState().status).toBe('idle')
    })
  })

  describe('acceptCall', () => {
    it('does nothing when not ringing', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'idle' })
      })

      await act(async () => {
        await useVoiceCallStore.getState().acceptCall()
      })

      expect(useVoiceCallStore.getState().status).toBe('idle')
    })
  })

  describe('startCall', () => {
    it('does nothing when already in a call', async () => {
      act(() => {
        useVoiceCallStore.setState({ status: 'connected' })
      })

      await act(async () => {
        await useVoiceCallStore.getState().startCall('user-2', 'User 2')
      })

      // Should still be connected, not calling
      expect(useVoiceCallStore.getState().status).toBe('connected')
    })
  })

  describe('resetCall', () => {
    it('resets all call state', () => {
      act(() => {
        useVoiceCallStore.setState({
          status: 'connected',
          isMuted: true,
          callStartTime: Date.now(),
          callDuration: 120,
          error: 'some error',
          isReconnecting: true,
          reconnectAttempts: 2,
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
      expect(state.caller).toBeNull()
      expect(state.receiver).toBeNull()
      expect(state.isIncoming).toBe(false)
      expect(state.currentCallId).toBeNull()
    })
  })
})

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
