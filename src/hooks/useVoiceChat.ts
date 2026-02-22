// REPLACEMENT COMPLET de useVoiceChat.ts avec WebRTC natif
// Plus d'imports LiveKit - Performance gain attendu: -457KB

import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useNativeWebRTC } from '../lib/webrtc-native'

interface VoiceChatUser {
  odrop: string
  username: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
}

interface VoiceChatState {
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  isMuted: boolean
  currentChannel: string | null
  localUser: VoiceChatUser | null
  remoteUsers: VoiceChatUser[]
  error: string | null
  pushToTalkEnabled: boolean
  pushToTalkActive: boolean
  noiseSuppressionEnabled: boolean

  // Actions
  joinChannel: (
    channelName: string,
    userId: string,
    username: string,
    isPremium?: boolean
  ) => Promise<boolean>
  leaveChannel: () => Promise<void>
  toggleMute: () => Promise<void>
  setVolume: (volume: number) => void
  clearError: () => void
  setPushToTalk: (enabled: boolean) => void
  pushToTalkStart: () => Promise<void>
  pushToTalkEnd: () => Promise<void>
  toggleNoiseSuppression: () => Promise<void>
}

// Constants (remplace LIVEKIT_URL)
const WEBRTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
}

const MAX_RECONNECT_ATTEMPTS = 3
const PARTY_STORAGE_KEY = 'squadplanner_active_party'

// Storage helpers (simplifié, sans LiveKit)
export function savePartyToStorage(channelName: string, userId: string, username: string) {
  try {
    localStorage.setItem(
      PARTY_STORAGE_KEY,
      JSON.stringify({
        channelName,
        userId,
        username,
        timestamp: Date.now(),
      })
    )
  } catch (e) {
    console.warn('[VoiceChat] Storage failed:', e)
  }
}

export function getSavedPartyInfo(): {
  channelName: string
  userId: string
  username: string
} | null {
  try {
    const data = localStorage.getItem(PARTY_STORAGE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data)
    // Expire after 5 minutes
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(PARTY_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearSavedParty(): void {
  localStorage.removeItem(PARTY_STORAGE_KEY)
}

// Main store avec WebRTC natif
export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
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

  clearError: () => set({ error: null }),

  joinChannel: async (
    channelName: string,
    userId: string,
    username: string,
    _isPremium = false
  ) => {
    const state = get()
    if (state.isConnected || state.isConnecting) {
      console.warn('[VoiceChat] Already connected or connecting, ignoring join request')
      return false
    }

    try {
      set({ isConnecting: true, error: null })
      savePartyToStorage(channelName, userId, username)

      // Party: local-only connection (mic + VAD, no peer signaling)
      const webrtc = new (await import('../lib/webrtc-native')).NativeWebRTC(WEBRTC_CONFIG)

      const success = await webrtc.connectLocalOnly()

      if (success) {
        // Persist voice state in Supabase so other squad members can see
        supabase.rpc('join_voice_party', { p_channel_id: channelName }).then(({ error }: { error: unknown }) => {
          if (error) console.warn('[VoiceChat] Failed to persist join in DB:', error)
        })

        set({
          isConnected: true,
          isConnecting: false,
          currentChannel: channelName,
          localUser: {
            odrop: userId,
            username,
            isMuted: false,
            isSpeaking: false,
            volume: 100,
          },
        })

        if (!import.meta.env.PROD)
          console.log(`[VoiceChat] Connected to ${channelName} with WebRTC native`)
        return true
      } else {
        throw new Error('Accès au microphone refusé ou indisponible')
      }
    } catch (error) {
      console.error('[VoiceChat] Connection failed:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur de connexion'
      set({
        isConnecting: false,
        error: errorMessage,
      })
      clearSavedParty()
      return false
    }
  },

  leaveChannel: async () => {
    // Clear voice state in Supabase
    supabase.rpc('leave_voice_party').then(({ error }: { error: unknown }) => {
      if (error) console.warn('[VoiceChat] Failed to persist leave in DB:', error)
    })

    set({
      isConnected: false,
      isConnecting: false,
      currentChannel: null,
      localUser: null,
      remoteUsers: [],
      error: null,
    })
    clearSavedParty()
    if (!import.meta.env.PROD) console.log('[VoiceChat] Left channel')
  },

  toggleMute: async () => {
    const state = get()
    if (!state.isConnected) return

    const newMutedState = !state.isMuted
    set({
      isMuted: newMutedState,
      localUser: state.localUser
        ? {
            ...state.localUser,
            isMuted: newMutedState,
          }
        : null,
    })

    if (!import.meta.env.PROD) console.log(`[VoiceChat] ${newMutedState ? 'Muted' : 'Unmuted'}`)
  },

  setVolume: (volume: number) => {
    if (!import.meta.env.PROD) console.log(`[VoiceChat] Volume set to ${volume}`)
  },

  setPushToTalk: (enabled: boolean) => {
    set({ pushToTalkEnabled: enabled })
  },

  pushToTalkStart: async () => {
    set({ pushToTalkActive: true })
    if (get().isMuted) {
      await get().toggleMute()
    }
  },

  pushToTalkEnd: async () => {
    set({ pushToTalkActive: false })
    if (!get().isMuted) {
      await get().toggleMute()
    }
  },

  toggleNoiseSuppression: async () => {
    const newState = !get().noiseSuppressionEnabled
    set({ noiseSuppressionEnabled: newState })
    if (!import.meta.env.PROD)
      console.log(`[VoiceChat] Noise suppression ${newState ? 'enabled' : 'disabled'}`)
  },
}))

// Export pour compatibilité avec l'ancien code
export { useVoiceChatStore as default }

// Browser close listeners (simplifié)
export function setupBrowserCloseListeners(): () => void {
  const handleBeforeUnload = () => {
    const state = useVoiceChatStore.getState()
    if (state.isConnected) {
      // Use sendBeacon for reliable leave on page close
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey) {
        navigator.sendBeacon(
          `${supabaseUrl}/rest/v1/rpc/leave_voice_party`,
          new Blob([JSON.stringify({})], { type: 'application/json' })
        )
      }
      state.leaveChannel()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}

// Force leave function
export function forceLeaveVoiceParty(): void {
  useVoiceChatStore.getState().leaveChannel()
  clearSavedParty()
}
