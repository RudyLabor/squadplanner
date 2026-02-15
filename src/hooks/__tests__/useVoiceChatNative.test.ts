import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// ── Hoisted mocks ─────────────────────────────────────────────────────
const { mockNativeWebRTCInstance, MockNativeWebRTCClass } = vi.hoisted(() => {
  const mockNativeWebRTCInstance = {
    connect: vi.fn().mockResolvedValue(true),
    enableMicrophone: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
  }
  // Must be a real constructor function (not arrow) to work with `new`
  function MockNativeWebRTCClass() {
    return mockNativeWebRTCInstance
  }
  return { mockNativeWebRTCInstance, MockNativeWebRTCClass }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: { auth: { getUser: vi.fn() } },
  supabase: { auth: { getUser: vi.fn() } },
}))

vi.mock('../../lib/webrtc-native', () => ({
  NativeWebRTC: MockNativeWebRTCClass,
  useNativeWebRTC: vi.fn(),
}))

import {
  useVoiceChatStore,
  savePartyToStorage,
  getSavedPartyInfo,
  clearSavedParty,
  setupBrowserCloseListeners,
  forceLeaveVoiceParty,
} from '../useVoiceChatNative'

describe('useVoiceChatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset store to initial state
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
      })
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Initial state ──────────────────────────────────────────────────
  describe('initial state', () => {
    it('has correct default values', () => {
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
  })

  // ── clearError ─────────────────────────────────────────────────────
  describe('clearError', () => {
    it('clears error state', () => {
      act(() => {
        useVoiceChatStore.setState({ error: 'Something went wrong' })
      })
      expect(useVoiceChatStore.getState().error).toBe('Something went wrong')

      act(() => {
        useVoiceChatStore.getState().clearError()
      })
      expect(useVoiceChatStore.getState().error).toBeNull()
    })
  })

  // ── joinChannel ────────────────────────────────────────────────────
  describe('joinChannel', () => {
    it('returns false if already connected', async () => {
      act(() => {
        useVoiceChatStore.setState({ isConnected: true })
      })

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })
      expect(result).toBe(false)
    })

    it('returns false if already connecting', async () => {
      act(() => {
        useVoiceChatStore.setState({ isConnecting: true })
      })

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })
      expect(result).toBe(false)
    })

    it('sets isConnecting to true during connection', async () => {
      // Make connect hang to inspect intermediate state
      let resolveConnect: (v: boolean) => void
      mockNativeWebRTCInstance.connect.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveConnect = resolve
        })
      )

      const joinPromise = act(async () => {
        useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })

      // Check intermediate state
      expect(useVoiceChatStore.getState().isConnecting).toBe(true)
      expect(useVoiceChatStore.getState().error).toBeNull()

      // Resolve the connection
      await act(async () => {
        resolveConnect!(true)
      })
      await joinPromise
    })

    it('sets connected state on successful join', async () => {
      mockNativeWebRTCInstance.connect.mockResolvedValue(true)

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('channel-1', 'user-1', 'TestUser')
      })

      expect(result).toBe(true)
      const state = useVoiceChatStore.getState()
      expect(state.isConnected).toBe(true)
      expect(state.isConnecting).toBe(false)
      expect(state.currentChannel).toBe('channel-1')
      expect(state.localUser).toEqual({
        odrop: 'user-1',
        username: 'TestUser',
        isMuted: false,
        isSpeaking: false,
        volume: 100,
      })
    })

    it('saves party info to localStorage on join', async () => {
      mockNativeWebRTCInstance.connect.mockResolvedValue(true)

      await act(async () => {
        await useVoiceChatStore.getState().joinChannel('ch-1', 'u-1', 'User1')
      })

      const stored = JSON.parse(localStorage.getItem('squadplanner_active_party')!)
      expect(stored.channelName).toBe('ch-1')
      expect(stored.userId).toBe('u-1')
      expect(stored.username).toBe('User1')
    })

    it('sets error state when connection fails', async () => {
      mockNativeWebRTCInstance.connect.mockResolvedValue(false)

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('ch-1', 'u-1', 'User')
      })

      expect(result).toBe(false)
      const state = useVoiceChatStore.getState()
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.error).toBe('WebRTC connection failed')
    })

    it('handles exception during connection', async () => {
      mockNativeWebRTCInstance.connect.mockRejectedValue(new Error('Network error'))

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('ch-1', 'u-1', 'User')
      })

      expect(result).toBe(false)
      expect(useVoiceChatStore.getState().error).toBe('Network error')
    })

    it('handles non-Error exceptions', async () => {
      mockNativeWebRTCInstance.connect.mockRejectedValue('string error')

      let result: boolean | undefined
      await act(async () => {
        result = await useVoiceChatStore.getState().joinChannel('ch-1', 'u-1', 'User')
      })

      expect(result).toBe(false)
      expect(useVoiceChatStore.getState().error).toBe('Connection failed')
    })
  })

  // ── leaveChannel ───────────────────────────────────────────────────
  describe('leaveChannel', () => {
    it('resets all connection state', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          currentChannel: 'ch-1',
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: false,
            isSpeaking: true,
            volume: 100,
          },
          remoteUsers: [
            {
              odrop: 'u-2',
              username: 'Other',
              isMuted: false,
              isSpeaking: false,
              volume: 80,
            },
          ],
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().leaveChannel()
      })

      const state = useVoiceChatStore.getState()
      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.currentChannel).toBeNull()
      expect(state.localUser).toBeNull()
      expect(state.remoteUsers).toEqual([])
      expect(state.error).toBeNull()
    })

    it('clears saved party from localStorage', async () => {
      localStorage.setItem(
        'squadplanner_active_party',
        JSON.stringify({ channelName: 'ch', userId: 'u', username: 'U', timestamp: Date.now() })
      )

      await act(async () => {
        await useVoiceChatStore.getState().leaveChannel()
      })

      expect(localStorage.getItem('squadplanner_active_party')).toBeNull()
    })
  })

  // ── toggleMute ─────────────────────────────────────────────────────
  describe('toggleMute', () => {
    it('does nothing when not connected', async () => {
      expect(useVoiceChatStore.getState().isConnected).toBe(false)

      await act(async () => {
        await useVoiceChatStore.getState().toggleMute()
      })

      expect(useVoiceChatStore.getState().isMuted).toBe(false)
    })

    it('toggles mute from false to true', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: false,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: false,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().toggleMute()
      })

      expect(useVoiceChatStore.getState().isMuted).toBe(true)
      expect(useVoiceChatStore.getState().localUser?.isMuted).toBe(true)
    })

    it('toggles mute from true to false', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: true,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: true,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().toggleMute()
      })

      expect(useVoiceChatStore.getState().isMuted).toBe(false)
      expect(useVoiceChatStore.getState().localUser?.isMuted).toBe(false)
    })

    it('handles null localUser gracefully', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          localUser: null,
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().toggleMute()
      })

      expect(useVoiceChatStore.getState().isMuted).toBe(true)
      expect(useVoiceChatStore.getState().localUser).toBeNull()
    })
  })

  // ── setVolume ──────────────────────────────────────────────────────
  describe('setVolume', () => {
    it('logs volume change without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      useVoiceChatStore.getState().setVolume(75)
      expect(consoleSpy).toHaveBeenCalledWith('[VoiceChat] Volume set to 75')
      consoleSpy.mockRestore()
    })
  })

  // ── setPushToTalk ──────────────────────────────────────────────────
  describe('setPushToTalk', () => {
    it('enables push to talk', () => {
      act(() => {
        useVoiceChatStore.getState().setPushToTalk(true)
      })
      expect(useVoiceChatStore.getState().pushToTalkEnabled).toBe(true)
    })

    it('disables push to talk', () => {
      act(() => {
        useVoiceChatStore.setState({ pushToTalkEnabled: true })
      })
      act(() => {
        useVoiceChatStore.getState().setPushToTalk(false)
      })
      expect(useVoiceChatStore.getState().pushToTalkEnabled).toBe(false)
    })
  })

  // ── pushToTalkStart / pushToTalkEnd ────────────────────────────────
  describe('pushToTalkStart', () => {
    it('sets pushToTalkActive and unmutes if muted', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: true,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: true,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkStart()
      })

      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(true)
      expect(useVoiceChatStore.getState().isMuted).toBe(false)
    })

    it('does not toggle mute if already unmuted', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: false,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: false,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkStart()
      })

      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(true)
      expect(useVoiceChatStore.getState().isMuted).toBe(false) // unchanged
    })
  })

  describe('pushToTalkEnd', () => {
    it('sets pushToTalkActive to false and mutes if unmuted', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: false,
          pushToTalkActive: true,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: false,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkEnd()
      })

      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(false)
      expect(useVoiceChatStore.getState().isMuted).toBe(true)
    })

    it('does not toggle mute if already muted', async () => {
      act(() => {
        useVoiceChatStore.setState({
          isConnected: true,
          isMuted: true,
          pushToTalkActive: true,
          localUser: {
            odrop: 'u-1',
            username: 'User',
            isMuted: true,
            isSpeaking: false,
            volume: 100,
          },
        })
      })

      await act(async () => {
        await useVoiceChatStore.getState().pushToTalkEnd()
      })

      expect(useVoiceChatStore.getState().pushToTalkActive).toBe(false)
      expect(useVoiceChatStore.getState().isMuted).toBe(true) // unchanged
    })
  })

  // ── toggleNoiseSuppression ─────────────────────────────────────────
  describe('toggleNoiseSuppression', () => {
    it('toggles noise suppression on', async () => {
      await act(async () => {
        await useVoiceChatStore.getState().toggleNoiseSuppression()
      })
      expect(useVoiceChatStore.getState().noiseSuppressionEnabled).toBe(true)
    })

    it('toggles noise suppression off', async () => {
      act(() => {
        useVoiceChatStore.setState({ noiseSuppressionEnabled: true })
      })

      await act(async () => {
        await useVoiceChatStore.getState().toggleNoiseSuppression()
      })
      expect(useVoiceChatStore.getState().noiseSuppressionEnabled).toBe(false)
    })
  })
})

