import { create } from 'zustand'
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type RemoteTrack,
  type Participant,
  ConnectionQuality,
} from 'livekit-client'
import { supabase } from '../lib/supabase'
import {
  useNetworkQualityStore,
  type NetworkQualityLevel,
} from './useNetworkQuality'

// Types
interface VoiceChatUser {
  odrop: string // participant identity (user ID)
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

  // Phase 3.2: Push-to-talk & Noise suppression
  pushToTalkEnabled: boolean
  pushToTalkActive: boolean
  noiseSuppressionEnabled: boolean

  // Network quality
  networkQualityChanged: NetworkQualityLevel | null
  cleanupNetworkQuality: (() => void) | null

  // Internal refs (not reactive)
  room: Room | null
  reconnectInfo: { channelName: string; userId: string; username: string } | null

  // Actions
  joinChannel: (channelName: string, userId: string, username: string, isPremium?: boolean) => Promise<boolean>
  leaveChannel: () => Promise<void>
  toggleMute: () => Promise<void>
  setVolume: (volume: number) => void
  clearError: () => void
  clearNetworkQualityNotification: () => void
  // Phase 3.2: Push-to-talk
  setPushToTalk: (enabled: boolean) => void
  pushToTalkStart: () => Promise<void>
  pushToTalkEnd: () => Promise<void>
  // Phase 3.2: Noise suppression
  toggleNoiseSuppression: () => Promise<void>
}

// LiveKit WebSocket URL from environment
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || ''

// Constantes pour la reconnexion
const MAX_RECONNECT_ATTEMPTS = 3

// LocalStorage key for party persistence
const PARTY_STORAGE_KEY = 'squadplanner_active_party'

