import { create } from 'zustand'
import AgoraRTC from 'agora-rtc-sdk-ng'
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'
import { supabase } from '../lib/supabase'
import {
  useNetworkQualityStore,
  setupNetworkQualityListener,
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
  cleanupNetworkQuality: (() => void) | null

  // Call participants
  caller: CallUser | null
  receiver: CallUser | null
  isIncoming: boolean
  currentCallId: string | null

  // Internal refs (not reactive)
  client: IAgoraRTCClient | null
  localAudioTrack: IMicrophoneAudioTrack | null
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

// Agora App ID
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

// Generate channel name from two user IDs (sorted for consistency)
function generateChannelName(userId1: string, userId2: string): string {
  // Use short hashes for channel name to stay within Agora's 64 char limit
  const hash1 = hashUserId(userId1)
  const hash2 = hashUserId(userId2)
  const sortedHashes = [hash1, hash2].sort()
  return `call_${sortedHashes.join('_')}`
}

// Convert UUID to a numeric UID for Agora (Agora prefers numeric UIDs)
function uuidToNumericUid(uuid: string): number {
  // Remove hyphens and take first 8 chars, convert to number
  const cleanUuid = uuid.replace(/-/g, '')
  // Use parseInt with base 16 on first 8 chars, then modulo to keep it reasonable
  const num = parseInt(cleanUuid.substring(0, 8), 16)
  // Agora UID should be a positive 32-bit integer
  return Math.abs(num) % 2147483647
}

// Hash user ID to a shorter string for channel names
function hashUserId(userId: string): string {
  // Simple hash: take first 8 chars without hyphens
  return userId.replace(/-/g, '').substring(0, 8)
}

// Ringtone timeout (30 seconds)
const RING_TIMEOUT = 30000

// Constantes pour la reconnexion
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY_MS = 2000

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
  cleanupNetworkQuality: null,
  caller: null,
  receiver: null,
  isIncoming: false,
  currentCallId: null,
  client: null,
  localAudioTrack: null,
  durationInterval: null,
  ringTimeout: null,

  clearError: () => set({ error: null }),

  clearNetworkQualityNotification: () => set({ networkQualityChanged: null }),

  resetCall: () => {
    const { durationInterval, ringTimeout, client, localAudioTrack, cleanupNetworkQuality } = get()

    // Clear intervals and timeouts
    if (durationInterval) clearInterval(durationInterval)
    if (ringTimeout) clearTimeout(ringTimeout)

    // Cleanup network quality listener
    if (cleanupNetworkQuality) {
      cleanupNetworkQuality()
    }

    // Reset network quality store
    useNetworkQualityStore.getState().resetQuality()

    // Cleanup Agora
    if (localAudioTrack) {
      localAudioTrack.stop()
      localAudioTrack.close()
    }
    if (client) {
      client.leave().catch(console.error)
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
      cleanupNetworkQuality: null,
      caller: null,
      receiver: null,
      isIncoming: false,
      currentCallId: null,
      client: null,
      localAudioTrack: null,
      durationInterval: null,
      ringTimeout: null,
    })
  },

  // Start an outgoing call
  startCall: async (receiverId: string, receiverUsername: string, receiverAvatar?: string | null) => {
    console.log('[VoiceCall] startCall called:', { receiverId, receiverUsername, receiverAvatar })
    const state = get()

    if (state.status !== 'idle') {
      console.warn('[VoiceCall] Already in a call, status:', state.status)
      return
    }

    if (!AGORA_APP_ID) {
      console.error('[VoiceCall] No Agora App ID configured!')
      set({ error: 'Agora App ID non configure. Contactez l\'administrateur.' })
      return
    }

    console.log('[VoiceCall] Agora App ID is configured')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ error: 'Utilisateur non connecte' })
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
          status: 'missed', // Default to missed, will update when answered
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error creating call record:', dbError)
      }

      // Envoyer une notification push au destinataire
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
              // Indicateur pour les actions de notification
              actions: [
                { action: 'answer', title: 'Repondre' },
                { action: 'decline', title: 'Refuser' }
              ]
            }
          })
          console.log('[VoiceCall] Push notification sent for incoming call')
        } catch (pushError) {
          console.warn('[VoiceCall] Failed to send push notification:', pushError)
          // On continue meme si la push echoue
        }
      }

      console.log('[VoiceCall] Setting state to calling with receiver:', receiver)
      set({
        status: 'calling',
        caller,
        receiver,
        isIncoming: false,
        currentCallId: callRecord?.id || null,
        error: null,
      })
      console.log('[VoiceCall] State set to calling')

      // Setup ring timeout
      const ringTimeout = setTimeout(() => {
        const currentState = get()
        if (currentState.status === 'calling') {
          // Mark as missed and end
          get().endCall()
        }
      }, RING_TIMEOUT)

      set({ ringTimeout })

      // Initialize Agora client and wait for the other user
      await initializeAgoraClient(user.id, receiver.id)

    } catch (error) {
      console.error('Error starting call:', error)
      set({
        status: 'idle',
        error: error instanceof Error ? error.message : 'Erreur lors du demarrage de l\'appel',
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
        // Reset after a moment
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
        set({ error: 'Utilisateur non connecte' })
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

      // Initialize Agora and connect
      await initializeAgoraClient(user.id, state.caller.id)

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
    const { client, localAudioTrack, durationInterval, ringTimeout, currentCallId, callStartTime, status } = state

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

    // Cleanup Agora
    try {
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      if (client) {
        await client.leave()
      }
    } catch (error) {
      console.error('Error cleaning up Agora:', error)
    }

    set({ status: 'ended' })

    // Reset after a moment
    setTimeout(() => get().resetCall(), 2000)
  },

  // Toggle mute
  toggleMute: async () => {
    const { localAudioTrack, isMuted } = get()

    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted) // Toggle
      set({ isMuted: !isMuted })
    }
  },

  // Toggle speaker (for future implementation with speaker routing)
  toggleSpeaker: () => {
    set(state => ({ isSpeakerOn: !state.isSpeakerOn }))
  },
}))