// ── Storage helpers ───────────────────────────────────────────────────
describe('savePartyToStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves party info to localStorage', () => {
    savePartyToStorage('channel-1', 'user-1', 'TestUser')
    const stored = JSON.parse(localStorage.getItem('squadplanner_active_party')!)
    expect(stored.channelName).toBe('channel-1')
    expect(stored.userId).toBe('user-1')
    expect(stored.username).toBe('TestUser')
    expect(stored.timestamp).toBeTypeOf('number')
  })

  it('handles localStorage errors without throwing', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => savePartyToStorage('ch', 'u', 'name')).not.toThrow()
    expect(warnSpy).toHaveBeenCalled()

    setItemSpy.mockRestore()
    warnSpy.mockRestore()
  })
})

describe('getSavedPartyInfo', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is saved', () => {
    expect(getSavedPartyInfo()).toBeNull()
  })

  it('returns saved party info within expiry window', () => {
    const data = {
      channelName: 'ch-1',
      userId: 'u-1',
      username: 'User',
      timestamp: Date.now(),
    }
    localStorage.setItem('squadplanner_active_party', JSON.stringify(data))

    const result = getSavedPartyInfo()
    expect(result).not.toBeNull()
    expect(result!.channelName).toBe('ch-1')
    expect(result!.userId).toBe('u-1')
    expect(result!.username).toBe('User')
  })

  it('returns null and removes expired party info (>5 min)', () => {
    const data = {
      channelName: 'ch-1',
      userId: 'u-1',
      username: 'User',
      timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
    }
    localStorage.setItem('squadplanner_active_party', JSON.stringify(data))

    const result = getSavedPartyInfo()
    expect(result).toBeNull()
    expect(localStorage.getItem('squadplanner_active_party')).toBeNull()
  })

  it('returns null on invalid JSON', () => {
    localStorage.setItem('squadplanner_active_party', 'not-json')
    expect(getSavedPartyInfo()).toBeNull()
  })
})

describe('clearSavedParty', () => {
  it('removes saved party from localStorage', () => {
    localStorage.setItem('squadplanner_active_party', '{"data":"test"}')
    clearSavedParty()
    expect(localStorage.getItem('squadplanner_active_party')).toBeNull()
  })
})

// ── setupBrowserCloseListeners ────────────────────────────────────────
describe('setupBrowserCloseListeners', () => {
  it('adds beforeunload listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    setupBrowserCloseListeners()
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    addSpy.mockRestore()
  })
})

// ── forceLeaveVoiceParty ──────────────────────────────────────────────
describe('forceLeaveVoiceParty', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('leaves channel and clears saved party', () => {
    act(() => {
      useVoiceChatStore.setState({
        isConnected: true,
        currentChannel: 'ch-1',
      })
    })
    localStorage.setItem('squadplanner_active_party', '{"data":"test"}')

    forceLeaveVoiceParty()

    expect(useVoiceChatStore.getState().isConnected).toBe(false)
    expect(useVoiceChatStore.getState().currentChannel).toBeNull()
    expect(localStorage.getItem('squadplanner_active_party')).toBeNull()
  })
})
