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
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected'

export interface CallUser {
  id: string
  username: string
  avatar_url?: string | null
}

interface VoiceCallState {
  // State
  status: CallStatus
  isMuted: boolean
  isSpeakerOn: boolean
  callStartTime: number | null
  callDuration: number
  error: string | null
  isReconnecting: boolean
  reconnectAttempts: number

  // Network quality
  networkQualityChanged: NetworkQualityLevel | null

  // Call participants
  caller: CallUser | null
  receiver: CallUser | null
  isIncoming: boolean
  currentCallId: string | null

  // Internal refs (not reactive)
  room: Room | null
  durationInterval: ReturnType<typeof setInterval> | null
  ringTimeout: ReturnType<typeof setTimeout> | null

  // Actions
  startCall: (receiverId: string, receiverUsername: string, receiverAvatar?: string | null) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleSpeaker: () => void
  setIncomingCall: (caller: CallUser, callId: string) => void
  clearError: () => void
  resetCall: () => void
  clearNetworkQualityNotification: () => void
}

// LiveKit WebSocket URL from environment
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || ''

// Generate channel name from two user IDs (sorted for consistency)
function generateChannelName(userId1: string, userId2: string): string {
  const hash1 = hashUserId(userId1)
  const hash2 = hashUserId(userId2)
  const sortedHashes = [hash1, hash2].sort()
  return `call_${sortedHashes.join('_')}`
}

// Hash user ID to a shorter string for channel names
function hashUserId(userId: string): string {
  return userId.replace(/-/g, '').substring(0, 8)
}

// Ringtone timeout (30 seconds)
const RING_TIMEOUT = 30000

