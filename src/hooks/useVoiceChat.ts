import { create } from 'zustand'
import AgoraRTC from 'agora-rtc-sdk-ng'
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng'
import { supabase } from '../lib/supabase'
import {
  useNetworkQualityStore,
  setupNetworkQualityListener,
  type NetworkQualityLevel,
} from './useNetworkQuality'

// Convert UUID to a numeric UID for Agora (Agora prefers numeric UIDs)
function uuidToNumericUid(uuid: string): number {
  // Remove hyphens and take first 8 chars, convert to number
  const cleanUuid = uuid.replace(/-/g, '')
  // Use parseInt with base 16 on first 8 chars, then modulo to keep it reasonable
  const num = parseInt(cleanUuid.substring(0, 8), 16)
  // Agora UID should be a positive 32-bit integer
  return Math.abs(num) % 2147483647
}

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
  isReconnecting: boolean
  reconnectAttempts: number
  isMuted: boolean
  currentChannel: string | null
  localUser: VoiceChatUser | null
  remoteUsers: VoiceChatUser[]
  error: string | null

  // Network quality
  networkQualityChanged: NetworkQualityLevel | null
  cleanupNetworkQuality: (() => void) | null

  // Internal refs (not reactive)
  client: IAgoraRTCClient | null
  localAudioTrack: IMicrophoneAudioTrack | null
  reconnectInfo: { channelName: string; userId: string; username: string } | null

  // Actions
  joinChannel: (channelName: string, userId: string, username: string) => Promise<boolean>
  leaveChannel: () => Promise<void>
  toggleMute: () => Promise<void>
  setVolume: (volume: number) => void
  clearError: () => void
  clearNetworkQualityNotification: () => void
}

// Agora App ID - needs to be set in environment
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

// Constantes pour la reconnexion
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY_MS = 2000

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
  networkQualityChanged: null,
  cleanupNetworkQuality: null,
  client: null,
  localAudioTrack: null,
  reconnectInfo: null,

  clearError: () => set({ error: null }),

  clearNetworkQualityNotification: () => set({ networkQualityChanged: null }),

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

      // Stocker les infos pour la reconnexion
      set({ reconnectInfo: { channelName, userId, username } })

      // Gestion des changements d'état de connexion (reconnexion automatique)
      client.on('connection-state-change', async (curState, prevState, reason) => {
        console.log(`[VoiceChat] Connection state: ${prevState} -> ${curState}, reason: ${reason}`)

        if (curState === 'RECONNECTING') {
          set({ isReconnecting: true })
          console.log('[VoiceChat] Reconnexion en cours...')
        } else if (curState === 'CONNECTED' && prevState === 'RECONNECTING') {
          // Reconnexion réussie automatiquement par Agora
          set({
            isReconnecting: false,
            reconnectAttempts: 0,
            error: null
          })
          console.log('[VoiceChat] Reconnexion automatique réussie !')
          // Le toast sera géré par le composant UI
        } else if (curState === 'DISCONNECTED') {
          const currentState = get()

          // Si déconnecté pour une erreur réseau et pas déjà en train de quitter
          if (reason !== 'LEAVE' && currentState.reconnectInfo) {
            const attempts = currentState.reconnectAttempts + 1

            if (attempts <= MAX_RECONNECT_ATTEMPTS) {
              console.log(`[VoiceChat] Tentative de reconnexion manuelle ${attempts}/${MAX_RECONNECT_ATTEMPTS}...`)
              set({
                isReconnecting: true,
                reconnectAttempts: attempts,
                isConnected: false
              })

              // Attendre avant de tenter la reconnexion
              await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS))

              // Tenter de rejoindre à nouveau
              const { reconnectInfo } = get()
              if (reconnectInfo) {
                try {
                  // Nettoyer l'ancien client
                  if (currentState.localAudioTrack) {
                    currentState.localAudioTrack.stop()
                    currentState.localAudioTrack.close()
                  }

                  // Rejoindre à nouveau
                  const success = await get().joinChannel(
                    reconnectInfo.channelName,
                    reconnectInfo.userId,
                    reconnectInfo.username
                  )

                  if (success) {
                    console.log('[VoiceChat] Reconnexion manuelle réussie !')
                  }
                } catch (err) {
                  console.error('[VoiceChat] Erreur lors de la reconnexion manuelle:', err)
                }
              }
            } else {
              // Échec après toutes les tentatives
              console.error('[VoiceChat] Échec de la reconnexion après 3 tentatives')
              set({
                isReconnecting: false,
                reconnectAttempts: 0,
                isConnected: false,
                error: 'Impossible de se reconnecter. Vérifiez votre connexion internet.'
              })
            }
          }
        }
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

      // Setup network quality monitoring
      const cleanupNetworkQuality = setupNetworkQualityListener(
        client,
        (newQuality, oldQuality) => {
          console.log(`[VoiceChat] Qualite reseau: ${oldQuality} -> ${newQuality}`)
          // Notifier le changement de qualite pour afficher un toast
          set({ networkQualityChanged: newQuality })
        }
      )

      // Convert UUID to numeric UID for Agora
      const numericUid = uuidToNumericUid(userId)
      console.log('[VoiceChat] Using numeric UID:', numericUid, 'for channel:', channelName)

      // Get token from Edge Function
      console.log('[VoiceChat] Getting token from Edge Function...')
      let token: string | null = null

      try {
        const { data, error } = await supabase.functions.invoke('agora-token', {
          body: { channel_name: channelName, uid: numericUid },
        })

        if (error) {
          console.warn('[VoiceChat] Token fetch error:', error)
        } else {
          token = data?.token || null
          console.log('[VoiceChat] Token received:', token ? `${token.substring(0, 20)}...` : 'null')
        }
      } catch (tokenError) {
        console.warn('[VoiceChat] Failed to get token:', tokenError)
      }

      // Join channel with token
      console.log('[VoiceChat] Joining channel...')
      const uid = await client.join(AGORA_APP_ID, channelName, token, numericUid)
      console.log('[VoiceChat] Joined successfully!')

      // Create and publish audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await client.publish([localAudioTrack])

      set({
        client,
        localAudioTrack,
        cleanupNetworkQuality,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
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
    const { client, localAudioTrack, cleanupNetworkQuality } = get()

    try {
      // Cleanup network quality listener
      if (cleanupNetworkQuality) {
        cleanupNetworkQuality()
      }

      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }

      if (client) {
        await client.leave()
      }

      // Reset network quality store
      useNetworkQualityStore.getState().resetQuality()

      set({
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        currentChannel: null,
        localUser: null,
        remoteUsers: [],
        client: null,
        localAudioTrack: null,
        isMuted: false,
        reconnectInfo: null,
        cleanupNetworkQuality: null,
        networkQualityChanged: null,
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
