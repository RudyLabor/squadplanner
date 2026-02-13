import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useNetworkQualityStore, type NetworkQualityLevel } from './useNetworkQuality'
import {
  type VoiceChatUser,
  LIVEKIT_URL,
  MAX_RECONNECT_ATTEMPTS,
  savePartyToStorage,
  clearSavedParty,
  setupBrowserCloseListeners,
  forceLeaveVoiceParty as _forceLeaveVoiceParty,
} from './useChatHelpers'
export { getSavedPartyInfo } from './useChatHelpers'

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
  networkQualityChanged: NetworkQualityLevel | null
  cleanupNetworkQuality: (() => void) | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any | null
  reconnectInfo: { channelName: string; userId: string; username: string } | null

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
  clearNetworkQualityNotification: () => void
  setPushToTalk: (enabled: boolean) => void
  pushToTalkStart: () => Promise<void>
  pushToTalkEnd: () => Promise<void>
  toggleNoiseSuppression: () => Promise<void>
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

  joinChannel: async (
    channelName: string,
    userId: string,
    username: string,
    _isPremium: boolean = false
  ) => {
    const state = get()
    if (state.isConnected || state.isConnecting) return false
    if (!LIVEKIT_URL) {
      set({ error: "LiveKit URL non configure. Contactez l'administrateur." })
      return false
    }

    try {
      set({ isConnecting: true, error: null, reconnectInfo: { channelName, userId, username } })
      savePartyToStorage(channelName, userId, username)

      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: { room_name: channelName, participant_identity: userId, participant_name: username },
      })
      if (error) throw new Error("Impossible d'obtenir le token d'acces")
      if (data?.error) throw new Error(`Erreur serveur : ${data.error}`)
      if (!data?.token)
        throw new Error('Token LiveKit non recu. Verifiez la configuration du serveur.')

      // Lazy load LiveKit uniquement quand nécessaire - Performance CRITIQUE
      const { Room, RoomEvent, Track, ConnectionQuality } = await import('livekit-client')
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        reconnectPolicy: {
          nextRetryDelayInMs: (context: { retryCount: number }) => {
            if (context.retryCount > MAX_RECONNECT_ATTEMPTS) return null
            return context.retryCount * 2000
          },
        },
      })

      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: { kind: string; attach: () => HTMLMediaElement },
          _pub: unknown,
          participant: { identity: string }
        ) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach()
            el.id = `audio-${participant.identity}`
            document.body.appendChild(el)
          }
        }
      )
      room.on(RoomEvent.TrackUnsubscribed, (track: { detach: () => HTMLElement[] }) => {
        track.detach().forEach((el: HTMLElement) => el.remove())
      })
      room.on(
        RoomEvent.ParticipantConnected,
        async (participant: {
          identity: string
          name?: string
          isMicrophoneEnabled: boolean
          isSpeaking: boolean
        }) => {
          let displayUsername = participant.name || 'Joueur'
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', participant.identity)
              .single()
            if (profile?.username) displayUsername = profile.username
          } catch {
            /* keep default */
          }
          set((s) => ({
            remoteUsers: [
              ...s.remoteUsers.filter((u) => u.odrop !== participant.identity),
              {
                odrop: participant.identity,
                username: displayUsername,
                isMuted: !participant.isMicrophoneEnabled,
                isSpeaking: participant.isSpeaking,
                volume: 100,
              },
            ],
          }))
        }
      )
      room.on(RoomEvent.ParticipantDisconnected, (participant: { identity: string }) => {
        const audioEl = document.getElementById(`audio-${participant.identity}`)
        if (audioEl) audioEl.remove()
        set((s) => ({ remoteUsers: s.remoteUsers.filter((u) => u.odrop !== participant.identity) }))
      })
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Array<{ identity: string }>) => {
        const ids = new Set(speakers.map((s) => s.identity))
        set((s) => ({
          remoteUsers: s.remoteUsers.map((u) => ({ ...u, isSpeaking: ids.has(u.odrop) })),
          localUser: s.localUser
            ? { ...s.localUser, isSpeaking: ids.has(s.localUser.odrop) }
            : null,
        }))
      })
      room.on(
        RoomEvent.TrackMuted,
        (_pub: unknown, participant: { identity: string; sid?: string }) => {
          if ('identity' in participant && participant !== room.localParticipant) {
            set((s) => ({
              remoteUsers: s.remoteUsers.map((u) =>
                u.odrop === participant.identity ? { ...u, isMuted: true } : u
              ),
            }))
          }
        }
      )
      room.on(
        RoomEvent.TrackUnmuted,
        (_pub: unknown, participant: { identity: string; sid?: string }) => {
          if ('identity' in participant && participant !== room.localParticipant) {
            set((s) => ({
              remoteUsers: s.remoteUsers.map((u) =>
                u.odrop === participant.identity ? { ...u, isMuted: false } : u
              ),
            }))
          }
        }
      )
      room.on(RoomEvent.Reconnecting, () => {
        set({ isReconnecting: true })
      })
      room.on(RoomEvent.Reconnected, () => {
        set({ isReconnecting: false, reconnectAttempts: 0, error: null })
      })
      room.on(RoomEvent.Disconnected, (reason?: any) => {
        if (get().reconnectInfo && reason !== 'CLIENT_INITIATED') {
          set({
            isReconnecting: false,
            isConnected: false,
            error: 'Impossible de se reconnecter. Verifiez votre connexion internet.',
          })
        }
      })
      room.on(
        RoomEvent.ConnectionQualityChanged,
        (
          quality: (typeof ConnectionQuality)[keyof typeof ConnectionQuality],
          participant: { sid: string }
        ) => {
          if (participant.sid === room.localParticipant?.sid) {
            const newQuality = useNetworkQualityStore.getState().updateQuality(quality)
            if (newQuality) set({ networkQualityChanged: newQuality })
          }
        }
      )

      await room.connect(LIVEKIT_URL, data.token)
      await room.localParticipant.setMicrophoneEnabled(true)

      const existingRemoteUsers: VoiceChatUser[] = []
      for (const participant of room.remoteParticipants.values()) {
        let displayUsername = participant.name || 'Joueur'
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', participant.identity)
            .single()
          if (profile?.username) displayUsername = profile.username
        } catch {
          /* keep default */
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
        localUser: { odrop: userId, username, isMuted: false, isSpeaking: false, volume: 100 },
        remoteUsers: existingRemoteUsers,
      })

      try {
        await supabase.rpc('join_voice_party', { p_channel_id: channelName })
      } catch {
        /* non-critical */
      }

      return true
    } catch (error) {
      console.warn('Error joining voice channel:', error)
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
        room.remoteParticipants.forEach((p: { identity: string }) => {
          const el = document.getElementById(`audio-${p.identity}`)
          if (el) el.remove()
        })
        await room.disconnect()
      }
      useNetworkQualityStore.getState().resetQuality()
      clearSavedParty()
      try {
        await supabase.rpc('leave_voice_party')
      } catch {
        /* non-critical */
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
    } catch (error) {
      if (!import.meta.env.PROD) console.warn('Error leaving voice channel:', error)
    }
  },

  toggleMute: async () => {
    const { room, isMuted } = get()
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(isMuted)
      set((s) => ({
        isMuted: !s.isMuted,
        localUser: s.localUser ? { ...s.localUser, isMuted: !s.isMuted } : null,
      }))
    }
  },

  setVolume: (volume: number) => {
    const { room } = get()
    if (room) {
      room.remoteParticipants.forEach(
        (p: {
          audioTrackPublications: Map<string, { track?: { setVolume: (v: number) => void } }>
        }) => {
          p.audioTrackPublications.forEach(
            (pub: { track?: { setVolume: (v: number) => void } }) => {
              if (pub.track) pub.track.setVolume(volume / 100)
            }
          )
        }
      )
    }
  },

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

  toggleNoiseSuppression: async () => {
    const { room, noiseSuppressionEnabled } = get()
    if (!room) return
    try {
      const micPub = room.localParticipant.getTrackPublication('microphone')
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
      console.warn('Failed to toggle noise suppression:', err)
    }
  },
}))

setupBrowserCloseListeners(useVoiceChatStore.getState)

export async function forceLeaveVoiceParty() {
  await _forceLeaveVoiceParty(useVoiceChatStore.getState)
}

export const useSessionVoiceChat = (sessionId: string | null) => {
  const store = useVoiceChatStore()
  const joinSessionVoice = async (userId: string, username: string, isPremium: boolean = false) => {
    if (!sessionId) return
    await store.joinChannel(`session-${sessionId}`, userId, username, isPremium)
  }
  return { ...store, joinSessionVoice }
}