// Constantes pour la reconnexion
const MAX_RECONNECT_ATTEMPTS = 3

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  // Initial state
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

  clearError: () => set({ error: null }),

  clearNetworkQualityNotification: () => set({ networkQualityChanged: null }),

  resetCall: () => {
    const { durationInterval, ringTimeout, room } = get()

    // Clear intervals and timeouts
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    // Reset network quality store
    useNetworkQualityStore.getState().resetQuality()

    // Cleanup LiveKit room
    if (room) {
      // Detach all audio elements
      room.remoteParticipants.forEach((participant) => {
        const audioEl = document.getElementById(`call-audio-${participant.identity}`)
        if (audioEl) audioEl.remove()
      })
      room.disconnect().catch(console.error)
    }

    set({
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
  },

  // Start an outgoing call
  startCall: async (receiverId: string, receiverUsername: string, receiverAvatar?: string | null) => {
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] startCall called:', { receiverId, receiverUsername, receiverAvatar })
    }
    const state = get()

    if (state.status !== 'idle') {
      if (!import.meta.env.PROD) {
        console.warn('[VoiceCall] Already in a call, status:', state.status)
      }
      return
    }

    if (!LIVEKIT_URL) {
      console.error('[VoiceCall] No LiveKit URL configured!')
      set({ error: 'LiveKit URL non configuré. Contactez l\'administrateur.' })
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecté' })
        return
      }

      // Get caller profile
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      const caller: CallUser = {
        id: user.id,
        username: callerProfile?.username || 'Utilisateur',
        avatar_url: callerProfile?.avatar_url,
      }

      const receiver: CallUser = {
        id: receiverId,
        username: receiverUsername,
        avatar_url: receiverAvatar,
      }

      // Create call record in database
      const { data: callRecord, error: dbError } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: receiverId,
          status: 'missed',
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error creating call record:', dbError)
      }

      // Send push notification to receiver
      if (callRecord?.id) {
        try {
          await supabase.functions.invoke('send-push', {
            body: {
              userId: receiverId,
              title: 'Appel entrant',
              body: `${caller.username} vous appelle`,
              icon: '/icon-192.png',
              tag: `incoming-call-${callRecord.id}`,
              data: {
                type: 'incoming_call',
                call_id: callRecord.id,
                caller_id: user.id,
                caller_name: caller.username,
                caller_avatar: caller.avatar_url
              },
              actions: [
                { action: 'answer', title: 'Répondre' },
                { action: 'decline', title: 'Refuser' }
              ]
            }
          })
        } catch (pushError) {
          if (!import.meta.env.PROD) {
            console.warn('[VoiceCall] Failed to send push notification:', pushError)
          }
        }
      }

      set({
        status: 'calling',
        caller,
        receiver,
        isIncoming: false,
        currentCallId: callRecord?.id || null,
        error: null,
      })

      // Setup ring timeout
      const ringTimeout = setTimeout(() => {
        const currentState = get()
        if (currentState.status === 'calling') {
          get().endCall()
        }
      }, RING_TIMEOUT)

      set({ ringTimeout })

      // Initialize LiveKit room and wait for the other user
      await initializeLiveKitRoom(user.id, receiver.id)

    } catch (error) {
      console.error('Error starting call:', error)
      set({
        status: 'idle',
        error: error instanceof Error ? error.message : 'Erreur lors du démarrage de l\'appel',
      })
    }
  },

  // Set incoming call (called when receiving a call signal)
  setIncomingCall: (caller: CallUser, callId: string) => {
    const state = get()

    if (state.status !== 'idle') {
      console.warn('Already in a call, rejecting incoming')
      return
    }

    // Setup ring timeout
    const ringTimeout = setTimeout(() => {
      const currentState = get()
      if (currentState.status === 'ringing') {
        set({ status: 'missed' })
        setTimeout(() => get().resetCall(), 2000)
      }
    }, RING_TIMEOUT)

    set({
      status: 'ringing',
      caller,
      isIncoming: true,
      currentCallId: callId,
      ringTimeout,
    })
  },

  // Accept incoming call
  acceptCall: async () => {
    const state = get()

    if (state.status !== 'ringing' || !state.caller) {
      console.warn('No incoming call to accept')
      return
    }

    const { ringTimeout } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecté' })
        return
      }

      // Get receiver (current user) profile
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      const receiver: CallUser = {
        id: user.id,
        username: receiverProfile?.username || 'Utilisateur',
        avatar_url: receiverProfile?.avatar_url,
      }

      set({ receiver, ringTimeout: null })

      // Update call status in database
      if (state.currentCallId) {
        await supabase
          .from('calls')
          .update({ status: 'answered' })
          .eq('id', state.currentCallId)
      }

      // Initialize LiveKit and connect
      await initializeLiveKitRoom(user.id, state.caller.id)

      // Mark as connected
      const callStartTime = Date.now()

      // Start duration counter
      const durationInterval = setInterval(() => {
        set(s => ({
          callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000)
        }))
      }, 1000)

      set({
        status: 'connected',
        callStartTime,
        durationInterval,
      })

    } catch (error) {
      console.error('Error accepting call:', error)
      set({
        error: error instanceof Error ? error.message : 'Erreur lors de l\'acceptation de l\'appel',
      })
    }
  },

  // Reject incoming call
  rejectCall: async () => {
    const state = get()

    if (state.status !== 'ringing') {
      console.warn('No incoming call to reject')
      return
    }

    const { ringTimeout, currentCallId } = state
    if (ringTimeout) clearTimeout(ringTimeout)

    // Update call status in database
    if (currentCallId) {
      await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', currentCallId)
    }

    set({ status: 'rejected' })

    // Reset after a moment
    setTimeout(() => get().resetCall(), 1000)
  },

  // End current call
  endCall: async () => {
    const state = get()
    const { room, durationInterval, ringTimeout, currentCallId, callStartTime, status } = state

    // Clear intervals and timeouts
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    // Calculate duration if call was connected
    let duration = 0
    if (callStartTime && status === 'connected') {
      duration = Math.floor((Date.now() - callStartTime) / 1000)
    }

    // Update call record
    if (currentCallId) {
      const updateData: Record<string, unknown> = {
        ended_at: new Date().toISOString(),
      }

      if (status === 'connected') {
        updateData.duration_seconds = duration
      } else if (status === 'calling') {
        updateData.status = 'missed'
      }

      await supabase
        .from('calls')
        .update(updateData)
        .eq('id', currentCallId)
    }

    // Cleanup LiveKit
    try {
      if (room) {
        room.remoteParticipants.forEach((participant) => {
          const audioEl = document.getElementById(`call-audio-${participant.identity}`)
          if (audioEl) audioEl.remove()
        })
        await room.disconnect()
      }
    } catch (error) {
      console.error('Error cleaning up LiveKit:', error)
    }

    set({ status: 'ended' })

    // Reset after a moment
    setTimeout(() => get().resetCall(), 2000)
  },

  // Toggle mute
  toggleMute: async () => {
    const { room, isMuted } = get()

    if (room) {
      await room.localParticipant.setMicrophoneEnabled(isMuted) // Toggle
      set({ isMuted: !isMuted })
    }
  },

  // Toggle speaker
  toggleSpeaker: () => {
    set(state => ({ isSpeakerOn: !state.isSpeakerOn }))
  },
}))