// Helper to save party info for auto-reconnect on refresh
function savePartyToStorage(channelName: string, userId: string, username: string) {
  try {
    localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify({
      channelName,
      userId,
      username,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('[VoiceChat] Could not save party to storage:', e)
  }
}

// Helper to get saved party info
export function getSavedPartyInfo(): { channelName: string; userId: string; username: string } | null {
  try {
    const data = localStorage.getItem(PARTY_STORAGE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data)
    // Only return if party was saved less than 5 minutes ago (page refresh scenario)
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(PARTY_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

// Helper to clear saved party
function clearSavedParty() {
  try {
    localStorage.removeItem(PARTY_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

// Cleanup voice party status in database (used on browser close/logout)
async function cleanupVoicePartyInDb() {
  try {
    await supabase.rpc('leave_voice_party')
  } catch {
    // Ignore errors during cleanup
  }
}

// Setup browser close/tab close listeners to cleanup voice party
let cleanupListenersInitialized = false

function setupBrowserCloseListeners() {
  if (cleanupListenersInitialized || typeof window === 'undefined') return
  cleanupListenersInitialized = true

  // Handle page unload (browser/tab close)
  const handleBeforeUnload = () => {
    const state = useVoiceChatStore.getState()
    if (state.isConnected) {
      // Use fetch with keepalive for reliable delivery on page close
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/rpc/leave_voice_party`

        const sessionData = localStorage.getItem('sb-nxbqiwmfyafgshxzczxo-auth-token')
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData)
            const accessToken = session?.access_token

            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({}),
              keepalive: true,
            }).catch(() => {})
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Disconnect LiveKit room synchronously
      if (state.room) {
        state.room.disconnect()
      }

      clearSavedParty()
    }
  }

  window.addEventListener('pagehide', handleBeforeUnload)
  window.addEventListener('beforeunload', handleBeforeUnload)
}

// Initialize listeners when module loads
setupBrowserCloseListeners()

// Export cleanup function for use in signOut
export async function forceLeaveVoiceParty() {
  const state = useVoiceChatStore.getState()
  if (state.isConnected) {
    await state.leaveChannel()
  } else {
    await cleanupVoicePartyInDb()
  }
  clearSavedParty()
}

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
  networkQualityChanged: null,
  cleanupNetworkQuality: null,
  room: null,
  reconnectInfo: null,

  clearError: () => set({ error: null }),

  clearNetworkQualityNotification: () => set({ networkQualityChanged: null }),

  joinChannel: async (channelName: string, userId: string, username: string, _isPremium: boolean = false) => {
    const state = get()

    if (state.isConnected || state.isConnecting) {
      console.warn('Already connected or connecting')
      return false
    }

    if (!LIVEKIT_URL) {
      set({ error: 'LiveKit URL non configuré. Contactez l\'administrateur.' })
      return false
    }

    try {
      set({ isConnecting: true, error: null })

      // Store reconnect info
      set({ reconnectInfo: { channelName, userId, username } })
      savePartyToStorage(channelName, userId, username)

      // Get token from Edge Function
      if (!import.meta.env.PROD) {
        console.log('[VoiceChat] Getting LiveKit token from Edge Function...')
      }

      let token: string | null = null

      try {
        const { data, error } = await supabase.functions.invoke('livekit-token', {
          body: {
            room_name: channelName,
            participant_identity: userId,
            participant_name: username,
          },
        })

        if (error) {
          if (!import.meta.env.PROD) {
            console.warn('[VoiceChat] Token fetch error:', error)
          }
          throw new Error('Impossible d\'obtenir le token d\'accès')
        }

        token = data?.token || null

        if (data?.error) {
          throw new Error(`Erreur serveur : ${data.error}`)
        }

        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Token received:', token ? `${token.substring(0, 20)}...` : 'null')
        }
      } catch (tokenError) {
        if (!import.meta.env.PROD) {
          console.warn('[VoiceChat] Failed to get token:', tokenError)
        }
        throw tokenError
      }

      if (!token) {
        throw new Error('Token LiveKit non reçu. Vérifiez la configuration du serveur.')
      }

      // Create LiveKit Room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        reconnectPolicy: {
          nextRetryDelayInMs: (context) => {
            if (context.retryCount > MAX_RECONNECT_ATTEMPTS) return null // Stop retrying
            return context.retryCount * 2000 // 2s, 4s, 6s
          },
        },
      })

      // Set up event listeners

      // Track subscribed - play remote audio
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach()
          element.id = `audio-${participant.identity}`
          document.body.appendChild(element)
        }
      })

      // Track unsubscribed - cleanup
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
        track.detach().forEach(el => el.remove())
      })

      // Participant connected
      room.on(RoomEvent.ParticipantConnected, async (participant: RemoteParticipant) => {
        // Fetch username from Supabase
        let displayUsername = participant.name || 'Joueur'
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.identity)
            .single()
          if (profile?.username) {
            displayUsername = profile.username
          }
        } catch {
          // Keep default name
        }

        set(state => ({
          remoteUsers: [
            ...state.remoteUsers.filter(u => u.odrop !== participant.identity),
            {
              odrop: participant.identity,
              username: displayUsername,
              isMuted: !participant.isMicrophoneEnabled,
              isSpeaking: participant.isSpeaking,
              volume: 100,
            },
          ],
        }))
      })

      // Participant disconnected
      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        // Remove audio elements
        const audioEl = document.getElementById(`audio-${participant.identity}`)
        if (audioEl) audioEl.remove()

        set(state => ({
          remoteUsers: state.remoteUsers.filter(u => u.odrop !== participant.identity),
        }))
      })

      // Active speakers changed
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        const speakerIdentities = new Set(speakers.map(s => s.identity))

        set(state => ({
          remoteUsers: state.remoteUsers.map(u => ({
            ...u,
            isSpeaking: speakerIdentities.has(u.odrop),
          })),
          localUser: state.localUser
            ? {
                ...state.localUser,
                isSpeaking: speakerIdentities.has(state.localUser.odrop),
              }
            : null,
        }))
      })

      // Track muted/unmuted for remote participants
      room.on(RoomEvent.TrackMuted, (_publication: unknown, participant: RemoteParticipant | Participant) => {
        if ('identity' in participant && participant !== room.localParticipant) {
          set(state => ({
            remoteUsers: state.remoteUsers.map(u =>
              u.odrop === participant.identity ? { ...u, isMuted: true } : u
            ),
          }))
        }
      })

      room.on(RoomEvent.TrackUnmuted, (_publication: unknown, participant: RemoteParticipant | Participant) => {
        if ('identity' in participant && participant !== room.localParticipant) {
          set(state => ({
            remoteUsers: state.remoteUsers.map(u =>
              u.odrop === participant.identity ? { ...u, isMuted: false } : u
            ),
          }))
        }
      })

      // Connection state changes (reconnection handling)
      room.on(RoomEvent.Reconnecting, () => {
        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Reconnexion en cours...')
        }
        set({ isReconnecting: true })
      })

      room.on(RoomEvent.Reconnected, () => {
        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Reconnexion réussie !')
        }
        set({
          isReconnecting: false,
          reconnectAttempts: 0,
          error: null
        })
      })

      room.on(RoomEvent.Disconnected, (reason) => {
        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Disconnected, reason:', reason)
        }
        const currentState = get()
        if (currentState.reconnectInfo && reason !== 'CLIENT_INITIATED') {
          set({
            isReconnecting: false,
            isConnected: false,
            error: 'Impossible de se reconnecter. Vérifiez votre connexion internet.'
          })
        }
      })

      // Connection quality monitoring
      room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
        if (participant.sid === room.localParticipant?.sid) {
          const previousQuality = useNetworkQualityStore.getState().localQuality
          const newQuality = useNetworkQualityStore.getState().updateQuality(quality)

          if (newQuality) {
            if (!import.meta.env.PROD) {
              console.log(`[VoiceChat] Qualite reseau: ${previousQuality} -> ${newQuality}`)
            }
            set({ networkQualityChanged: newQuality })
          }
        }
      })

      // Connect to room
      if (!import.meta.env.PROD) {
        console.log('[VoiceChat] Connecting to LiveKit room:', channelName)
      }
      await room.connect(LIVEKIT_URL, token)
      if (!import.meta.env.PROD) {
        console.log('[VoiceChat] Connected successfully!')
      }

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true)

      // Add existing remote participants
      const existingRemoteUsers: VoiceChatUser[] = []
      for (const participant of room.remoteParticipants.values()) {
        let displayUsername = participant.name || 'Joueur'
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.identity)
            .single()
          if (profile?.username) {
            displayUsername = profile.username
          }
        } catch {
          // Keep default name
        }
        existingRemoteUsers.push({
          odrop: participant.identity,
          username: displayUsername,
          isMuted: !participant.isMicrophoneEnabled,
          isSpeaking: participant.isSpeaking,
          volume: 100,
        })
      }

      set({
        room,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        currentChannel: channelName,
        localUser: {
          odrop: userId,
          username,
          isMuted: false,
          isSpeaking: false,
          volume: 100,
        },
        remoteUsers: existingRemoteUsers,
      })

      // Sync voice party status to database
      try {
        await supabase.rpc('join_voice_party', { p_channel_id: channelName })
        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Voice party status synced to database')
        }
      } catch (syncError) {
        if (!import.meta.env.PROD) {
          console.warn('[VoiceChat] Could not sync voice party to database:', syncError)
        }
      }

      if (!import.meta.env.PROD) {
        console.log('Joined voice channel:', channelName)
      }
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
    const { room } = get()

    try {
      if (room) {
        // Detach all remote audio elements
        room.remoteParticipants.forEach((participant) => {
          const audioEl = document.getElementById(`audio-${participant.identity}`)
          if (audioEl) audioEl.remove()
        })

        await room.disconnect()
      }

      // Reset network quality store
      useNetworkQualityStore.getState().resetQuality()

      // Clear saved party from localStorage
      clearSavedParty()

      // Clear voice party status from database
      try {
        await supabase.rpc('leave_voice_party')
        if (!import.meta.env.PROD) {
          console.log('[VoiceChat] Voice party status cleared from database')
        }
      } catch (syncError) {
        if (!import.meta.env.PROD) {
          console.warn('[VoiceChat] Could not clear voice party from database:', syncError)
        }
      }

      set({
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        currentChannel: null,
        localUser: null,
        remoteUsers: [],
        room: null,
        isMuted: false,
        reconnectInfo: null,
        cleanupNetworkQuality: null,
        networkQualityChanged: null,
      })

      if (!import.meta.env.PROD) {
        console.log('Left voice channel')
      }
    } catch (error) {
      if (!import.meta.env.PROD) {
        console.error('Error leaving voice channel:', error)
      }
    }
  },

  toggleMute: async () => {
    const { room, isMuted } = get()

    if (room) {
      await room.localParticipant.setMicrophoneEnabled(isMuted) // Toggle: if muted, enable; if unmuted, disable
      set(state => ({
        isMuted: !state.isMuted,
        localUser: state.localUser ? { ...state.localUser, isMuted: !state.isMuted } : null,
      }))
    }
  },

  setVolume: (volume: number) => {
    const { room } = get()

    if (room) {
      // Set volume for all remote participants' audio tracks
      room.remoteParticipants.forEach(participant => {
        participant.audioTrackPublications.forEach(publication => {
          if (publication.track) {
            // LiveKit volume is 0-1, convert from 0-100
            publication.track.setVolume(volume / 100)
          }
        })
      })
    }
  },

  // Phase 3.2: Push-to-talk
  setPushToTalk: (enabled: boolean) => {
    const { room } = get()
    set({ pushToTalkEnabled: enabled })
    if (enabled && room) {
      room.localParticipant.setMicrophoneEnabled(false)
      set({
        isMuted: true,
        pushToTalkActive: false,
        localUser: get().localUser ? { ...get().localUser!, isMuted: true } : null,
      })
    }
  },

  pushToTalkStart: async () => {
    const { room, pushToTalkEnabled } = get()
    if (!pushToTalkEnabled || !room) return
    await room.localParticipant.setMicrophoneEnabled(true)
    set({
      pushToTalkActive: true,
      isMuted: false,
      localUser: get().localUser ? { ...get().localUser!, isMuted: false } : null,
    })
  },

  pushToTalkEnd: async () => {
    const { room, pushToTalkEnabled } = get()
    if (!pushToTalkEnabled || !room) return
    await room.localParticipant.setMicrophoneEnabled(false)
    set({
      pushToTalkActive: false,
      isMuted: true,
      localUser: get().localUser ? { ...get().localUser!, isMuted: true } : null,
    })
  },

  // Phase 3.2: Noise suppression (browser native)
  toggleNoiseSuppression: async () => {
    const { room, noiseSuppressionEnabled } = get()
    if (!room) return

    try {
      const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
      if (micPub?.track) {
        const mediaTrack = micPub.track.mediaStreamTrack
        if (mediaTrack) {
          const constraints = mediaTrack.getConstraints()
          await mediaTrack.applyConstraints({
            ...constraints,
            noiseSuppression: !noiseSuppressionEnabled,
            echoCancellation: true,
            autoGainControl: true,
          })
        }
      }
      set({ noiseSuppressionEnabled: !noiseSuppressionEnabled })
    } catch (err) {
      console.error('Failed to toggle noise suppression:', err)
    }
  },
}))

// Helper hook for session voice chat
export const useSessionVoiceChat = (sessionId: string | null) => {
  const store = useVoiceChatStore()

  const joinSessionVoice = async (userId: string, username: string, isPremium: boolean = false) => {
    if (!sessionId) return
    const channelName = `session-${sessionId}`
    await store.joinChannel(channelName, userId, username, isPremium)
  }

  return {
    ...store,
    joinSessionVoice,
  }
}