// Helper function to initialize Agora client
async function initializeAgoraClient(currentUserId: string, otherUserId: string) {
  const channelName = generateChannelName(currentUserId, otherUserId)

  try {
    // Create client
    const client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    })

    // Gestion des changements d'etat de connexion (reconnexion automatique)
    client.on('connection-state-change', async (curState, prevState, reason) => {
      console.log(`[VoiceCall] Connection state: ${prevState} -> ${curState}, reason: ${reason}`)

      if (curState === 'RECONNECTING') {
        useVoiceCallStore.setState({ isReconnecting: true })
        console.log('[VoiceCall] Reconnexion en cours...')
      } else if (curState === 'CONNECTED' && prevState === 'RECONNECTING') {
        // Reconnexion reussie automatiquement par Agora
        useVoiceCallStore.setState({
          isReconnecting: false,
          reconnectAttempts: 0,
          error: null
        })
        console.log('[VoiceCall] Reconnexion automatique reussie !')
      } else if (curState === 'DISCONNECTED') {
        const currentState = useVoiceCallStore.getState()

        // Si deconnecte pour une erreur reseau et appel en cours
        if (reason !== 'LEAVE' && currentState.status === 'connected') {
          const attempts = currentState.reconnectAttempts + 1

          if (attempts <= MAX_RECONNECT_ATTEMPTS) {
            console.log(`[VoiceCall] Tentative de reconnexion manuelle ${attempts}/${MAX_RECONNECT_ATTEMPTS}...`)
            useVoiceCallStore.setState({
              isReconnecting: true,
              reconnectAttempts: attempts
            })

            // Attendre avant de tenter la reconnexion
            await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS))

            try {
              // Nettoyer l'ancien client
              if (currentState.localAudioTrack) {
                currentState.localAudioTrack.stop()
                currentState.localAudioTrack.close()
              }

              // Tenter de rejoindre a nouveau
              await initializeAgoraClient(currentUserId, otherUserId)
              console.log('[VoiceCall] Reconnexion manuelle reussie !')
            } catch (err) {
              console.error('[VoiceCall] Erreur lors de la reconnexion manuelle:', err)
            }
          } else {
            // Echec apres toutes les tentatives
            console.error('[VoiceCall] Echec de la reconnexion apres 3 tentatives')
            useVoiceCallStore.setState({
              isReconnecting: false,
              reconnectAttempts: 0,
              error: 'Impossible de se reconnecter. Verifiez votre connexion internet.'
            })
            // Terminer l'appel
            currentState.endCall()
          }
        }
      }
    })

    // Set up event listeners
    client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        await client.subscribe(user, mediaType)
        user.audioTrack?.play()

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

    client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        user.audioTrack?.stop()
      }
    })

    client.on('user-left', () => {
      // Other user left, end the call
      const currentState = useVoiceCallStore.getState()
      if (currentState.status === 'connected' || currentState.status === 'calling') {
        currentState.endCall()
      }
    })

    // Setup network quality monitoring
    const cleanupNetworkQuality = setupNetworkQualityListener(
      client,
      (newQuality, oldQuality) => {
        console.log(`[VoiceCall] Qualite reseau: ${oldQuality} -> ${newQuality}`)
        // Notifier le changement de qualite pour afficher un toast
        useVoiceCallStore.setState({ networkQualityChanged: newQuality })
      }
    )

    // Convert UUID to numeric UID for Agora
    const numericUid = uuidToNumericUid(currentUserId)
    console.log('[VoiceCall] Using numeric UID:', numericUid, 'for channel:', channelName)

    // Get token from Edge Function
    console.log('[VoiceCall] Getting token from Edge Function...')
    let token: string | null = null

    try {
      const { data, error } = await supabase.functions.invoke('agora-token', {
        body: { channel_name: channelName, uid: numericUid },
      })

      if (error) {
        console.warn('[VoiceCall] Token fetch error:', error)
      } else {
        token = data?.token || null
        console.log('[VoiceCall] Token received:', token ? `${token.substring(0, 20)}...` : 'null')
      }
    } catch (tokenError) {
      console.warn('[VoiceCall] Failed to get token:', tokenError)
    }

    // Join channel with token (or null if token generation failed)
    try {
      console.log('[VoiceCall] Joining channel...')
      await client.join(AGORA_APP_ID, channelName, token, numericUid)
      console.log('[VoiceCall] Joined successfully!')
    } catch (joinError: unknown) {
      const errorMessage = joinError instanceof Error ? joinError.message : String(joinError)
      console.error('[VoiceCall] Join failed:', errorMessage)
      throw new Error(`Impossible de rejoindre l'appel: ${errorMessage}`)
    }

    // Create and publish audio track
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
    await client.publish([localAudioTrack])

    useVoiceCallStore.setState({
      client,
      localAudioTrack,
      cleanupNetworkQuality,
    })

    console.log('Joined voice call channel:', channelName)

  } catch (error) {
    console.error('Error initializing Agora client:', error)
    useVoiceCallStore.setState({
      error: error instanceof Error ? error.message : 'Erreur de connexion vocale',
    })
    throw error
  }
}

// Subscribe to incoming calls via Supabase Realtime
export function subscribeToIncomingCalls(userId: string) {
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
        const call = payload.new as {
          id: string
          caller_id: string
          status: string
        }

        // Only handle new calls (missed status means not yet answered)
        if (call.status !== 'missed') return

        const currentState = useVoiceCallStore.getState()
        if (currentState.status !== 'idle') {
          // Already in a call, reject
          await supabase
            .from('calls')
            .update({ status: 'rejected' })
            .eq('id', call.id)
          return
        }

        // Get caller info
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', call.caller_id)
          .single()

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
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Format duration for display
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