// Helper function to initialize LiveKit room for a call
async function initializeLiveKitRoom(currentUserId: string, otherUserId: string) {
  const channelName = generateChannelName(currentUserId, otherUserId)

  try {
    // Get token from Edge Function
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] Getting LiveKit token for channel:', channelName)
    }

    const { data, error } = await supabase.functions.invoke('livekit-token', {
      body: {
        room_name: channelName,
        participant_identity: currentUserId,
        participant_name: currentUserId,
      },
    })

    if (error || !data?.token) {
      const serverError = data?.error ? ` (${data.error})` : ''
      throw new Error(`Impossible d'obtenir le token LiveKit${serverError}`)
    }

    const token = data.token

    // Create LiveKit Room
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      reconnectPolicy: {
        nextRetryDelayInMs: (context) => {
          if (context.retryCount > MAX_RECONNECT_ATTEMPTS) return null
          return context.retryCount * 2000
        },
      },
    })

    // Set up event listeners

    // Track subscribed - play remote audio
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach()
        element.id = `call-audio-${participant.identity}`
        document.body.appendChild(element)

        // If we were calling, now we're connected
        const currentState = useVoiceCallStore.getState()
        if (currentState.status === 'calling') {
          const callStartTime = Date.now()

          // Start duration counter
          const durationInterval = setInterval(() => {
            useVoiceCallStore.setState(s => ({
              callDuration: Math.floor((Date.now() - (s.callStartTime || Date.now())) / 1000)
            }))
          }, 1000)

          useVoiceCallStore.setState({
            status: 'connected',
            callStartTime,
            durationInterval,
          })

          // Clear ring timeout
          if (currentState.ringTimeout) {
            clearTimeout(currentState.ringTimeout)
            useVoiceCallStore.setState({ ringTimeout: null })
          }
        }
      }
    })

    // Track unsubscribed - cleanup
    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach(el => el.remove())
    })

    // Participant left - end the call
    room.on(RoomEvent.ParticipantDisconnected, () => {
      const currentState = useVoiceCallStore.getState()
      if (currentState.status === 'connected' || currentState.status === 'calling') {
        currentState.endCall()
      }
    })

    // Reconnection handling
    room.on(RoomEvent.Reconnecting, () => {
      if (!import.meta.env.PROD) {
        console.log('[VoiceCall] Reconnexion en cours...')
      }
      useVoiceCallStore.setState({ isReconnecting: true })
    })

    room.on(RoomEvent.Reconnected, () => {
      if (!import.meta.env.PROD) {
        console.log('[VoiceCall] Reconnexion réussie !')
      }
      useVoiceCallStore.setState({
        isReconnecting: false,
        reconnectAttempts: 0,
        error: null
      })
    })

    room.on(RoomEvent.Disconnected, (reason) => {
      if (!import.meta.env.PROD) {
        console.log('[VoiceCall] Disconnected, reason:', reason)
      }
      const currentState = useVoiceCallStore.getState()
      if (currentState.status === 'connected' && reason !== 'CLIENT_INITIATED') {
        useVoiceCallStore.setState({
          isReconnecting: false,
          error: 'Impossible de se reconnecter. Vérifiez votre connexion internet.'
        })
        currentState.endCall()
      }
    })

    // Connection quality monitoring
    room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
      if (participant.sid === room.localParticipant?.sid) {
        const previousQuality = useNetworkQualityStore.getState().localQuality
        const newQuality = useNetworkQualityStore.getState().updateQuality(quality)
        if (newQuality) {
          if (!import.meta.env.PROD) {
            console.log(`[VoiceCall] Qualite reseau: ${previousQuality} -> ${newQuality}`)
          }
          useVoiceCallStore.setState({ networkQualityChanged: newQuality })
        }
      }
    })

    // Connect to room
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] Connecting to LiveKit room:', channelName)
    }
    await room.connect(LIVEKIT_URL, token)
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] Connected successfully!')
    }

    // Enable microphone
    await room.localParticipant.setMicrophoneEnabled(true)

    useVoiceCallStore.setState({ room })

    if (!import.meta.env.PROD) {
      console.log('Joined voice call channel:', channelName)
    }

  } catch (error) {
    console.error('Error initializing LiveKit room:', error)
    useVoiceCallStore.setState({
      error: error instanceof Error ? error.message : 'Erreur de connexion vocale',
    })
    throw error
  }
}

