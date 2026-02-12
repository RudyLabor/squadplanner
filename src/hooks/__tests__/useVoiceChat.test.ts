import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    channel: vi.fn(),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}))

vi.mock('../useNetworkQuality', () => ({
  useNetworkQualityStore: {
    getState: () => ({ resetQuality: vi.fn() }),
  },
  setupNetworkQualityListener: vi.fn().mockReturnValue(vi.fn()),
}))

import { useVoiceChatStore, getSavedPartyInfo } from '../useVoiceChat'

describe('useVoiceChatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    act(() => {
      useVoiceChatStore.setState({
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        isMuted: false,
        currentChannel: null,
        localUser: null,
        remoteUsers: [],
        error: null,
        pushToTalkEnabled: false,
        pushToTalkActive: false,
        noiseSuppressionEnabled: false,
        networkQualityChanged: null,
        cleanupNetworkQuality: null,
        room: null,
        reconnectInfo: null,
      })
    })
  })

  it('has correct initial state', () => {
    const state = useVoiceChatStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.isConnecting).toBe(false)
    expect(state.isReconnecting).toBe(false)
    expect(state.reconnectAttempts).toBe(0)
    expect(state.isMuted).toBe(false)
    expect(state.currentChannel).toBeNull()
    expect(state.localUser).toBeNull()
    expect(state.remoteUsers).toEqual([])
    expect(state.error).toBeNull()
    expect(state.pushToTalkEnabled).toBe(false)
    expect(state.pushToTalkActive).toBe(false)
    expect(state.noiseSuppressionEnabled).toBe(false)
  })

  describe('clearError', () => {
    it('clears error state', () => {
      act(() => {
        useVoiceChatStore.setState({ error: 'Connection error' })
      })

      act(() => {
        useVoiceChatStore.getState().clearError()
      })

      expect(useVoiceChatStore.getState().error).toBeNull()
    })
  })

  describe('clearNetworkQualityNotification', () => {
    it('clears network quality notification', () => {
      act(() => {
        useVoiceChatStore.setState({ networkQualityChanged: 'poor' as any })
      })

      act(() => {
        useVoiceChatStore.getState().clearNetworkQualityNotification()
      })

      expect(useVoiceChatStore.getState().networkQualityChanged).toBeNull()
    })
  })

  describe('setPushToTalk', () => {
    it('enables push-to-talk mode', () => {
      act(() => {
        useVoiceChatStore.getState().setPushToTalk(true)
      })

      expect(useVoiceChatStore.getState().pushToTalkEnabled).toBe(true)
    })

    it('disables push-to-talk mode', () => {
      act(() => {
        useVoiceChatStore.setState({ pushToTalkEnabled: true })
      })

      act(() => {
        useVoiceChatStore.getState().setPushToTalk(false)
      })

      expect(useVoiceChatStore.getState().pushToTalkEnabled).toBe(false)
    })
  })

  describe('joinChannel', () => {
    it('does nothing when already connected', async () => {
      act(() => {
        useVoiceChatStore.setState({ isConnected: true })
      })

      let result = false
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })

      expect(result).toBe(false)
    })

    it('does nothing when already connecting', async () => {
      act(() => {
        useVoiceChatStore.setState({ isConnecting: true })
      })

      let result = false
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })

      expect(result).toBe(false)
    })
  })

  describe('setVolume', () => {
    it('does nothing without client', () => {
      act(() => {
        useVoiceChatStore.setState({ room: null })
      })

      // Should not throw
      act(() => {
        useVoiceChatStore.getState().setVolume(50)
      })
    })
  })

  describe('pushToTalkStart', () => {
    it('does nothing when push-to-talk is not enabled', async () => {
      act(() => {
        useVoiceChatStore.setState({ pushToTalkEnabled: false })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkStart()
      })

      // Should not change any state
      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(false)
    })
  })

  describe('pushToTalkEnd', () => {
    it('does nothing when push-to-talk is not enabled', async () => {
      act(() => {
        useVoiceChatStore.setState({ pushToTalkEnabled: false })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkEnd()
      })

      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(false)
    })
  })

  describe('toggleNoiseSuppression', () => {
    it('does nothing without audio track', async () => {
      act(() => {
        useVoiceChatStore.setState({ room: null })
      })

      await act(async () => {
        await useVoiceChatStore.getState().toggleNoiseSuppression()
      })

      expect(useVoiceChatStore.getState().noiseSuppressionEnabled).toBe(false)
    })
  })
})

describe('getSavedPartyInfo', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no saved party', () => {
    expect(getSavedPartyInfo()).toBeNull()
  })

  it('returns null when party info is expired', () => {
    localStorage.setItem(
      'squadplanner_active_party',
      JSON.stringify({
        channelName: 'channel-1',
        userId: 'user-1',
        username: 'Test',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      })
    )

    expect(getSavedPartyInfo()).toBeNull()
  })

  it('returns party info when recent', () => {
    const partyInfo = {
      channelName: 'channel-1',
      userId: 'user-1',
      username: 'Test',
      timestamp: Date.now(),
    }
    localStorage.setItem('squadplanner_active_party', JSON.stringify(partyInfo))

    const result = getSavedPartyInfo()
    expect(result).toBeTruthy()
    expect(result!.channelName).toBe('channel-1')
    expect(result!.userId).toBe('user-1')
  })

  it('returns null on parse error', () => {
    localStorage.setItem('squadplanner_active_party', 'invalid json')

    expect(getSavedPartyInfo()).toBeNull()
  })
})
