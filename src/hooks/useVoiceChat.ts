import { create } from 'zustand'
import AgoraRTC from 'agora-rtc-sdk-ng'
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng'
import { supabase } from '../lib/supabase'

// Types
interface VoiceChatUser {
  odrop: UID
  username: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
}

interface VoiceChatState {
  // State
  isConnected: boolean
  isConnecting: boolean
  isMuted: boolean
  currentChannel: string | null
  localUser: VoiceChatUser | null
  remoteUsers: VoiceChatUser[]
  error: string | null

  // Internal refs (not reactive)
  client: IAgoraRTCClient | null
  localAudioTrack: IMicrophoneAudioTrack | null

  // Actions
  joinChannel: (channelName: string, userId: string, username: string) => Promise<boolean>
  leaveChannel: () => Promise<void>
  toggleMute: () => Promise<void>
  setVolume: (volume: number) => void
  clearError: () => void
}

// Agora App ID - needs to be set in environment
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  isMuted: false,
  currentChannel: null,
  localUser: null,
  remoteUsers: [],
  error: null,
  client: null,
  localAudioTrack: null,

  clearError: () => set({ error: null }),

  joinChannel: async (channelName: string, userId: string, username: string) => {
    const state = get()

    if (state.isConnected || state.isConnecting) {
      console.warn('Already connected or connecting')
      return false
    }

    if (!AGORA_APP_ID) {
      set({ error: 'Agora App ID non configuré. Contactez l\'administrateur.' })
      return false
    }

    try {
      set({ isConnecting: true, error: null })

      // Create client
      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      })

      // Set up event listeners
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType)
          user.audioTrack?.play()

          // Récupérer le vrai username depuis Supabase
          let displayUsername = 'Joueur'
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', String(user.uid))
              .single()
            if (profile?.username) {
              displayUsername = profile.username
            }
          } catch (err) {
            console.warn('Could not fetch username for user:', user.uid, err)
          }

          // Add to remote users
          set(state => ({
            remoteUsers: [
              ...state.remoteUsers.filter(u => u.odrop !== user.uid),
              {
                odrop: user.uid,
                username: displayUsername,
                isMuted: false,
                isSpeaking: false,
                volume: 100,
              },
            ],
          }))
        }
      })

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop()
        }
      })

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        set(state => ({
          remoteUsers: state.remoteUsers.filter(u => u.odrop !== user.uid),
        }))
      })

      // Enable volume indicator
      client.enableAudioVolumeIndicator()
      client.on('volume-indicator', (volumes) => {
        set(state => {
          const localVolume = volumes.find(v => v.uid === state.localUser?.odrop)
          return {
            remoteUsers: state.remoteUsers.map(u => {
              const vol = volumes.find(v => v.uid === u.odrop)
              return vol ? { ...u, isSpeaking: vol.level > 5, volume: vol.level } : u
            }),
            localUser: state.localUser
              ? {
                  ...state.localUser,
                  isSpeaking: (localVolume?.level ?? 0) > 5,
                }
              : null,
          }
        })
      })

      // Get token from Edge Function (for production)
      // For now, use null token (only works in testing mode)
      let token: string | null = null

      try {
        const { data } = await supabase.functions.invoke('agora-token', {
          body: { channel_name: channelName, uid: userId },
        })
        token = data?.token || null
      } catch {
        // Token generation failed, try without token (dev mode only)
        console.warn('Token generation failed, joining without token')
      }

      // Join channel
      const uid = await client.join(AGORA_APP_ID, channelName, token, userId)

      // Create and publish audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await client.publish([localAudioTrack])

      set({
        client,
        localAudioTrack,
        isConnected: true,
        isConnecting: false,
        currentChannel: channelName,
        localUser: {
          odrop: uid,
          username,
          isMuted: false,
          isSpeaking: false,
          volume: 100,
        },
      })

      console.log('Joined voice channel:', channelName)
      return true
    } catch (error) {
      console.error('Error joining voice channel:', error)
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion au vocal',
      })
      return false
    }
  },

  leaveChannel: async () => {
    const { client, localAudioTrack } = get()

    try {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }

      if (client) {
        await client.leave()
      }

      set({
        isConnected: false,
        currentChannel: null,
        localUser: null,
        remoteUsers: [],
        client: null,
        localAudioTrack: null,
        isMuted: false,
      })

      console.log('Left voice channel')
    } catch (error) {
      console.error('Error leaving voice channel:', error)
    }
  },

  toggleMute: async () => {
    const { localAudioTrack, isMuted } = get()

    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted) // Toggle
      set(state => ({
        isMuted: !state.isMuted,
        localUser: state.localUser ? { ...state.localUser, isMuted: !state.isMuted } : null,
      }))
    }
  },

  setVolume: (volume: number) => {
    const { remoteUsers, client } = get()

    if (client) {
      // Set volume for all remote users
      remoteUsers.forEach(user => {
        const remoteUser = client.remoteUsers.find(u => u.uid === user.odrop)
        if (remoteUser?.audioTrack) {
          remoteUser.audioTrack.setVolume(volume)
        }
      })
    }
  },
}))

// Helper hook for session voice chat
export const useSessionVoiceChat = (sessionId: string | null) => {
  const store = useVoiceChatStore()

  const joinSessionVoice = async (userId: string, username: string) => {
    if (!sessionId) return
    const channelName = `session-${sessionId}`
    await store.joinChannel(channelName, userId, username)
  }

  return {
    ...store,
    joinSessionVoice,
  }
}