// Subscribe to incoming calls via Supabase Realtime
export function subscribeToIncomingCalls(userId: string) {
  if (!import.meta.env.PROD) {
    console.log('[VoiceCall] Subscribing to incoming calls for user:', userId.substring(0, 8) + '...')
  }

  const channel = supabase
    .channel(`calls:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        if (!import.meta.env.PROD) {
          console.log('[VoiceCall] Received INSERT on calls table:', payload)
        }

        const call = payload.new as {
          id: string
          caller_id: string
          status: string
        }

        if (call.status !== 'missed') {
          return
        }

        const currentState = useVoiceCallStore.getState()

        if (currentState.status !== 'idle') {
          await supabase
            .from('calls')
            .update({ status: 'rejected' })
            .eq('id', call.id)
          return
        }

        // Get caller info
        const { data: callerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', call.caller_id)
          .single()

        if (profileError) {
          console.error('[VoiceCall] Error fetching caller profile:', profileError)
          return
        }

        if (callerProfile) {
          currentState.setIncomingCall(
            {
              id: call.caller_id,
              username: callerProfile.username,
              avatar_url: callerProfile.avatar_url,
            },
            call.id
          )
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        const call = payload.new as {
          id: string
          status: string
          ended_at: string | null
        }

        const currentState = useVoiceCallStore.getState()

        if (currentState.currentCallId === call.id) {
          if (call.status === 'rejected' || call.status === 'ended' || call.ended_at) {
            currentState.resetCall()
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `caller_id=eq.${userId}`,
      },
      (payload) => {
        const call = payload.new as {
          id: string
          status: string
          ended_at: string | null
        }

        const currentState = useVoiceCallStore.getState()

        if (currentState.currentCallId === call.id) {
          if (call.status === 'rejected') {
            currentState.resetCall()
          } else if (call.ended_at && currentState.status !== 'idle') {
            currentState.resetCall()
          }
        }
      }
    )
    .subscribe((status) => {
      if (!import.meta.env.PROD) {
        console.log('[VoiceCall] Realtime subscription status:', status)
      }
    })

  return () => {
    if (!import.meta.env.PROD) {
      console.log('[VoiceCall] Unsubscribing from incoming calls')
    }
    supabase.removeChannel(channel)
  }
}

// Format duration for display
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
